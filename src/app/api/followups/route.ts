import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { companies, contactCompanyHistory, contacts, followups, leads, users } from "@/db/schema";
import { z } from "zod";
import { requireApiAuth } from "@/lib/require-api-auth";
import { and, asc, desc, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

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
  all: z
    .string()
    .optional()
    .transform((val) => val === "1"),
  excludeMine: z
    .string()
    .optional()
    .transform((val) => val === "1"),
  completed: z
    .string()
    .optional()
    .transform((val) => val === "1"),
  contactId: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) || num <= 0 ? undefined : num;
    }),
  companyId: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) || num <= 0 ? undefined : num;
    }),
  leadId: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) || num <= 0 ? undefined : num;
    }),
  userId: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) || num <= 0 ? undefined : num;
    }),
});

export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;
  const userId = Number(session.user.id);

  try {
    const { searchParams } = new URL(req.url);
    const parsed = queryParamsSchema.safeParse({
      all: searchParams.get("all") ?? undefined,
      excludeMine: searchParams.get("excludeMine") ?? undefined,
      completed: searchParams.get("completed") ?? undefined,
      contactId: searchParams.get("contactId") ?? undefined,
      companyId: searchParams.get("companyId") ?? undefined,
      leadId: searchParams.get("leadId") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        {
          status: 400,
        }
      );
    }

    const {
      all,
      excludeMine,
      completed,
      contactId,
      companyId,
      leadId,
      userId: filterUserId,
    } = parsed.data;

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

    // Determine user filter based on assignedToUserId (who the task is delegated to)
    // - filterUserId: show followups assigned to a specific user
    // - excludeMine: show all followups except those assigned to current user
    // - all: show all followups regardless of assignment
    // - default (mine): show followups assigned to current user
    const userFilter = filterUserId
      ? eq(followups.assignedToUserId, filterUserId)
      : excludeMine
        ? ne(followups.assignedToUserId, userId!)
        : all
          ? undefined
          : eq(followups.assignedToUserId, userId!);

    const where = and(baseCondition, scope, userFilter);

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
      .orderBy(completed ? desc(followups.completedAt) : asc(followups.dueAt), asc(followups.id))
      .limit(200);

    // Collect company, contact, and lead IDs directly from followups
    const companyIds = new Set<number>();
    const contactIds = new Set<number>();
    const leadIds = new Set<number>();
    for (const r of rows) {
      if (r.companyId) companyIds.add(r.companyId);
      if (r.contactId) contactIds.add(r.contactId);
      if (r.leadId) leadIds.add(r.leadId);
    }

    const assignedToUserIds = Array.from(
      new Set(rows.map((r) => r.assignedToUserId).filter(Boolean))
    ) as number[];
    let assignedToUsersById: Record<number, { id: number; firstName: string; lastName: string }> =
      {};
    if (assignedToUserIds.length) {
      const assignedRows = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(inArray(users.id, assignedToUserIds));
      assignedToUsersById = Object.fromEntries(assignedRows.map((u) => [u.id, u]));
    }

    let companiesById: Record<number, { id: number; name: string }> = {};
    let contactsById: Record<
      number,
      { id: number; firstName: string | null; lastName: string | null }
    > = {};
    let leadsById: Record<
      number,
      {
        id: number;
        description: string;
        status: "NEW" | "IN_PROGRESS" | "ON_HOLD" | "LOST" | "WON" | "BORTFALT";
      }
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
    if (leadIds.size) {
      const leadRows = await db
        .select({
          id: leads.id,
          description: leads.description,
          status: leads.status,
        })
        .from(leads)
        .where(inArray(leads.id, Array.from(leadIds)));
      leadsById = Object.fromEntries(leadRows.map((l) => [l.id, l]));
    }

    // Fetch contact-company endDate relationships for "sluttet" status
    const contactCompanyPairs: Array<{ contactId: number; companyId: number }> = [];
    for (const r of rows) {
      if (r.contactId && r.companyId) {
        contactCompanyPairs.push({
          contactId: r.contactId,
          companyId: r.companyId,
        });
      }
    }
    const uniquePairs = Array.from(
      new Map(contactCompanyPairs.map((p) => [`${p.contactId}-${p.companyId}`, p])).values()
    );

    const contactCompanyEndDates: Record<string, string | null> = {};
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
            inArray(contactCompanyHistory.companyId, pairCompanyIds)
          )
        )
        .orderBy(
          contactCompanyHistory.contactId,
          contactCompanyHistory.companyId,
          desc(contactCompanyHistory.startDate)
        );

      // Group by contact-company pair and take the most recent entry
      const historyByPair: Record<string, Array<(typeof allHistoryEntries)[0]>> = {};
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
        assignedTo: r.assignedToUserId ? (assignedToUsersById[r.assignedToUserId] ?? null) : null,
        company: r.companyId ? (companiesById[r.companyId] ?? null) : null,
        contact: r.contactId ? (contactsById[r.contactId] ?? null) : null,
        lead: r.leadId ? (leadsById[r.leadId] ?? null) : null,
        contactEndDate,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    logger.error({ route: "/api/followups", method: "GET", error }, "Error fetching followups");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const json = await req.json();
    const parsed = createFollowupSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        {
          status: 400,
        }
      );
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
        // Default assignedToUserId to current user if not specified
        assignedToUserId: parsed.data.assignedToUserId ?? userId,
      })
      .returning();
    return NextResponse.json(created);
  } catch (error) {
    logger.error({ route: "/api/followups", method: "POST", error }, "Error creating followup");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
