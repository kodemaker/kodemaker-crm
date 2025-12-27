import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  comments,
  companies,
  contactCompanyHistory,
  contacts,
  emails,
  followups,
  leads,
  users,
} from "@/db/schema";
import { z } from "zod";
import { and, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { requireApiAuth } from "@/lib/require-api-auth";
import { logger } from "@/lib/logger";
import type { ApiRecentActivity, LeadStatus } from "@/types/api";

const queryParamsSchema = z.object({
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
  contactIds: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const ids = val
        .split(",")
        .map((id) => {
          const num = Number(id.trim());
          return isNaN(num) || num <= 0 ? null : num;
        })
        .filter((id): id is number => id !== null);
      return ids.length > 0 ? ids : undefined;
    }),
  // Pagination parameters
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 7; // Default for recent activities
      const num = Number(val);
      return isNaN(num) || num <= 0 ? 7 : Math.min(num, 50);
    }),
  page: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 1;
      const num = Number(val);
      return isNaN(num) || num < 1 ? 1 : num;
    }),
});

type RawComment = {
  id: number;
  content: string;
  createdAt: Date;
  createdBy: { firstName: string | null; lastName: string | null };
  contactId: number | null;
  companyId: number | null;
  leadId: number | null;
};

type RawEmail = {
  id: number;
  subject: string | null;
  content: string;
  createdAt: Date;
  sourceUser: { firstName: string | null; lastName: string | null };
  recipientContactId: number | null;
  recipientCompanyId: number | null;
};

type RawFollowup = {
  id: number;
  note: string;
  dueAt: Date;
  completedAt: Date;
  createdAt: Date;
  createdBy: { firstName: string | null; lastName: string | null };
  assignedToUserId: number | null;
  companyId: number | null;
  contactId: number | null;
  leadId: number | null;
};

