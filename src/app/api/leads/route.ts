import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { companies, contacts, leads } from "@/db/schema";
import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { requireApiAuth } from "@/lib/require-api-auth";
import { createEventLeadCreated } from "@/db/events";

const createLeadSchema = z.object({
  companyId: z.number().int(),
  contactId: z.number().int().optional(),
  description: z.string().min(1),
  status: z.enum(["NEW", "IN_PROGRESS", "LOST", "WON", "BORTFALT"]).optional(),
});

export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const allowedStatuses = new Set([
    "NEW",
    "IN_PROGRESS",
    "LOST",
    "WON",
    "BORTFALT",
  ]);

  const filters: Array<ReturnType<typeof inArray>> = [];
  if (statusParam) {
    const statuses = statusParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => allowedStatuses.has(s)) as Array<
        "NEW" | "IN_PROGRESS" | "LOST" | "WON" | "BORTFALT"
      >;
    if (statuses.length > 0) {
      filters.push(inArray(leads.status, statuses));
    }
  }

  const data = await db
    .select({
      id: leads.id,
      description: leads.description,
      status: leads.status,
      createdAt: leads.createdAt,
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
    .leftJoin(companies, eq(leads.companyId, companies.id))
    .leftJoin(contacts, eq(leads.contactId, contacts.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(leads.createdAt))
    .limit(100);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult
  const session = authResult

  const userId = session.user.id ? Number(session.user.id) : undefined;
  const json = await req.json();
  const parsed = createLeadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, {
      status: 400,
    });
  }
  const [company] = await db.select().from(companies).where(
    eq(companies.id, parsed.data.companyId),
  );
  const [created] = await db
    .insert(leads)
    .values({ ...parsed.data, createdByUserId: userId })
    .returning();
  await createEventLeadCreated(
    created.id,
    company.id,
    parsed.data.contactId,
    parsed.data.description,
  );
  return NextResponse.json(created);
}
