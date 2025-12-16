import { db, pool } from "@/db/client";
import { activityEvents, comments, companies, contacts, emails, leads, users } from "@/db/schema";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { eq, inArray } from "drizzle-orm";

// Inferred types from schema
export type ActivityEvent = InferSelectModel<typeof activityEvents>;
export type NewActivityEvent = InferInsertModel<typeof activityEvents>;
export type ActivityEventType = ActivityEvent["eventType"];

/**
 * Creates an activity event and broadcasts it via pg_notify.
 * This is the base function - prefer using the typed helper functions below.
 */
async function createActivityEvent(data: NewActivityEvent): Promise<ActivityEvent> {
  const [event] = await db.insert(activityEvents).values(data).returning();

  try {
    // Broadcast to activity_events channel for real-time updates
    await pool.query("SELECT pg_notify($1, $2)", ["activity_events", JSON.stringify(event)]);
  } catch (err) {
    // Notification is best-effort; log but don't break main flow
    console.error("[pg_notify] Failed to broadcast activity event:", err);
  }

  return event;
}

/**
 * Creates an event when a new comment is added.
 */
export async function createActivityEventCommentCreated(params: {
  commentId: number;
  actorUserId: number;
  companyId?: number;
  contactId?: number;
  leadId?: number;
}): Promise<ActivityEvent> {
  return createActivityEvent({
    eventType: "comment_created",
    commentId: params.commentId,
    actorUserId: params.actorUserId,
    companyId: params.companyId ?? null,
    contactId: params.contactId ?? null,
    // For comments on leads, also store the leadId for filtering
    leadId: params.leadId ?? null,
  });
}

/**
 * Creates an event when a new lead is created.
 */
export async function createActivityEventLeadCreated(params: {
  leadId: number;
  actorUserId: number;
  companyId: number;
  contactId?: number;
}): Promise<ActivityEvent> {
  return createActivityEvent({
    eventType: "lead_created",
    leadId: params.leadId,
    actorUserId: params.actorUserId,
    companyId: params.companyId,
    contactId: params.contactId ?? null,
  });
}

/**
 * Creates an event when a lead's status changes.
 */
export async function createActivityEventLeadStatusChanged(params: {
  leadId: number;
  actorUserId: number;
  oldStatus: ActivityEvent["oldStatus"];
  newStatus: ActivityEvent["newStatus"];
  companyId: number;
  contactId?: number;
}): Promise<ActivityEvent> {
  return createActivityEvent({
    eventType: "lead_status_changed",
    leadId: params.leadId,
    actorUserId: params.actorUserId,
    oldStatus: params.oldStatus,
    newStatus: params.newStatus,
    companyId: params.companyId,
    contactId: params.contactId ?? null,
  });
}

/**
 * Creates an event when an email is received into the system.
 * Note: actorUserId is the sender (source user), may be null for external emails.
 */
export async function createActivityEventEmailReceived(params: {
  emailId: number;
  actorUserId?: number;
  companyId?: number;
  contactId?: number;
}): Promise<ActivityEvent> {
  return createActivityEvent({
    eventType: "email_received",
    emailId: params.emailId,
    actorUserId: params.actorUserId ?? null,
    companyId: params.companyId ?? null,
    contactId: params.contactId ?? null,
  });
}

// Type for full activity event with all related data
export type FullActivityEvent = {
  id: number;
  eventType: ActivityEventType;
  createdAt: Date;
  oldStatus: ActivityEvent["oldStatus"];
  newStatus: ActivityEvent["newStatus"];
  actorUser: { id: number; firstName: string; lastName: string } | null;
  comment: {
    id: number;
    content: string;
    createdAt: Date;
    companyId: number | null;
    contactId: number | null;
    leadId: number | null;
  } | null;
  lead: {
    id: number;
    description: string;
    status: string;
    companyId: number;
    contactId: number | null;
  } | null;
  email: {
    id: number;
    subject: string | null;
    content: string;
    createdAt: Date;
    recipientContactId: number | null;
    recipientCompanyId: number | null;
    sourceUserId: number | null;
  } | null;
  company: { id: number; name: string } | null;
  contact: { id: number; firstName: string; lastName: string } | null;
};

/**
 * Batch-fetch full event data for multiple event IDs.
 * This is more efficient than fetching one at a time.
 */
export async function fetchFullEventsByIds(eventIds: number[]): Promise<FullActivityEvent[]> {
  if (eventIds.length === 0) return [];

  // Fetch base event data with actor user
  const rows = await db
    .select({
      id: activityEvents.id,
      eventType: activityEvents.eventType,
      createdAt: activityEvents.createdAt,
      oldStatus: activityEvents.oldStatus,
      newStatus: activityEvents.newStatus,
      actorUser: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      },
      companyId: activityEvents.companyId,
      contactId: activityEvents.contactId,
      leadId: activityEvents.leadId,
      commentId: activityEvents.commentId,
      emailId: activityEvents.emailId,
    })
    .from(activityEvents)
    .leftJoin(users, eq(activityEvents.actorUserId, users.id))
    .where(inArray(activityEvents.id, eventIds));

  // Collect IDs for batch fetching related data
  const commentIds = new Set<number>();
  const leadIds = new Set<number>();
  const emailIds = new Set<number>();
  const companyIds = new Set<number>();
  const contactIds = new Set<number>();

  for (const row of rows) {
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

  // Batch fetch remaining related data in parallel
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

  // Create lookup maps for O(1) access
  const commentsById = Object.fromEntries(commentsData.map((c) => [c.id, c]));
  const leadsById = Object.fromEntries(leadsData.map((l) => [l.id, l]));
  const emailsById = Object.fromEntries(emailsData.map((e) => [e.id, e]));
  const companiesById = Object.fromEntries(companiesData.map((c) => [c.id, c]));
  const contactsById = Object.fromEntries(contactsData.map((c) => [c.id, c]));

  // Build full events with nested data
  return rows.map((row) => {
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
      comment,
      lead: leadId ? leadsById[leadId] ?? null : null,
      email: row.emailId ? emailsById[row.emailId] ?? null : null,
      company: row.companyId ? companiesById[row.companyId] ?? null : null,
      contact: row.contactId ? contactsById[row.contactId] ?? null : null,
    };
  });
}
