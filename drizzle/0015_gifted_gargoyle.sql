CREATE INDEX "idx_activity_events_created_at" ON "activity_events" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_activity_events_event_type" ON "activity_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_activity_events_company_id" ON "activity_events" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_activity_events_contact_id" ON "activity_events" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "idx_activity_events_actor_user_id" ON "activity_events" USING btree ("actor_user_id");