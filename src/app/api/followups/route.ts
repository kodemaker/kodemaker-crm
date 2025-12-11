import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  companies,
  contactCompanyHistory,
  contacts,
  followups,
  users,
} from "@/db/schema";
import { z } from "zod";
import { and, asc, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { requireApiAuth } from "@/lib/require-api-auth";
import { createEventFollowupCreated } from "@/db/events";
import { logger } from "@/lib/logger";

const createFollowupSchema = z.object({
  note: z.string().min(1),
  // Accept ISO date string (e.g. 2025-09-16T09:00:00.000Z) and coerce to Date
  dueAt: z.coerce.date(),
  companyId: z.number().int().optional(),
  contactId: z.number().int().optional(),
  leadId: z.number().int().optional(),
  assignedToUserId: z.number().int().optional(),
});

const queryParamsSchema = z.object({
  all: z.string().optional().transform((val) => val === "1"),
  completed: z.string().optional().transform((val) => val === "1"),
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
    const session = authResult

    const userId = Number(session.user.id);
    const { searchParams } = new URL(req.url);
    const parsed = queryParamsSchema.safeParse({
      all: searchParams.get("all") ?? undefined,
      completed: searchParams.get("completed") ?? undefined,
      contactId: searchParams.get("contactId") ?? undefined,
      companyId: searchParams.get("companyId") ?? undefined,
      leadId: searchParams.get("leadId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, {
        status: 400,
      });
    }

    const { all, completed, contactId, companyId, leadId } = parsed.data;

    const baseCondition = completed
      ? isNotNull(followups.completedAt)
      : isNull(followups.completedAt);
    const scope = contactId
      ? eq(followups.contactId, contactId)
      : companyId
      ? eq(followups.companyId, companyId)
      : leadId
      ? eq(followups.leadId, leadId)
      : undefined;
    const mineOnly = and(eq(followups.createdByUserId, userId!), baseCondition);
    const where = all
      ? scope ? and(scope, baseCondition) : baseCondition
      : scope
      ? and(scope, mineOnly)
      : mineOnly;

    const rows = await db
      .select({
        id: followups.id,
        note: followups.note,
        dueAt: followups.dueAt,
        completedAt: followups.completedAt,
        createdAt: followups.createdAt,
        createdBy: { firstName: users.firstName, lastName: users.lastName },
        assignedToUserId: followups.assignedToUserId,
        companyId: followups.companyId,
        contactId: followups.contactId,
        leadId: followups.leadId,
      })
      .from(followups)
      .leftJoin(users, eq(users.id, followups.createdByUserId))
      .where(where)
      .orderBy(
        completed ? desc(followups.completedAt) : asc(followups.dueAt),
        asc(followups.id),
      )
      .limit(200);

    // Collect company and contact IDs directly from followups
    const companyIds = new Set<number>();
    const contactIds = new Set<number>();
    for (const r of rows) {
      if (r.companyId) companyIds.add(r.companyId);
      if (r.contactId) contactIds.add(r.contactId);
    }

    const assignedToUserIds = Array.from(
      new Set(rows.map((r) => r.assignedToUserId).filter(Boolean)),
    ) as number[];
    let assignedToUsersById: Record<
      number,
      { id: number; firstName: string; lastName: string }
    > = {};
    if (assignedToUserIds.length) {
      const assignedRows = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(inArray(users.id, assignedToUserIds));
      assignedToUsersById = Object.fromEntries(
        assignedRows.map((u) => [u.id, u]),
      );
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
        note: r.note,
        dueAt: r.dueAt,
        completedAt: r.completedAt,
        createdAt: r.createdAt,
        createdBy: r.createdBy,
        assignedTo: r.assignedToUserId
          ? (assignedToUsersById[r.assignedToUserId] ?? null)
          : null,
        company: r.companyId ? (companiesById[r.companyId] ?? null) : null,
        contact: r.contactId ? (contactsById[r.contactId] ?? null) : null,
        lead: null,
        contactEndDate,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    logger.error(
      { route: "/api/followups", method: "GET", error },
      "Error fetching followups",
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
    const parsed = createFollowupSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, {
        status: 400,
      });
    }
    const [created] = await db
      .insert(followups)
      .values({
        note: parsed.data.note,
        dueAt: parsed.data.dueAt,
        companyId: parsed.data.companyId,
        contactId: parsed.data.contactId,
        leadId: parsed.data.leadId,
        createdByUserId: userId,
        assignedToUserId: parsed.data.assignedToUserId,
      })
      .returning();
    const entity = parsed.data.leadId
      ? "lead"
      : parsed.data.companyId
      ? "company"
      : "contact";
    await createEventFollowupCreated(
      entity,
      (parsed.data.leadId || parsed.data.companyId || parsed.data.contactId)!,
      parsed.data.companyId,
      parsed.data.contactId,
      created.note,
    );
    return NextResponse.json(created);
  } catch (error) {
    logger.error(
      { route: "/api/followups", method: "POST", error },
      "Error creating followup",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
