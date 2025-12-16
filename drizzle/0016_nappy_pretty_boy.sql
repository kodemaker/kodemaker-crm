ALTER TYPE "public"."lead_status" ADD VALUE 'ON_HOLD' BEFORE 'LOST';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "potential_value" integer;