import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  activityEvents,
  comments,
  companies,
  contacts,
  emails,
  leads,
  users,
} from "@/db/schema";
import { and, desc, eq, gte, inArray, lt, ne, SQL } from "drizzle-orm";
import { requireApiAuth } from "@/lib/require-api-auth";
import { z } from "zod";
import { logger } from "@/lib/logger";
import type { ActivityEventType } from "@/db/activity-events";

const queryParamsSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 50;
      const num = Number(val);
      return isNaN(num) || num <= 0 ? 50 : Math.min(num, 200);
    }),
  before: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) || num <= 0 ? undefined : num;
    }),
  type: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const types = val.split(",").filter((t) =>
        ["comment_created", "lead_created", "lead_status_changed", "email_received"].includes(t)
      ) as ActivityEventType[];
      return types.length > 0 ? types : undefined;
    }),
  companyId: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) || num <= 0 ? undefined : num;
    }),
  contactId: z
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
  excludeUserId: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) || num <= 0 ? undefined : num;
    }),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const parsed = queryParamsSchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
      before: searchParams.get("before") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      companyId: searchParams.get("companyId") ?? undefined,
      contactId: searchParams.get("contactId") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
      excludeUserId: searchParams.get("excludeUserId") ?? undefined,
      fromDate: searchParams.get("fromDate") ?? undefined,
      toDate: searchParams.get("toDate") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { limit, before, type, companyId, contactId, userId, excludeUserId, fromDate, toDate } = parsed.data;

    // Build filter conditions
    const conditions: SQL[] = [];

    // Cursor pagination
    if (before) {
      conditions.push(lt(activityEvents.id, before));
    }

    // Event type filter
    if (type && type.length > 0) {
      conditions.push(inArray(activityEvents.eventType, type));
    }

    // Company filter
    if (companyId) {
      conditions.push(eq(activityEvents.companyId, companyId));
    }

    // Contact filter (for emails, this matches either sender or recipient context)
    if (contactId) {
      conditions.push(eq(activityEvents.contactId, contactId));
    }

    // User filter (who performed the action)
    if (userId) {
      conditions.push(eq(activityEvents.actorUserId, userId));
    }

    // Exclude user filter (exclude events by a specific user)
    if (excludeUserId) {
      conditions.push(ne(activityEvents.actorUserId, excludeUserId));
    }

    // Date range filters
    if (fromDate) {
      const from = new Date(fromDate);
      if (!isNaN(from.getTime())) {
        conditions.push(gte(activityEvents.createdAt, from));
      }
    }
    if (toDate) {
      const to = new Date(toDate);
      if (!isNaN(to.getTime())) {
        // Add a day to include the full end date
        to.setDate(to.getDate() + 1);
        conditions.push(lt(activityEvents.createdAt, to));
      }
    }

    // Query activity events with all related data
    const rows = await db
      .select({
        id: activityEvents.id,
        eventType: activityEvents.eventType,
        createdAt: activityEvents.createdAt,
        oldStatus: activityEvents.oldStatus,
        newStatus: activityEvents.newStatus,
        // Actor user
        actorUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        // Related entities for context
        companyId: activityEvents.companyId,
        contactId: activityEvents.contactId,
        leadId: activityEvents.leadId,
        commentId: activityEvents.commentId,
        emailId: activityEvents.emailId,
      })
      .from(activityEvents)
      .leftJoin(users, eq(activityEvents.actorUserId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(activityEvents.id))
      .limit(limit + 1); // Fetch one extra to determine hasMore

    const hasMore = rows.length > limit;
    const events = hasMore ? rows.slice(0, limit) : rows;

    // Collect IDs for batch fetching related data
    const commentIds = new Set<number>();
    const leadIds = new Set<number>();
    const emailIds = new Set<number>();
    const companyIds = new Set<number>();
    const contactIds = new Set<number>();

    for (const row of events) {
      if (row.commentId) commentIds.add(row.commentId);
      if (row.leadId) leadIds.add(row.leadId);
      if (row.emailId) emailIds.add(row.emailId);
      if (row.companyId) companyIds.add(row.companyId);
      if (row.contactId) contactIds.add(row.contactId);
    }

    // First fetch comments to get lead IDs from comments on leads
    const commentsData =
      commentIds.size > 0
        ? await db
            .select({
              id: comments.id,
              content: comments.content,
              createdAt: comments.createdAt,
              companyId: comments.companyId,
              contactId: comments.contactId,
              leadId: comments.leadId,
            })
            .from(comments)
            .where(inArray(comments.id, Array.from(commentIds)))
        : [];

    // Add lead IDs from comments on leads
    for (const comment of commentsData) {
      if (comment.leadId) leadIds.add(comment.leadId);
    }

    // Batch fetch remaining related data
    const [leadsData, emailsData, companiesData, contactsData] = await Promise.all([
      leadIds.size > 0
        ? db
            .select({
              id: leads.id,
              description: leads.description,
              status: leads.status,
              companyId: leads.companyId,
              contactId: leads.contactId,
            })
            .from(leads)
            .where(inArray(leads.id, Array.from(leadIds)))
        : [],
      emailIds.size > 0
        ? db
            .select({
              id: emails.id,
              subject: emails.subject,
              content: emails.content,
              createdAt: emails.createdAt,
              recipientContactId: emails.recipientContactId,
              recipientCompanyId: emails.recipientCompanyId,
              sourceUserId: emails.sourceUserId,
            })
            .from(emails)
            .where(inArray(emails.id, Array.from(emailIds)))
        : [],
      companyIds.size > 0
        ? db
            .select({ id: companies.id, name: companies.name })
            .from(companies)
            .where(inArray(companies.id, Array.from(companyIds)))
        : [],
      contactIds.size > 0
        ? db
            .select({
              id: contacts.id,
              firstName: contacts.firstName,
              lastName: contacts.lastName,
            })
            .from(contacts)
            .where(inArray(contacts.id, Array.from(contactIds)))
        : [],
    ]);

    // Create lookup maps
    const commentsById = Object.fromEntries(commentsData.map((c) => [c.id, c]));
    const leadsById = Object.fromEntries(leadsData.map((l) => [l.id, l]));
    const emailsById = Object.fromEntries(emailsData.map((e) => [e.id, e]));
    const companiesById = Object.fromEntries(companiesData.map((c) => [c.id, c]));
    const contactsById = Object.fromEntries(contactsData.map((c) => [c.id, c]));

    // Build response with nested data
    const data = events.map((row) => {
      const comment = row.commentId ? commentsById[row.commentId] ?? null : null;
      // For comments on leads, get lead from comment's leadId
      const leadId = row.leadId ?? comment?.leadId;
      return {
        id: row.id,
        eventType: row.eventType,
        createdAt: row.createdAt,
        actorUser: row.actorUser?.id ? row.actorUser : null,
        oldStatus: row.oldStatus,
        newStatus: row.newStatus,
        // Related data based on event type
        comment,
        lead: leadId ? leadsById[leadId] ?? null : null,
        email: row.emailId ? emailsById[row.emailId] ?? null : null,
        // Context entities
        company: row.companyId ? companiesById[row.companyId] ?? null : null,
        contact: row.contactId ? contactsById[row.contactId] ?? null : null,
      };
    });

    return NextResponse.json({
      events: data,
      hasMore,
    });
  } catch (error) {
    logger.error(
      { route: "/api/activity-events", method: "GET", error },
      "Error fetching activity events"
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
