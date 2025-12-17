import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { followups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireApiAuth } from "@/lib/require-api-auth";

const updateFollowupSchema = z.object({
  note: z.string().min(1).optional(),
  dueAt: z.coerce.date().optional(),
  assignedToUserId: z.number().int().optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const rows = await db.select().from(followups).where(eq(followups.id, id)).limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await req.json();
  const parsed = updateFollowupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      {
        status: 400,
      }
    );
  }

  const updateValues: Record<string, unknown> = {};
  if (parsed.data.note !== undefined) updateValues.note = parsed.data.note;
  if (parsed.data.dueAt !== undefined) updateValues.dueAt = parsed.data.dueAt;
  if (parsed.data.assignedToUserId !== undefined) {
    updateValues.assignedToUserId = parsed.data.assignedToUserId;
  }
  if (parsed.data.completedAt !== undefined) {
    updateValues.completedAt = parsed.data.completedAt;
  }

  // If no fields to update, return existing row
  if (Object.keys(updateValues).length === 0) {
    return NextResponse.json(row);
  }

  const [updated] = await db
    .update(followups)
    .set(updateValues)
    .where(eq(followups.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const rows = await db.select().from(followups).where(eq(followups.id, id)).limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(followups).where(eq(followups.id, id));

  return NextResponse.json({ success: true });
}
