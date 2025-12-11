import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { requireApiAuth } from "@/lib/require-api-auth";

const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(["admin", "user"]).default("user"),
});

export async function GET() {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const allUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .orderBy(asc(users.lastName), asc(users.firstName));
  return NextResponse.json(allUsers);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const json = await req.json();
  const parsed = createUserSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, {
      status: 400,
    });
  }
  const { firstName, lastName, email, phone, password, role } = parsed.data;
  const [existing] = await db.select().from(users).where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(users)
    .values({ firstName, lastName, email, phone, passwordHash, role })
    .returning();
  return NextResponse.json({ id: created.id, email: created.email });
}
