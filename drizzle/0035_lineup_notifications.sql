CREATE TABLE "lineup_notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lineup_notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"follow_id" integer NOT NULL,
	"change_id" integer NOT NULL,
	"read_at" timestamp with time zone,
	CONSTRAINT "lineup_notifications_follow_id_change_id_unique" UNIQUE("follow_id","change_id")
);
--> statement-breakpoint
ALTER TABLE "lineup_notifications" ADD CONSTRAINT "lineup_notifications_follow_id_content_follows_id_fk" FOREIGN KEY ("follow_id") REFERENCES "public"."content_follows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_notifications" ADD CONSTRAINT "lineup_notifications_change_id_content_changes_id_fk" FOREIGN KEY ("change_id") REFERENCES "public"."content_changes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lineup_notifications_change_id_idx" ON "lineup_notifications" USING btree ("change_id");
--> statement-breakpoint
ALTER TABLE "lineup_notifications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "lineup_notifications" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "lineup_notifications" TO "lineup_app";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "lineup_notifications_id_seq" TO "lineup_app";
