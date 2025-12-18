import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/db/client";
import {
  companies,
  contactCompanyHistory,
  contactEmails,
  contacts,
  emails,
  users,
} from "@/db/schema";
import { createActivityEventEmailReceived } from "@/db/activity-events";
import { count, desc, eq, inArray } from "drizzle-orm";
import { createHmac } from "crypto";
import { parsePostmarkInboundEmail, postmarkInboundSchema } from "./parse-mail";
import { z } from "zod";

import { deriveNamesFromEmailLocalPart } from "./name-utils";
import bcrypt from "bcryptjs";

const queryParamsSchema = z.object({
  contactId: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) || num <= 0 ? undefined : num;
    }),
  companyId: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) || num <= 0 ? undefined : num;
    }),
  contactIds: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const ids = val
        .split(",")
        .map((id) => {
          const num = Number(id.trim());
          return isNaN(num) || num <= 0 ? null : num;
        })
        .filter((id): id is number => id !== null);
      return ids.length > 0 ? ids : undefined;
    }),
  // Pagination parameters
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 200; // Default for backward compatibility
      const num = Number(val);
      return isNaN(num) || num <= 0 ? 200 : Math.min(num, 200);
    }),
  page: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 1;
      const num = Number(val);
      return isNaN(num) || num < 1 ? 1 : num;
    }),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = queryParamsSchema.safeParse({
      contactId: searchParams.get("contactId") ?? undefined,
      companyId: searchParams.get("companyId") ?? undefined,
      contactIds: searchParams.get("contactIds") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      page: searchParams.get("page") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        {
          status: 400,
        }
      );
    }

    const { contactId, companyId, contactIds, limit, page } = parsed.data;
    const offset = (page - 1) * limit;

    // Require at least one valid scope parameter
    if (!contactId && !companyId && (!contactIds || contactIds.length === 0)) {
      return NextResponse.json(
        {
          error: "At least one scope parameter (contactId, companyId, or contactIds) is required",
        },
        { status: 400 }
      );
    }

    // Build scope condition
    const scopeCondition = contactId
      ? eq(emails.recipientContactId, contactId)
      : companyId
        ? eq(emails.recipientCompanyId, companyId)
        : inArray(emails.recipientContactId, contactIds!);

    const where = scopeCondition;

    // Run count and data queries in parallel for efficiency
    const [countResult, rows] = await Promise.all([
      db.select({ count: count() }).from(emails).where(scopeCondition),
      db
        .select({
          id: emails.id,
          subject: emails.subject,
          content: emails.content,
          createdAt: emails.createdAt,
          sourceUser: {
            firstName: users.firstName,
            lastName: users.lastName,
          },
          recipientContact: {
            firstName: contacts.firstName,
            lastName: contacts.lastName,
          },
        })
        .from(emails)
        .leftJoin(users, eq(users.id, emails.sourceUserId))
        .leftJoin(contacts, eq(contacts.id, emails.recipientContactId))
        .where(where)
        .orderBy(desc(emails.createdAt), desc(emails.id))
        .offset(offset)
        .limit(limit),
    ]);

    const totalCount = countResult[0]?.count ?? 0;
    const hasMore = offset + rows.length < totalCount;
    const items = rows;

    return NextResponse.json({ items, hasMore, totalCount });
  } catch (error) {
    logger.error({ route: "/api/emails", method: "GET", error }, "Error fetching emails");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    logger.info({ route: "/api/emails", method: "POST" }, "api call");
    // Read raw body to optionally verify Postmark signature
    const rawBody = await req.text();
    let body: unknown;
    try {
      body = JSON.parse(rawBody || "{}");
    } catch {
      return NextResponse.json(
        { error: "Mail body is unparsable" },
        {
          status: 400,
        }
      );
    }

    const signingKey = process.env.POSTMARK_WEBHOOK_SECRET;
    const signature = req.headers.get("x-postmark-signature") || undefined;
    if (signingKey && signature) {
      const expected = createHmac("sha256", signingKey).update(rawBody, "utf8").digest("base64");
      if (expected !== signature) {
        logger.error({ route: "/api/emails", method: "POST" }, "Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          {
            status: 401,
          }
        );
      }
    }

    const parsed = postmarkInboundSchema.safeParse(body);
    if (!parsed.success) {
      logger.error(
        { route: "/api/emails", method: "POST" },
        "Parse failed: " + JSON.stringify(parsed.error.flatten())
      );
      return NextResponse.json(
        { error: parsed.error.flatten() },
        {
          status: 400,
        }
      );
    }

    const parsedMail = parsePostmarkInboundEmail(parsed.data);
    if (parsedMail.mode === "ERROR") {
      logger.error({ route: "/api/emails", method: "POST" }, "Parse failed: " + parsedMail.error);
      return NextResponse.json({ error: parsedMail.error }, { status: 400 });
    }

    if (!parsedMail.contactEmail) {
      logger.error({ route: "/api/emails", method: "POST" }, "Missing contact mail");
      return NextResponse.json(
        { error: "Missing contact mail" },
        {
          status: 400,
        }
      );
    }

    if (!parsedMail.crmUser) {
      logger.error({ route: "/api/emails", method: "POST" }, "Crm user not found");
      return NextResponse.json(
        { error: "Crm user not found" },
        {
          status: 400,
        }
      );
    }

    // Find or create contact
    const [maybeContactEmail] = await db
      .select({
        contactId: contactEmails.contactId,
        email: contactEmails.email,
      })
      .from(contactEmails)
      .where(eq(contactEmails.email, parsedMail.contactEmail))
      .limit(1);

    let contactId = maybeContactEmail?.contactId;
    if (!maybeContactEmail) {
      const localPart = parsedMail.contactEmail.split("@")[0];
      const { firstName, lastName } = deriveNamesFromEmailLocalPart(localPart);
      logger.info(
        { route: "/api/emails", method: "POST" },
        "creating contact for email " + parsedMail.contactEmail
      );
      const [created] = await db
        .insert(contacts)
        .values({
          firstName,
          lastName,
        })
        .returning();
      contactId = created.id;

      // Also create the contact email record
      await db.insert(contactEmails).values({
        contactId: created.id,
        email: parsedMail.contactEmail,
        active: true,
      });
    }

    // Find or create contactHistory (and company if not found)
    let companyId = undefined;
    const companyDomain = parsedMail.contactEmail.split("@")[1];
    const [maybeContactHistory] = await db
      .select()
      .from(contactCompanyHistory)
      .where(eq(contactCompanyHistory.contactId, contactId));
    if (!maybeContactHistory) {
      // Find or create company
      const [maybeCompany] = await db
        .select()
        .from(companies)
        .where(eq(companies.emailDomain, companyDomain));
      companyId = maybeCompany?.id;
      if (!maybeCompany) {
        const name = companyDomain.split(".").slice(0, -1).join(".");
        const capitalizedName = name.at(0)?.toUpperCase() + name.slice(1);
        const [createdCompany] = await db
          .insert(companies)
          .values({
            name: capitalizedName,
            emailDomain: companyDomain,
          })
          .returning();
        companyId = createdCompany.id;
        logger.info({ route: "/api/emails", method: "POST" }, `Create company ${capitalizedName}`);
      }
      // Now, create contactHistory
      await db
        .insert(contactCompanyHistory)
        .values({ contactId, companyId, startDate: new Date().toISOString() })
        .returning();
    }

    // Find or create CRM user (auto-provision if missing)
    const crmEmail = parsedMail.crmUser;
    const [existingUser] = await db.select().from(users).where(eq(users.email, crmEmail));
    let createdByUser = existingUser;
    if (!createdByUser) {
      const domain = crmEmail.split("@")[1]?.toLowerCase();
      if (domain !== "kodemaker.no") {
        logger.error(
          { route: "/api/emails", method: "POST" },
          `User with email ${crmEmail} has unsupported domain`
        );
        return NextResponse.json(
          { error: `User with email ${crmEmail} not allowed` },
          { status: 400 }
        );
      }
      const local = crmEmail.split("@")[0];
      const { firstName, lastName } = deriveNamesFromEmailLocalPart(local);
      const passwordHash = await bcrypt.hash("google-login", 8);
      const [createdUser] = await db
        .insert(users)
        .values({
          firstName,
          lastName,
          email: crmEmail,
          passwordHash,
          role: "user",
        })
        .returning();
      createdByUser = createdUser;
      logger.info(
        { route: "/api/emails", method: "POST" },
        `Auto-provisioned CRM user ${crmEmail}`
      );
    }

    // Insert email
    const [createdEmail] = await db
      .insert(emails)
      .values({
        content: parsedMail.body || "",
        subject: parsedMail.subject,
        recipientContactId: contactId,
        sourceUserId: createdByUser.id,
        mode: parsedMail.mode,
      })
      .returning();

    await createActivityEventEmailReceived({
      emailId: createdEmail.id,
      actorUserId: createdByUser.id,
      companyId,
      contactId,
    });

    logger.info(
      { route: "/api/emails", method: "POST" },
      `Imported ${parsedMail.mode} email from ${parsedMail.contactEmail}`
    );

    return NextResponse.json(createdEmail);
  } catch (error) {
    logger.error({ route: "/api/emails", method: "POST", error }, "Error processing email");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
