import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { events } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { requireApiAuth } from '@/lib/require-api-auth'

export async function GET() {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const data = await db.select().from(events).orderBy(desc(events.createdAt)).limit(200)
  return NextResponse.json(data)
}
