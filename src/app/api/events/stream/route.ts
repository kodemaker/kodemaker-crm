import { NextRequest, NextResponse } from 'next/server'
import { db, pool } from '@/db/client'
import { events } from '@/db/schema'
import { asc, gt } from 'drizzle-orm'
import { requireApiAuth } from '@/lib/require-api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(req.url)
  const sinceParam = Number(searchParams.get('since') || '0')
  let lastId = Number.isFinite(sinceParam) ? sinceParam : 0

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false

      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      const sendComment = (text: string) => {
        controller.enqueue(encoder.encode(`:${text}\n\n`))
      }

      // Send backlog first
      try {
        const rows = await db
          .select()
          .from(events)
          .where(lastId ? gt(events.id, lastId) : undefined)
          .orderBy(asc(events.id))
          .limit(100)
        for (const row of rows) {
          lastId = Math.max(lastId, row.id)
          send(row)
        }
      } catch {}

      // Dedicated PG client for LISTEN/NOTIFY
      const client = await pool.connect()
      await client.query('LISTEN events')

      const onNotification = (msg: { channel: string; payload: string | null }) => {
        if (closed) return
        if (msg.channel !== 'events' || !msg.payload) return
        try {
          const e = JSON.parse(msg.payload)
          if (typeof e?.id === 'number' && e.id > lastId) lastId = e.id
          send(e)
        } catch {}
      }

      // @ts-expect-error pg types
      client.on('notification', onNotification)

      const pingInterval = setInterval(() => sendComment('keepalive'), 15000)

      const abort = async () => {
        if (closed) return
        closed = true
        clearInterval(pingInterval)
        try {
          await client.query('UNLISTEN events')
        } catch {}
        try {
          client.release()
        } catch {}
        try {
          controller.close()
        } catch {}
      }

      req.signal.addEventListener('abort', abort)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
