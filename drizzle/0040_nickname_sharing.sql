CREATE TABLE "content_shares" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_shares_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"recipient_key" text NOT NULL,
	"lineup_id" integer,
	"build_id" integer,
	CONSTRAINT "content_shares_lineup_id_recipient_key_unique" UNIQUE("lineup_id","recipient_key"),
	CONSTRAINT "content_shares_build_id_recipient_key_unique" UNIQUE("build_id","recipient_key"),
	CONSTRAINT "content_shares_one_target" CHECK (("content_shares"."lineup_id" is not null)::integer + ("content_shares"."build_id" is not null)::integer = 1)
);
--> statement-breakpoint
ALTER TABLE "viewer_profiles" ADD COLUMN "id" integer NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "viewer_profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "content_shares" ADD CONSTRAINT "content_shares_recipient_key_viewer_profiles_viewer_key_fk" FOREIGN KEY ("recipient_key") REFERENCES "public"."viewer_profiles"("viewer_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_shares" ADD CONSTRAINT "content_shares_lineup_id_lineups_id_fk" FOREIGN KEY ("lineup_id") REFERENCES "public"."lineups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_shares" ADD CONSTRAINT "content_shares_build_id_hero_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."hero_builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_shares_recipient_idx" ON "content_shares" USING btree ("recipient_key");--> statement-breakpoint
ALTER TABLE "viewer_profiles" ADD CONSTRAINT "viewer_profiles_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "content_shares" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "content_shares" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE "content_shares" TO "lineup_app";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "content_shares_id_seq", "viewer_profiles_id_seq" TO "lineup_app";
