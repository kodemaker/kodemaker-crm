import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  comments,
  companies,
  contactCompanyHistory,
  contacts,
  users,
} from "@/db/schema";
import { createEventCommentCreated } from "@/db/events";
import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { requireApiAuth } from "@/lib/require-api-auth";
import { logger } from "@/lib/logger";

const createCommentSchema = z
  .object({
    content: z.string().min(1),
    companyId: z.number().int().optional(),
    contactId: z.number().int().optional(),
    leadId: z.number().int().optional(),
  })
  .refine(
    (data) => data.contactId || data.companyId || data.leadId,
    {
      message:
        "At least one of contactId, companyId, or leadId must be provided",
    },
  );

const queryParamsSchema = z.object({
  contactId: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const num = Number(val);
    return isNaN(num) || num <= 0 ? undefined : num;
  }),
  companyId: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const num = Number(val);
    return isNaN(num) || num <= 0 ? undefined : num;
  }),
  leadId: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const num = Number(val);
    return isNaN(num) || num <= 0 ? undefined : num;
  }),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult

    const { searchParams } = new URL(req.url);
    const parsed = queryParamsSchema.safeParse({
      contactId: searchParams.get("contactId") ?? undefined,
      companyId: searchParams.get("companyId") ?? undefined,
      leadId: searchParams.get("leadId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, {
        status: 400,
      });
    }

    const { contactId, companyId, leadId } = parsed.data;

    // Require at least one valid scope parameter
    if (!contactId && !companyId && !leadId) {
      return NextResponse.json(
        {
          error:
            "At least one scope parameter (contactId, companyId, or leadId) is required",
        },
        { status: 400 },
      );
    }

    let where = undefined;
    if (contactId) {
      where = eq(comments.contactId, contactId);
    } else if (companyId) {
      where = eq(comments.companyId, companyId);
    } else if (leadId) {
      where = eq(comments.leadId, leadId);
    }

    const rows = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        createdBy: { firstName: users.firstName, lastName: users.lastName },
        contactId: comments.contactId,
        companyId: comments.companyId,
        leadId: comments.leadId,
      })
      .from(comments)
      .leftJoin(users, eq(users.id, comments.createdByUserId))
      .where(where)
      .orderBy(desc(comments.createdAt))
      .limit(200);

    // Collect company and contact IDs directly from comments
    const companyIds = new Set<number>();
    const contactIds = new Set<number>();
    for (const r of rows) {
      if (r.companyId) companyIds.add(r.companyId);
      if (r.contactId) contactIds.add(r.contactId);
    }

    let companiesById: Record<number, { id: number; name: string }> = {};
    let contactsById: Record<
      number,
      { id: number; firstName: string | null; lastName: string | null }
    > = {};
    if (companyIds.size) {
      const coRows = await db
        .select({ id: companies.id, name: companies.name })
        .from(companies)
        .where(inArray(companies.id, Array.from(companyIds)));
      companiesById = Object.fromEntries(coRows.map((c) => [c.id, c]));
    }
    if (contactIds.size) {
      const ctRows = await db
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
        })
        .from(contacts)
        .where(inArray(contacts.id, Array.from(contactIds)));
      contactsById = Object.fromEntries(ctRows.map((c) => [c.id, c]));
    }

    // Fetch contact-company endDate relationships for "sluttet" status
    const contactCompanyPairs: Array<{ contactId: number; companyId: number }> =
      [];
    for (const r of rows) {
      if (r.contactId && r.companyId) {
        contactCompanyPairs.push({
          contactId: r.contactId,
          companyId: r.companyId,
        });
      }
    }
    const uniquePairs = Array.from(
      new Map(
        contactCompanyPairs.map((p) => [`${p.contactId}-${p.companyId}`, p]),
      ).values(),
    );

    const contactCompanyEndDates: Record<
      string,
      string | null
    > = {};
    if (uniquePairs.length > 0) {
      // Fetch all history entries for all contact-company pairs at once
      const pairContactIds = uniquePairs.map((p) => p.contactId);
      const pairCompanyIds = uniquePairs.map((p) => p.companyId);
      const allHistoryEntries = await db
        .select({
          contactId: contactCompanyHistory.contactId,
          companyId: contactCompanyHistory.companyId,
          endDate: contactCompanyHistory.endDate,
          startDate: contactCompanyHistory.startDate,
        })
        .from(contactCompanyHistory)
        .where(
          and(
            inArray(contactCompanyHistory.contactId, pairContactIds),
            inArray(contactCompanyHistory.companyId, pairCompanyIds),
          ),
        )
        .orderBy(
          contactCompanyHistory.contactId,
          contactCompanyHistory.companyId,
          desc(contactCompanyHistory.startDate),
        );

      // Group by contact-company pair and take the most recent entry
      const historyByPair: Record<string, Array<typeof allHistoryEntries[0]>> =
        {};
      for (const entry of allHistoryEntries) {
        const key = `${entry.contactId}-${entry.companyId}`;
        if (!historyByPair[key]) {
          historyByPair[key] = [];
        }
        historyByPair[key].push(entry);
      }

      // Get the most recent endDate for each pair
      for (const pair of uniquePairs) {
        const key = `${pair.contactId}-${pair.companyId}`;
        const entries = historyByPair[key];
        if (entries && entries.length > 0) {
          // Entries are already sorted by startDate DESC, so first one is most recent
          contactCompanyEndDates[key] = entries[0].endDate ?? null;
        } else {
          contactCompanyEndDates[key] = null;
        }
      }
    }

    const data = rows.map((r) => {
      let contactEndDate: string | null = null;
      if (r.contactId && r.companyId) {
        const key = `${r.contactId}-${r.companyId}`;
        contactEndDate = contactCompanyEndDates[key] ?? null;
      }
      return {
        id: r.id,
        content: r.content,
        createdAt: r.createdAt,
        createdBy: r.createdBy,
        company: r.companyId ? (companiesById[r.companyId] ?? null) : null,
        contact: r.contactId ? (contactsById[r.contactId] ?? null) : null,
        lead: null,
        contactEndDate,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    logger.error(
      { route: "/api/comments", method: "GET", error },
      "Error fetching comments",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult
    const session = authResult

    const userId = Number(session.user.id);
    const json = await req.json();
    const parsed = createCommentSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, {
        status: 400,
      });
    }
    const [created] = await db
      .insert(comments)
      .values({ ...parsed.data, createdByUserId: userId })
      .returning();
    const entity = parsed.data.leadId
      ? "lead"
      : parsed.data.companyId
      ? "company"
      : "contact";
    await createEventCommentCreated(
      entity,
      (parsed.data.leadId || parsed.data.companyId || parsed.data.contactId)!,
      parsed.data.companyId,
      parsed.data.contactId,
      created.content,
    );
    return NextResponse.json(created);
  } catch (error) {
    logger.error(
      { route: "/api/comments", method: "POST", error },
      "Error creating comment",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
