import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { companies, contacts, leads, comments, users } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { createEvent } from '@/db/events'
import { requireApiAuth } from '@/lib/require-api-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const { id: idStr } = await params
  const id = Number(idStr)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const rows = await db
    .select({
      id: leads.id,
      description: leads.description,
      status: leads.status,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      createdBy: {
        firstName: users.firstName,
        lastName: users.lastName,
      },
      company: {
        id: companies.id,
        name: companies.name,
      },
      contact: {
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
      },
    })
    .from(leads)
    .leftJoin(users, eq(leads.createdByUserId, users.id))
    .leftJoin(companies, eq(leads.companyId, companies.id))
    .leftJoin(contacts, eq(leads.contactId, contacts.id))
    .where(eq(leads.id, id))
    .limit(1)

  const row = rows[0]
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const leadComments = await db
    .select()
    .from(comments)
    .where(eq(comments.leadId, id))
    .orderBy(desc(comments.createdAt))

  return NextResponse.json({ ...row, comments: leadComments })
}

const updateLeadSchema = z.object({
  description: z.string().min(1).optional(),
  status: z.enum(['NEW', 'IN_PROGRESS', 'LOST', 'WON', 'BORTFALT']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const { id: idStr } = await params
  const id = Number(idStr)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const json = await req.json()
  const parsed = updateLeadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const [updated] = await db
    .update(leads)
    .set({ ...parsed.data })
    .where(eq(leads.id, id))
    .returning()
  if (updated) {
    const changed = [
      parsed.data.description ? 'beskrivelse' : undefined,
      parsed.data.status ? 'status' : undefined,
    ]
      .filter(Boolean)
      .join(' & ')
    await createEvent('lead', updated.id, `Oppdatert lead (${changed || 'ingen endringer'})`)
  }
  return NextResponse.json(updated)
}
