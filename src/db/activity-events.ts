import { db, pool } from "@/db/client";
import { activityEvents } from "@/db/schema";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

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
  } catch {
    // Notification is best-effort; ignore errors to avoid breaking main flow
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
