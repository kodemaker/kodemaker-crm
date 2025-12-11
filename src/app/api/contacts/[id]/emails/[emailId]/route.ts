import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { contactEmails } from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { z } from 'zod'
import { createEventContactEmailUpdated, createEventContactEmailRemoved } from '@/db/events'
import { requireApiAuth } from '@/lib/require-api-auth'

const updateContactEmailSchema = z.object({
  email: z.string().email().optional(),
  active: z.boolean().optional(),
})

// PATCH /api/contacts/[id]/emails/[emailId] - Update an email
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const { id: idStr, emailId: emailIdStr } = await params
  const contactId = Number(idStr)
  const emailId = Number(emailIdStr)
  
  if (!contactId || !emailId) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const json = await req.json()
  const parsed = updateContactEmailSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Check if email exists and belongs to the contact
  const existing = await db
    .select()
    .from(contactEmails)
    .where(and(eq(contactEmails.id, emailId), eq(contactEmails.contactId, contactId)))
    .limit(1)

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Email not found' }, { status: 404 })
  }

  // If updating email address, check for duplicates
  if (parsed.data.email && parsed.data.email !== existing[0].email) {
    const duplicate = await db
      .select()
      .from(contactEmails)
      .where(
        and(
          eq(contactEmails.contactId, contactId),
          eq(contactEmails.email, parsed.data.email),
          ne(contactEmails.id, emailId)
        )
      )
      .limit(1)

    if (duplicate.length > 0) {
      return NextResponse.json({ error: 'Email already exists for this contact' }, { status: 400 })
    }
  }

  const updateValues: Record<string, unknown> = {}
  if (parsed.data.email !== undefined) updateValues.email = parsed.data.email
  if (parsed.data.active !== undefined) updateValues.active = parsed.data.active

  const [updated] = await db
    .update(contactEmails)
    .set(updateValues)
    .where(and(eq(contactEmails.id, emailId), eq(contactEmails.contactId, contactId)))
    .returning()

  // Log event for email update
  const changes: string[] = []
  if (parsed.data.email && parsed.data.email !== existing[0].email) {
    changes.push(`adresse: ${existing[0].email} → ${parsed.data.email}`)
  }
  if (parsed.data.active !== undefined && parsed.data.active !== existing[0].active) {
    changes.push(`status: ${existing[0].active ? 'aktiv' : 'inaktiv'} → ${parsed.data.active ? 'aktiv' : 'inaktiv'}`)
  }
  
  if (changes.length > 0) {
    await createEventContactEmailUpdated(contactId, changes.join(', '))
  }

  return NextResponse.json(updated)
}

// DELETE /api/contacts/[id]/emails/[emailId] - Delete an email
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const { id: idStr, emailId: emailIdStr } = await params
  const contactId = Number(idStr)
  const emailId = Number(emailIdStr)
  
  if (!contactId || !emailId) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  // Check if the contact has more than one email before deleting
  const allEmails = await db
    .select()
    .from(contactEmails)
    .where(eq(contactEmails.contactId, contactId))

  if (allEmails.length === 1) {
    return NextResponse.json(
      { error: 'Cannot delete the last email address. Contact must have at least one email.' },
      { status: 400 }
    )
  }

  const [deleted] = await db
    .delete(contactEmails)
    .where(and(eq(contactEmails.id, emailId), eq(contactEmails.contactId, contactId)))
    .returning()

  if (!deleted) {
    return NextResponse.json({ error: 'Email not found' }, { status: 404 })
  }

  // Log event for email deletion
  await createEventContactEmailRemoved(contactId, deleted.email)

  return NextResponse.json({ ok: true })
}