export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const parsed = queryParamsSchema.safeParse({
      contactId: searchParams.get("contactId") ?? undefined,
      companyId: searchParams.get("companyId") ?? undefined,
      leadId: searchParams.get("leadId") ?? undefined,
      contactIds: searchParams.get("contactIds") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      page: searchParams.get("page") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { contactId, companyId, leadId, contactIds, limit, page } = parsed.data;
    const offset = (page - 1) * limit;

    // Require at least one valid scope parameter
    if (!contactId && !companyId && !leadId && (!contactIds || contactIds.length === 0)) {
      return NextResponse.json(
        {
          error:
            "At least one scope parameter (contactId, companyId, leadId, or contactIds) is required",
        },
        { status: 400 }
      );
    }

    // Build scope conditions for each table
    const commentScope = contactId
      ? eq(comments.contactId, contactId)
      : companyId
        ? eq(comments.companyId, companyId)
        : leadId
          ? eq(comments.leadId, leadId)
          : contactIds
            ? inArray(comments.contactId, contactIds)
            : undefined;

    const emailScope = contactId
      ? eq(emails.recipientContactId, contactId)
      : companyId
        ? eq(emails.recipientCompanyId, companyId)
        : contactIds
          ? inArray(emails.recipientContactId, contactIds)
          : undefined;

    const followupScope = contactId
      ? eq(followups.contactId, contactId)
      : companyId
        ? eq(followups.companyId, companyId)
        : leadId
          ? eq(followups.leadId, leadId)
          : contactIds
            ? inArray(followups.contactId, contactIds)
            : undefined;

    // Run count queries in parallel
    const [commentCount, emailCount, followupCount] = await Promise.all([
      commentScope
        ? db
            .select({ count: count() })
            .from(comments)
            .where(commentScope)
        : Promise.resolve([{ count: 0 }]),
      emailScope
        ? db
            .select({ count: count() })
            .from(emails)
            .where(emailScope)
        : Promise.resolve([{ count: 0 }]),
      followupScope
        ? db
            .select({ count: count() })
            .from(followups)
            .where(and(isNotNull(followups.completedAt), followupScope))
        : Promise.resolve([{ count: 0 }]),
    ]);

    const totalCount =
      (commentCount[0]?.count ?? 0) +
      (emailCount[0]?.count ?? 0) +
      (followupCount[0]?.count ?? 0);

    // Fetch more than needed from each source to ensure we have enough after sorting
    // We fetch (offset + limit) from each to handle worst case where one source dominates
    const fetchLimit = offset + limit;

    const [commentRows, emailRows, followupRows] = await Promise.all([
      commentScope
        ? db
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
            .where(commentScope)
            .orderBy(desc(comments.createdAt), desc(comments.id))
            .limit(fetchLimit)
        : Promise.resolve([]),
      emailScope
        ? db
            .select({
              id: emails.id,
              subject: emails.subject,
              content: emails.content,
              createdAt: emails.createdAt,
              sourceUser: { firstName: users.firstName, lastName: users.lastName },
              recipientContactId: emails.recipientContactId,
              recipientCompanyId: emails.recipientCompanyId,
            })
            .from(emails)
            .leftJoin(users, eq(users.id, emails.sourceUserId))
            .where(emailScope)
            .orderBy(desc(emails.createdAt), desc(emails.id))
            .limit(fetchLimit)
        : Promise.resolve([]),
      followupScope
        ? db
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
            .where(and(isNotNull(followups.completedAt), followupScope))
            .orderBy(desc(followups.completedAt), desc(followups.id))
            .limit(fetchLimit)
        : Promise.resolve([]),
    ]) as [RawComment[], RawEmail[], RawFollowup[]];

    // Merge and sort all items by date
    type MergedItem =
      | { type: "comment"; data: RawComment; date: Date }
      | { type: "email"; data: RawEmail; date: Date }
      | { type: "followup"; data: RawFollowup; date: Date };

    const merged: MergedItem[] = [];
    for (const c of commentRows) {
      merged.push({ type: "comment", data: c, date: new Date(c.createdAt) });
    }
    for (const e of emailRows) {
      merged.push({ type: "email", data: e, date: new Date(e.createdAt) });
    }
    for (const f of followupRows) {
      merged.push({
        type: "followup",
        data: f,
        date: new Date(f.completedAt || f.createdAt),
      });
    }

    // Sort by date descending
    merged.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply pagination
    const paginatedItems = merged.slice(offset, offset + limit);

    // Collect IDs for batch fetching related data
    const companyIds = new Set<number>();
    const allContactIds = new Set<number>();
    const leadIds = new Set<number>();
    const assignedUserIds = new Set<number>();

    for (const item of paginatedItems) {
      if (item.type === "comment") {
        if (item.data.companyId) companyIds.add(item.data.companyId);
        if (item.data.contactId) allContactIds.add(item.data.contactId);
        if (item.data.leadId) leadIds.add(item.data.leadId);
      } else if (item.type === "email") {
        if (item.data.recipientCompanyId) companyIds.add(item.data.recipientCompanyId);
        if (item.data.recipientContactId) allContactIds.add(item.data.recipientContactId);
      } else if (item.type === "followup") {
        if (item.data.companyId) companyIds.add(item.data.companyId);
        if (item.data.contactId) allContactIds.add(item.data.contactId);
        if (item.data.leadId) leadIds.add(item.data.leadId);
        if (item.data.assignedToUserId) assignedUserIds.add(item.data.assignedToUserId);
      }
    }

    // Batch fetch related data
    let companiesById: Record<number, { id: number; name: string }> = {};
    let contactsById: Record<
      number,
      { id: number; firstName: string | null; lastName: string | null }
    > = {};
    let leadsById: Record<number, { id: number; description: string; status: LeadStatus }> = {};
    let assignedUsersById: Record<
      number,
      { id: number; firstName: string; lastName: string }
    > = {};

    const relatedQueries = [];

    if (companyIds.size > 0) {
      relatedQueries.push(
        db
          .select({ id: companies.id, name: companies.name })
          .from(companies)
          .where(inArray(companies.id, Array.from(companyIds)))
          .then((rows) => {
            companiesById = Object.fromEntries(rows.map((c) => [c.id, c]));
          })
      );
    }

    if (allContactIds.size > 0) {
      relatedQueries.push(
        db
          .select({
            id: contacts.id,
            firstName: contacts.firstName,
            lastName: contacts.lastName,
          })
          .from(contacts)
          .where(inArray(contacts.id, Array.from(allContactIds)))
          .then((rows) => {
            contactsById = Object.fromEntries(rows.map((c) => [c.id, c]));
          })
      );
    }

    if (leadIds.size > 0) {
      relatedQueries.push(
        db
          .select({
            id: leads.id,
            description: leads.description,
            status: leads.status,
          })
          .from(leads)
          .where(inArray(leads.id, Array.from(leadIds)))
          .then((rows) => {
            leadsById = Object.fromEntries(rows.map((l) => [l.id, l]));
          })
      );
    }

    if (assignedUserIds.size > 0) {
      relatedQueries.push(
        db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(inArray(users.id, Array.from(assignedUserIds)))
          .then((rows) => {
            assignedUsersById = Object.fromEntries(rows.map((u) => [u.id, u]));
          })
      );
    }

    await Promise.all(relatedQueries);

    // Fetch contact-company endDate relationships
    const contactCompanyPairs: Array<{ contactId: number; companyId: number }> = [];
    for (const item of paginatedItems) {
      let itemContactId: number | null = null;
      let itemCompanyId: number | null = null;

      if (item.type === "comment") {
        itemContactId = item.data.contactId;
        itemCompanyId = item.data.companyId;
      } else if (item.type === "email") {
        itemContactId = item.data.recipientContactId;
        itemCompanyId = item.data.recipientCompanyId;
      } else if (item.type === "followup") {
        itemContactId = item.data.contactId;
        itemCompanyId = item.data.companyId;
      }

      if (itemContactId && itemCompanyId) {
        contactCompanyPairs.push({ contactId: itemContactId, companyId: itemCompanyId });
      }
    }

    const uniquePairs = Array.from(
      new Map(contactCompanyPairs.map((p) => [`${p.contactId}-${p.companyId}`, p])).values()
    );

    const contactCompanyEndDates: Record<string, string | null> = {};
    if (uniquePairs.length > 0) {
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

      const historyByPair: Record<string, Array<(typeof allHistoryEntries)[0]>> = {};
      for (const entry of allHistoryEntries) {
        const key = `${entry.contactId}-${entry.companyId}`;
        if (!historyByPair[key]) {
          historyByPair[key] = [];
        }
        historyByPair[key].push(entry);
      }

      for (const pair of uniquePairs) {
        const key = `${pair.contactId}-${pair.companyId}`;
        const entries = historyByPair[key];
        if (entries && entries.length > 0) {
          contactCompanyEndDates[key] = entries[0].endDate ?? null;
        } else {
          contactCompanyEndDates[key] = null;
        }
      }
    }

    // Build response items
    const items: ApiRecentActivity[] = paginatedItems.map((item) => {
      if (item.type === "comment") {
        const c = item.data;
        const endDateKey = c.contactId && c.companyId ? `${c.contactId}-${c.companyId}` : null;
        return {
          id: `comment-${c.id}`,
          type: "comment" as const,
          createdAt: c.createdAt.toISOString(),
          createdBy: c.createdBy,
          company: c.companyId ? (companiesById[c.companyId] ?? null) : null,
          contact: c.contactId ? (contactsById[c.contactId] ?? null) : null,
          lead: c.leadId ? (leadsById[c.leadId] ?? null) : null,
          contactEndDate: endDateKey ? (contactCompanyEndDates[endDateKey] ?? null) : null,
          comment: { id: c.id, content: c.content },
        };
      } else if (item.type === "email") {
        const e = item.data;
        const endDateKey =
          e.recipientContactId && e.recipientCompanyId
            ? `${e.recipientContactId}-${e.recipientCompanyId}`
            : null;
        return {
          id: `email-${e.id}`,
          type: "email" as const,
          createdAt: e.createdAt.toISOString(),
          createdBy: e.sourceUser,
          company: e.recipientCompanyId ? (companiesById[e.recipientCompanyId] ?? null) : null,
          contact: e.recipientContactId ? (contactsById[e.recipientContactId] ?? null) : null,
          lead: null,
          contactEndDate: endDateKey ? (contactCompanyEndDates[endDateKey] ?? null) : null,
          email: { id: e.id, subject: e.subject, content: e.content },
        };
      } else {
        const f = item.data;
        const endDateKey = f.contactId && f.companyId ? `${f.contactId}-${f.companyId}` : null;
        return {
          id: `followup-${f.id}`,
          type: "followup" as const,
          createdAt: (f.completedAt || f.createdAt).toISOString(),
          createdBy: f.createdBy,
          company: f.companyId ? (companiesById[f.companyId] ?? null) : null,
          contact: f.contactId ? (contactsById[f.contactId] ?? null) : null,
          lead: f.leadId ? (leadsById[f.leadId] ?? null) : null,
          contactEndDate: endDateKey ? (contactCompanyEndDates[endDateKey] ?? null) : null,
          followup: {
            id: f.id,
            note: f.note,
            dueAt: f.dueAt.toISOString(),
            completedAt: f.completedAt.toISOString(),
            assignedTo: f.assignedToUserId ? (assignedUsersById[f.assignedToUserId] ?? null) : null,
          },
        };
      }
    });

    const hasMore = offset + items.length < totalCount;

    return NextResponse.json({ items, hasMore, totalCount });
  } catch (error) {
    logger.error(
      { route: "/api/recent-activities", method: "GET", error },
      "Error fetching recent activities"
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
