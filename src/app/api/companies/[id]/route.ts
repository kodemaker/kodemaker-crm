import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCompanyDetail } from "@/db/customers";
import { z } from "zod";
import { requireApiAuth } from "@/lib/require-api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const detail = await getCompanyDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  websiteUrl: z.url({ error: "Ugyldig URL" }).optional().or(z.literal("")),
  emailDomain: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
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
  const json = await req.json();
  const parsed = updateCompanySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, {
      status: 400,
    });
  }
  const values: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) values.name = parsed.data.name;
  if (parsed.data.websiteUrl !== undefined) {
    values.websiteUrl = parsed.data.websiteUrl || null;
  }
  if (parsed.data.emailDomain !== undefined) {
    values.emailDomain = parsed.data.emailDomain || null;
  }
  if (parsed.data.description !== undefined) {
    values.description = parsed.data.description || null;
  }
  const [updated] = await db.update(companies).set(values).where(
    eq(companies.id, id),
  ).returning();
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
  const [deleted] = await db.delete(companies).where(eq(companies.id, id))
    .returning();
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
