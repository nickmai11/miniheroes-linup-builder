CREATE TABLE "content_follows" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_follows_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"follower_key" text NOT NULL,
	"kind" text NOT NULL,
	"target_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_follows_follower_key_kind_target_id_unique" UNIQUE("follower_key","kind","target_id"),
	CONSTRAINT "content_follows_kind" CHECK ("content_follows"."kind" in ('lineup', 'hero'))
);

--> statement-breakpoint
ALTER TABLE "content_follows" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "content_follows" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE "content_follows" TO "lineup_app";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "content_follows_id_seq" TO "lineup_app";
