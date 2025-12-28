import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { contactCompanyHistory, contactEmails, contacts } from "@/db/schema";
import { z } from "zod";
import { listContacts } from "@/db/contacts";
import { requireApiAuth } from "@/lib/require-api-auth";

const createContactSchema = z.object({
  firstName: z.string().min(1, "Fornavn er påkrevd"),
  lastName: z.string().min(1, "Etternavn er påkrevd"),
  email: z.string().email({ message: "Ugyldig e-postadresse" }).optional().or(z.literal("")),
  phone: z.string().optional(),
  linkedInUrl: z.string().url({ message: "Ugyldig URL" }).optional().or(z.literal("")),
  description: z.string().optional(),
  companyId: z.number().int().optional(),
  role: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || null;
  const companyIdParam = searchParams.get("companyId");
  const companyId = companyIdParam ? parseInt(companyIdParam, 10) : null;
  const data = await listContacts(q, companyId && !isNaN(companyId) ? companyId : null);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth();
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;
  const userId = Number(session.user.id);

  const json = await req.json();
  const parsed = createContactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      {
        status: 400,
      }
    );
  }
  const { companyId, email, role, ...values } = parsed.data;

  // Create contact without legacy email field
  const [created] = await db
    .insert(contacts)
    .values({ ...values, createdByUserId: userId })
    .returning();

  // If email is provided, create entry in contactEmails table
  if (email && email.trim()) {
    await db.insert(contactEmails).values({
      contactId: created.id,
      email: email.trim(),
      active: true,
    });
  }

  if (companyId) {
    const today = new Date().toISOString().slice(0, 10);
    await db.insert(contactCompanyHistory).values({
      companyId,
      contactId: created.id,
      startDate: today,
      role: role || null,
    });
  }
  return NextResponse.json(created);
}
