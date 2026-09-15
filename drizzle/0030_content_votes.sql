CREATE TABLE "content_votes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_votes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lineup_id" integer,
	"build_id" integer,
	"voter_key" text NOT NULL,
	"value" integer NOT NULL,
	CONSTRAINT "content_votes_lineup_id_voter_key_unique" UNIQUE("lineup_id","voter_key"),
	CONSTRAINT "content_votes_build_id_voter_key_unique" UNIQUE("build_id","voter_key"),
	CONSTRAINT "content_votes_one_target" CHECK (("content_votes"."lineup_id" is not null) <> ("content_votes"."build_id" is not null)),
	CONSTRAINT "content_votes_value" CHECK ("content_votes"."value" in (-1, 1))
);
--> statement-breakpoint
ALTER TABLE "content_votes" ADD CONSTRAINT "content_votes_lineup_id_lineups_id_fk" FOREIGN KEY ("lineup_id") REFERENCES "public"."lineups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_votes" ADD CONSTRAINT "content_votes_build_id_hero_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."hero_builds"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "content_votes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "content_votes" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);
--> statement-breakpoint
GRANT ALL ON TABLE "content_votes" TO "lineup_app";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "content_votes_id_seq" TO "lineup_app";
