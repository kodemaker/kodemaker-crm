import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db/client";
import { activityEvents, comments, companies, contacts, emails, leads, users } from "@/db/schema";
import { asc, eq, gt } from "drizzle-orm";
import { requireApiAuth } from "@/lib/require-api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper to fetch full event data for an event ID
async function fetchFullEventData(eventId: number) {
  const [row] = await db
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
    .where(eq(activityEvents.id, eventId));

  if (!row) return null;

  // Fetch related data
  const [commentData, leadData, emailData, companyData, contactData] = await Promise.all([
    row.commentId
      ? db
          .select({
            id: comments.id,
            content: comments.content,
            createdAt: comments.createdAt,
            companyId: comments.companyId,
            contactId: comments.contactId,
            leadId: comments.leadId,
          })
          .from(comments)
          .where(eq(comments.id, row.commentId))
          .then((r) => r[0] ?? null)
      : null,
    row.leadId
      ? db
          .select({
            id: leads.id,
            description: leads.description,
            status: leads.status,
            companyId: leads.companyId,
            contactId: leads.contactId,
          })
          .from(leads)
          .where(eq(leads.id, row.leadId))
          .then((r) => r[0] ?? null)
      : null,
    row.emailId
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
          .where(eq(emails.id, row.emailId))
          .then((r) => r[0] ?? null)
      : null,
    row.companyId
      ? db
          .select({ id: companies.id, name: companies.name })
          .from(companies)
          .where(eq(companies.id, row.companyId))
          .then((r) => r[0] ?? null)
      : null,
    row.contactId
      ? db
          .select({
            id: contacts.id,
            firstName: contacts.firstName,
            lastName: contacts.lastName,
          })
          .from(contacts)
          .where(eq(contacts.id, row.contactId))
          .then((r) => r[0] ?? null)
      : null,
  ]);

  // For comments on leads, also fetch the lead data
  let commentLeadData = null;
  if (commentData?.leadId && !leadData) {
    const [lead] = await db
      .select({
        id: leads.id,
        description: leads.description,
        status: leads.status,
        companyId: leads.companyId,
        contactId: leads.contactId,
      })
      .from(leads)
      .where(eq(leads.id, commentData.leadId));
    commentLeadData = lead ?? null;
  }

  return {
    id: row.id,
    eventType: row.eventType,
    createdAt: row.createdAt,
    actorUser: row.actorUser?.id ? row.actorUser : null,
    oldStatus: row.oldStatus,
    newStatus: row.newStatus,
    comment: commentData,
    lead: leadData ?? commentLeadData,
    email: emailData,
    company: companyData,
    contact: contactData,
  };
}

export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(req.url);
  const sinceParam = Number(searchParams.get("since") || "0");
  let lastId = Number.isFinite(sinceParam) ? sinceParam : 0;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;

      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      const sendComment = (text: string) => {
        controller.enqueue(encoder.encode(`:${text}\n\n`));
      };

      // Send backlog first (events since lastId) with full data
      try {
        const rows = await db
          .select({ id: activityEvents.id })
          .from(activityEvents)
          .where(lastId ? gt(activityEvents.id, lastId) : undefined)
          .orderBy(asc(activityEvents.id))
          .limit(100);

        for (const row of rows) {
          const fullEvent = await fetchFullEventData(row.id);
          if (fullEvent) {
            lastId = Math.max(lastId, fullEvent.id);
            send(fullEvent);
          }
        }
      } catch {
        // Ignore backlog errors - stream will still work for new events
      }

      // Dedicated PG client for LISTEN/NOTIFY
      const client = await pool.connect();
      await client.query("LISTEN activity_events");

      const onNotification = async (msg: { channel: string; payload: string | null }) => {
        if (closed) return;
        if (msg.channel !== "activity_events" || !msg.payload) return;
        try {
          const rawEvent = JSON.parse(msg.payload);
          if (typeof rawEvent?.id !== "number" || rawEvent.id <= lastId) return;

          // Fetch full event data
          const fullEvent = await fetchFullEventData(rawEvent.id);
          if (fullEvent) {
            lastId = Math.max(lastId, fullEvent.id);
            send(fullEvent);
          }
        } catch {
          // Ignore parse/fetch errors
        }
      };

      // @ts-expect-error pg types
      client.on("notification", onNotification);

      // Keep connection alive
      const pingInterval = setInterval(() => sendComment("keepalive"), 15000);

      const abort = async () => {
        if (closed) return;
        closed = true;
        clearInterval(pingInterval);
        try {
          await client.query("UNLISTEN activity_events");
        } catch {
          // Ignore unlisten errors
        }
        try {
          client.release();
        } catch {
          // Ignore release errors
        }
        try {
          controller.close();
        } catch {
          // Ignore close errors
        }
      };

      req.signal.addEventListener("abort", abort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
