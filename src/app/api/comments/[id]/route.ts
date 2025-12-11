import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { comments } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createEventCommentDeleted,
  createEventCommentUpdated,
} from "@/db/events";
import { z } from "zod";
import { requireApiAuth } from "@/lib/require-api-auth";

const updateCommentSchema = z.object({
  content: z.string().min(1),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await req.json();
  const parsed = updateCommentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, {
      status: 400,
    });
  }

  const [updated] = await db
    .update(comments)
    .set({ content: parsed.data.content })
    .where(eq(comments.id, id))
    .returning();

  const entity = row.leadId ? "lead" : row.companyId ? "company" : "contact";
  const entityId = row.leadId || row.companyId || row.contactId;
  if (entityId) {
    await createEventCommentUpdated(
      entity as "lead" | "company" | "contact",
      entityId,
      row.companyId ?? undefined,
      row.contactId ?? undefined,
      updated.content,
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(comments).where(eq(comments.id, id));

  const entity = row.leadId ? "lead" : row.companyId ? "company" : "contact";
  const entityId = row.leadId || row.companyId || row.contactId;
  if (entityId) {
    await createEventCommentDeleted(
      entity as "lead" | "company" | "contact",
      entityId,
      row.companyId ?? undefined,
      row.contactId ?? undefined,
      row.content,
    );
  }

  return NextResponse.json({ success: true });
}

