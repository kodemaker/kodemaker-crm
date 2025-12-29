# AGENTS.md

Purpose

- Describe how autonomous/scripted agents (and human-in-the-loop) should interact with this codebase.
- Keep agents safe, fast, and consistent with our product conventions.

**Documentation Scope**

This file contains **reusable patterns, gotchas, and best practices** that apply across multiple features.

- ✅ **Include**: Non-obvious patterns that prevent bugs, reusable gotchas, best practices that save time
- ❌ **Exclude**: Feature-specific implementation details (use feature READMEs), obvious patterns, one-off solutions

For full documentation strategy, see `docs/DOCUMENTATION_STRATEGY.md`.

Core Principles

- Minimal diffs: prefer small, targeted edits and avoid broad reformatting.
- Types first: strong TypeScript types, Zod schemas for API I/O; dev-only validation where possible.
- Deterministic UX: avoid non-deterministic SSR/CSR behavior and hydration mismatches.
- Tests pass green: update tests when changing UX strings or flows.
- Accessibility: interactive elements must be reachable by keyboard and be semantic.

Project Overview

- Stack: Next.js (App Router), TypeScript, Drizzle ORM (Postgres), NextAuth, SWR, shadcn/ui, Tailwind.
- Realtime: Activity events via Postgres LISTEN/NOTIFY → SSE at `/api/activity-events/stream`.
- Auth: Google OAuth via NextAuth; middleware redirects to `/login` when not authenticated.
- Database: Drizzle schema in `src/db/schema.ts`; queries in `src/db/*`.
- UI: Pages under `src/app`, reusable components under `src/components`.

File/Folder Conventions

- `src/app/api/**/route.ts`: Next.js API routes; validate input with Zod; return typed data; add activity events using functions from `src/db/activity-events.ts`.
- `src/db/schema.ts`: single source of truth for DB schema.
- `src/db/activity-events.ts`: use `createActivityEventCommentCreated`, `createActivityEventLeadCreated`, `createActivityEventLeadStatusChanged`, `createActivityEventEmailReceived`.
- `src/types/api.ts`: exported response shapes; update when API changes.
- `__tests__/api` and `__tests__/ui` (if present): keep tests organized by layer.
- Strings: Norwegian product copy; use “Organisasjon/Organisasjoner” instead of “Kunde/Kunder”.

Contacts and Emails

- Contacts' email addresses now live in `contact_emails` (see `contactEmails` in `src/db/schema.ts`).
- Do not read/write `contacts.email` in new code; aggregate via `contact_emails`.
- UI lists concatenate a contact's active and inactive addresses server-side where needed.

Agent Playbooks

1. Add or change an API route

- Add Zod schema for input.
- Implement logic with Drizzle; sort/order server-side.
- Return typed payload (conform to `src/types/api.ts`); add dev-only Zod validation if needed.
- Create rich event with `createEventWithContext`.
- Update or add tests in `__tests__/api`.
- If shape changes, update UI callers and types.

Merging Contacts

- Endpoint: `POST /api/contacts/[id]/merge` merges a source contact into a target.
- Supports selective merging of email addresses, emails, leads, comments, events, followups.
- Always create an event describing the merge; consider redacting sensitive email content.

2. Modify a page layout

- Use card pattern: `border rounded p-4` sections; grid layout for two-column pages.
- Keep `PageBreadcrumbs` at the top.
- Avoid nested anchors; use button-like div + `router.push` for row clicks; inner anchor tags must `stopPropagation`.

3. Add follow-up capabilities

- API: `/api/followups` supports scoping with `?contactId|companyId|leadId` and `all=1`.
- Always return `createdBy`, `company`, `contact` where possible.
- UI: use `FollowupsList` and refresh SWR (`mutate`/`useSWRConfig`) after create/complete.
- Due date default: +1 week at 09:00.

4. Events page behavior

- SSE connects after initial SWR load; highlight new events for 10s.
- Auto-updates are always enabled for real-time event streaming.

Coding Standards

- TypeScript: explicit function signatures on exported modules; avoid `any` outside tests.
- Errors: never swallow without context; return `NextResponse.json({ error }, { status })`.
- Styling: Tailwind utility classes; keep density consistent; use shadcn/ui components.
- Accessibility: ensure `role="button"`, `tabIndex={0}`, key handlers for Enter/Space on clickable divs.

Testing

- If user-facing text changes, update tests accordingly (e.g., "Organisasjoner").
- API tests should mock NextResponse where necessary (see `vitest.setup.ts`).
- Keep tests fast and hermetic; avoid real network/DB unless integration is explicit.

Vitest/TS Patterns

- Tests run under Vitest with native ESM support.
- Use `vi.mock()` for mocking modules and `vi.fn()` for mock functions.
- When accessing mocked modules, use `await vi.importMock<any>('<path>')`.
- Mock Drizzle builders at the call-site level (e.g., chain `.select().from().where().limit()` returning promises).
- For fake timers with async code, use `vi.useFakeTimers({ shouldAdvanceTime: true })`.

