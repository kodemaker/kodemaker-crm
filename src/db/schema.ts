import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const leadStatusEnum = pgEnum("lead_status", [
  "NEW",
  "IN_PROGRESS",
  "LOST",
  "WON",
  "BORTFALT",
]);
export const emailModeEnum = pgEnum("email_mode", ["FORWARDED", "BCC"]);
export const eventEntityEnum = pgEnum("event_entity", ["company", "contact", "lead"]);
export const activityEventTypeEnum = pgEnum("activity_event_type", [
  "comment_created",
  "lead_created",
  "lead_status_changed",
  "email_received",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  websiteUrl: text("website_url"),
  emailDomain: text("email_domain"),
  description: text("description"),
  createdByUserId: integer("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: varchar("phone", { length: 50 }),
  linkedInUrl: text("linkedin_url"),
  description: text("description"),
  createdByUserId: integer("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactEmails = pgTable("contact_emails", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactCompanyHistory = pgTable("contact_company_history", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  role: text("role"),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  contactId: integer("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  description: text("description").notNull(),
  status: leadStatusEnum("status").notNull().default("NEW"),
  createdByUserId: integer("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  companyId: integer("company_id").references(() => companies.id, {
    onDelete: "cascade",
  }),
  contactId: integer("contact_id").references(() => contacts.id, {
    onDelete: "cascade",
  }),
  leadId: integer("lead_id").references(() => leads.id, {
    onDelete: "cascade",
  }),
  createdByUserId: integer("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  subject: text("subject"),
  recipientCompanyId: integer("recipient_company_id").references(() => companies.id, {
    onDelete: "cascade",
  }),
  recipientContactId: integer("recipient_contact_id").references(() => contacts.id, {
    onDelete: "cascade",
  }),
  sourceUserId: integer("source_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  mode: emailModeEnum("mode").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const followups = pgTable("followups", {
  id: serial("id").primaryKey(),
  note: text("note").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  companyId: integer("company_id").references(() => companies.id, {
    onDelete: "cascade",
  }),
  contactId: integer("contact_id").references(() => contacts.id, {
    onDelete: "cascade",
  }),
  leadId: integer("lead_id").references(() => leads.id, {
    onDelete: "cascade",
  }),
  // Users are never deleted (only archived), so onDelete: "restrict" is a safety net.
  createdByUserId: integer("created_by_user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "restrict",
    }),
  // Every followup must have an owner. Defaults to createdByUserId if not specified.
  assignedToUserId: integer("assigned_to_user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "restrict",
    }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  entity: eventEntityEnum("entity").notNull(),
  entityId: integer("entity_id").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityEvents = pgTable("activity_events", {
  id: serial("id").primaryKey(),
  eventType: activityEventTypeEnum("event_type").notNull(),

  // Reference to the source item (one of these will be set based on eventType)
  commentId: integer("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  emailId: integer("email_id").references(() => emails.id, { onDelete: "cascade" }),

  // User who performed the action (null for system events like email_received)
  actorUserId: integer("actor_user_id").references(() => users.id, { onDelete: "set null" }),

  // Context for filtering - denormalized for query performance
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }),

  // For lead_status_changed: track old/new status
  oldStatus: leadStatusEnum("old_status"),
  newStatus: leadStatusEnum("new_status"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_activity_events_created_at").on(table.createdAt.desc()),
  index("idx_activity_events_event_type").on(table.eventType),
  index("idx_activity_events_company_id").on(table.companyId),
  index("idx_activity_events_contact_id").on(table.contactId),
  index("idx_activity_events_actor_user_id").on(table.actorUserId),
]);

export const usersRelations = relations(users, ({ many }) => ({
  leads: many(leads),
  comments: many(comments),
  emails: many(emails),
  followups: many(followups),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  contacts: many(contacts),
  leads: many(leads),
  comments: many(comments),
  emails: many(emails),
  followups: many(followups),
  history: many(contactCompanyHistory),
}));

export const contactsRelations = relations(contacts, ({ many }) => ({
  leads: many(leads),
  comments: many(comments),
  emails: many(emails),
  history: many(contactCompanyHistory),
  contactEmails: many(contactEmails),
}));

export const contactEmailsRelations = relations(contactEmails, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactEmails.contactId],
    references: [contacts.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  company: one(companies, {
    fields: [leads.companyId],
    references: [companies.id],
  }),
  contact: one(contacts, {
    fields: [leads.contactId],
    references: [contacts.id],
  }),
  comments: many(comments),
}));

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
  comment: one(comments, {
    fields: [activityEvents.commentId],
    references: [comments.id],
  }),
  lead: one(leads, {
    fields: [activityEvents.leadId],
    references: [leads.id],
  }),
  email: one(emails, {
    fields: [activityEvents.emailId],
    references: [emails.id],
  }),
  actorUser: one(users, {
    fields: [activityEvents.actorUserId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [activityEvents.companyId],
    references: [companies.id],
  }),
  contact: one(contacts, {
    fields: [activityEvents.contactId],
    references: [contacts.id],
  }),
}));
