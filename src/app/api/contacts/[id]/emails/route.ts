import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { contactEmails } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { requireApiAuth } from "@/lib/require-api-auth";

const createContactEmailSchema = z.object({
  email: z.string().email(),
  active: z.boolean().optional().default(true),
});

// GET /api/contacts/[id]/emails - Get all emails for a contact
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id: idStr } = await params;
  const contactId = Number(idStr);
  if (!contactId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const emails = await db
    .select()
    .from(contactEmails)
    .where(eq(contactEmails.contactId, contactId))
    .orderBy(contactEmails.createdAt);

  return NextResponse.json(emails);
}

// POST /api/contacts/[id]/emails - Add new email for a contact
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id: idStr } = await params;
  const contactId = Number(idStr);
  if (!contactId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const json = await req.json();
  const parsed = createContactEmailSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check if email already exists for this contact
  const existing = await db
    .select()
    .from(contactEmails)
    .where(and(eq(contactEmails.contactId, contactId), eq(contactEmails.email, parsed.data.email)))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: "Email already exists for this contact" }, { status: 400 });
  }

  const [created] = await db
    .insert(contactEmails)
    .values({
      contactId,
      email: parsed.data.email,
      active: parsed.data.active,
    })
    .returning();

  return NextResponse.json(created);
}
