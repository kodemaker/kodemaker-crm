import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  contacts,
  contactEmails,
  emails,
  leads,
  comments,
  followups,
  activityEvents,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireApiAuth } from "@/lib/require-api-auth";

const mergeContactSchema = z.object({
  targetContactId: z.number().int().positive(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id: idStr } = await params;
  const sourceContactId = Number(idStr);
  if (!sourceContactId)
    return NextResponse.json({ error: "Invalid source contact id" }, { status: 400 });

  const json = await req.json();
  const parsed = mergeContactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { targetContactId } = parsed.data;

  // Verify both contacts exist
  const [sourceContact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, sourceContactId))
    .limit(1);
  const [targetContact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, targetContactId))
    .limit(1);

  if (!sourceContact) {
    return NextResponse.json({ error: "Source contact not found" }, { status: 404 });
  }
  if (!targetContact) {
    return NextResponse.json({ error: "Target contact not found" }, { status: 404 });
  }

  if (sourceContactId === targetContactId) {
    return NextResponse.json({ error: "Cannot merge contact with itself" }, { status: 400 });
  }

  try {
    // Start a transaction to ensure data consistency
    // All data is transferred and source contact is deleted
    await db.transaction(async (tx) => {
      // Transfer email addresses to target contact
      await tx
        .update(contactEmails)
        .set({ contactId: targetContactId })
        .where(eq(contactEmails.contactId, sourceContactId));

      // Transfer emails to target contact
      await tx
        .update(emails)
        .set({ recipientContactId: targetContactId })
        .where(eq(emails.recipientContactId, sourceContactId));

      // Transfer leads to target contact
      await tx
        .update(leads)
        .set({ contactId: targetContactId })
        .where(eq(leads.contactId, sourceContactId));

      // Transfer comments to target contact
      await tx
        .update(comments)
        .set({ contactId: targetContactId })
        .where(eq(comments.contactId, sourceContactId));

      // Transfer activity events to target contact
      await tx
        .update(activityEvents)
        .set({ contactId: targetContactId })
        .where(eq(activityEvents.contactId, sourceContactId));

      // Transfer followups to target contact
      await tx
        .update(followups)
        .set({ contactId: targetContactId })
        .where(eq(followups.contactId, sourceContactId));

      // Delete source contact
      await tx.delete(contacts).where(eq(contacts.id, sourceContactId));
    });

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${sourceContact.firstName} ${sourceContact.lastName} into ${targetContact.firstName} ${targetContact.lastName}`,
    });
  } catch (error) {
    console.error("Error merging contacts:", error);
    return NextResponse.json({ error: "Failed to merge contacts" }, { status: 500 });
  }
}
