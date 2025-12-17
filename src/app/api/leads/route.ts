import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { companies, contacts, followups, leads, users } from "@/db/schema";
import { z } from "zod";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { requireApiAuth } from "@/lib/require-api-auth";
import { createActivityEventLeadCreated } from "@/db/activity-events";

const createLeadSchema = z.object({
  companyId: z.number().int(),
  contactId: z.number().int().optional(),
  description: z.string().min(1),
  potentialValue: z.number().int().nullable().optional(),
  status: z.enum(["NEW", "IN_PROGRESS", "ON_HOLD", "LOST", "WON", "BORTFALT"]).optional(),
});

export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const companyIdParam = searchParams.get("companyId");
  const contactIdParam = searchParams.get("contactId");
  const allowedStatuses = new Set(["NEW", "IN_PROGRESS", "ON_HOLD", "LOST", "WON", "BORTFALT"]);

  const filters: Array<ReturnType<typeof eq> | ReturnType<typeof inArray>> = [];
  if (statusParam) {
    const statuses = statusParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => allowedStatuses.has(s)) as Array<
      "NEW" | "IN_PROGRESS" | "ON_HOLD" | "LOST" | "WON" | "BORTFALT"
    >;
    if (statuses.length > 0) {
      filters.push(inArray(leads.status, statuses));
    }
  }
  if (companyIdParam) {
    const companyId = Number(companyIdParam);
    if (!isNaN(companyId) && companyId > 0) {
      filters.push(eq(leads.companyId, companyId));
    }
  }
  if (contactIdParam) {
    const contactId = Number(contactIdParam);
    if (!isNaN(contactId) && contactId > 0) {
      filters.push(eq(leads.contactId, contactId));
    }
  }

  const leadsData = await db
    .select({
      id: leads.id,
      description: leads.description,
      status: leads.status,
      potentialValue: leads.potentialValue,
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

  // Get next (earliest non-completed) followup for each lead
  const leadIds = leadsData.map((l) => l.id);
  const nextFollowups =
    leadIds.length > 0
      ? await db
          .select({
            leadId: followups.leadId,
            dueAt: followups.dueAt,
            assignedToId: followups.assignedToUserId,
            assignedToFirstName: users.firstName,
            assignedToLastName: users.lastName,
          })
          .from(followups)
          .leftJoin(users, eq(followups.assignedToUserId, users.id))
          .where(
            and(
              inArray(followups.leadId, leadIds),
              isNull(followups.completedAt)
            )
          )
          .orderBy(asc(followups.dueAt), asc(followups.id))
      : [];

  // Map to get only the earliest followup per lead
  const followupByLead = new Map<
    number,
    { dueAt: string; assignedTo: { firstName: string; lastName: string } | null }
  >();
  for (const f of nextFollowups) {
    if (f.leadId && !followupByLead.has(f.leadId)) {
      followupByLead.set(f.leadId, {
        dueAt: f.dueAt.toISOString(),
        assignedTo:
          f.assignedToFirstName && f.assignedToLastName
            ? { firstName: f.assignedToFirstName, lastName: f.assignedToLastName }
            : null,
      });
    }
  }

  // Combine leads with their next followup
  const data = leadsData.map((lead) => ({
    ...lead,
    nextFollowup: followupByLead.get(lead.id) ?? null,
  }));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;
  const userId = Number(session.user.id);

  const json = await req.json();
  const parsed = createLeadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      {
        status: 400,
      }
    );
  }
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, parsed.data.companyId));
  const [created] = await db
    .insert(leads)
    .values({ ...parsed.data, createdByUserId: userId })
    .returning();
  await createActivityEventLeadCreated({
    leadId: created.id,
    actorUserId: userId,
    companyId: company.id,
    contactId: parsed.data.contactId,
  });
  return NextResponse.json(created);
}