Database Migration Workflow

CRITICAL: Always follow this workflow when changing the database schema.

Step 1: Update Schema First

- ALWAYS edit `src/db/schema.ts` first before making any other changes.
- Never manually edit migration files in `drizzle/` directory.
- Never skip schema changes and try to write migrations manually.

Step 2: Generate Migration
After updating `src/db/schema.ts`, ALWAYS run:

```bash
pnpm run db:generate-migrations
```

This creates a new migration file in `drizzle/000X_*.sql` and updates metadata.

Step 3: Review Migration

- Check the generated migration file in `drizzle/000X_*.sql`.
- Verify it matches your intended changes.
- Pay special attention to enum changes (Postgres gotcha: don't recreate existing enums).

Step 4: Apply Migration
After reviewing, apply the migration:

```bash
pnpm run db:migrate
```

Step 5: Update Code
Only after the migration is applied, update:

- API routes (`src/app/api/**/route.ts`) - add new fields to Zod schemas.
- Type definitions (`src/types/api.ts`) - add new fields to types.
- UI components - add form fields and display logic.
- Database query functions (`src/db/*.ts`) - ensure new fields are selected/returned.

Common Migration Mistakes to Avoid:

- ❌ DON'T edit migration files manually.
- ❌ DON'T skip `pnpm run db:generate-migrations`.
- ❌ DON'T update code before schema changes.
- ❌ DON'T recreate existing enums in migrations.
- ✅ Scalingo will run checked-in migrations on deploy.

TypeScript Types from Drizzle Schema

Prefer inferring types from the Drizzle schema instead of manually defining them. This ensures types stay in sync with the database.

```typescript
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { users, companies } from "@/db/schema";

// Type for SELECT queries (all fields, respects nullability)
type User = InferSelectModel<typeof users>;

// Type for INSERT (respects defaults, makes optional fields optional)
type NewUser = InferInsertModel<typeof users>;
```

When to use inferred types:

- Internal DB queries and functions in `src/db/*.ts`.
- API route handlers that return full records.

When to use manual types (in `src/types/api.ts`):

- API responses that include JOINed/nested data.
- Partial responses or projections.
- Client-facing types that differ from DB shape.

Pattern: Export inferred types from a central location:

```typescript
// src/db/types.ts
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";
export type User = InferSelectModel<typeof users>;
export type Company = InferSelectModel<typeof companies>;
// ... etc
```

Performance & Realtime

- SSE only for events; debounce reconnects (2s) on error.
- Prefer server sorting and pagination/limits (e.g., latest 100/200).

Common Pitfalls (and fixes)

- Hydration mismatch: avoid nested anchors; avoid non-deterministic SSR (Date.now(), random) without hydration guards.
- Route changes must update breadcrumbs and sidebar labels.
- Use `useSWRConfig().mutate(key)` to revalidate shared lists after POST/PATCH/DELETE.
- **Sorting consistency**: Always sort server-side. If client displays `firstName lastName`, server should sort by `firstName, lastName` (not `lastName, firstName`). Avoid redundant client-side sorting that overrides server sorting.
- **Type extraction**: When a type is used in multiple places (e.g., `leadCounts`), extract it to `src/types/api.ts` to prevent type inconsistencies. This is especially important for types that come from database queries.
- **SWR cache invalidation**: Use predicate functions for cache invalidation: `mutate((key) => typeof key === 'string' && key.startsWith('/api/endpoint'))` to invalidate all related endpoints at once, rather than invalidating individual keys.

Security

- Only allow `@kodemaker.no` Google accounts.
- Validate all external payloads (Postmark inbound, forms) with Zod.
- Never log secrets; redact email bodies where necessary.

How to Propose Changes

- Make small edits; run tests.
- If changing product copy, search and update tests/UX consistently.
- For broad design updates, refactor one page first, then replicate pattern.

CI Expectations

- `npm test` passes.
- Lint passes with zero warnings.
- No TypeScript errors in app code.

Deployment

Two environments on Scalingo (French hosting, GDPR-compliant):

| Environment    | App name                 | Deploy trigger                    |
| -------------- | ------------------------ | --------------------------------- |
| **Staging**    | `kodemaker-crm-staging`  | Auto-deploy on push to `main`     |
| **Production** | `kodemaker-crm-prod`     | Manual `git push production main` |

Deploy workflow:

1. Push to `origin main` → GitHub CI runs → auto-deploys to staging.
2. Verify on staging.
3. `git push production main` → deploys to production.

Useful commands:

```bash
scalingo --app kodemaker-crm-staging logs      # View staging logs
scalingo --app kodemaker-crm-prod logs         # View production logs
scalingo --app kodemaker-crm-prod ps           # Check production status
```

See [ADR 0002](docs/adr/0002-scalingo-dual-environment-hosting.md) for hosting decision rationale.

Contacts

- Product/Design: Trygve
- Codeowners for DB/Events: see `src/db/*`
