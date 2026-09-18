CREATE TABLE "viewer_profiles" (
	"viewer_key" text PRIMARY KEY NOT NULL,
	"nickname" text NOT NULL,
	CONSTRAINT "viewer_profiles_nickname_length" CHECK (char_length(btrim("viewer_profiles"."nickname")) between 1 and 40)
);
--> statement-breakpoint
ALTER TABLE "viewer_profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "viewer_profiles" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "viewer_profiles" TO "lineup_app";
