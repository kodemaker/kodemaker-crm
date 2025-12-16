import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db/client";
import { activityEvents } from "@/db/schema";
import { asc, gt } from "drizzle-orm";
import { requireApiAuth } from "@/lib/require-api-auth";
import { fetchFullEventsByIds } from "@/db/activity-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

        // Batch fetch all backlog events at once
        const fullEvents = await fetchFullEventsByIds(rows.map((r) => r.id));
        for (const event of fullEvents) {
          lastId = Math.max(lastId, event.id);
          send(event);
        }
      } catch (err) {
        // Log but continue - stream will still work for new events
        console.error("[SSE] Backlog fetch error:", err);
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

          // Fetch full event data using batch function (with single ID)
          const [fullEvent] = await fetchFullEventsByIds([rawEvent.id]);
          if (fullEvent) {
            lastId = Math.max(lastId, fullEvent.id);
            send(fullEvent);
          }
        } catch (err) {
          // Log but continue - don't break stream for single event errors
          console.error("[SSE] Event parse/fetch error:", err);
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
