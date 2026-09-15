CREATE TABLE "content_changes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_changes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"kind" text NOT NULL,
	"target_id" integer NOT NULL,
	"name" text NOT NULL,
	"hero_name" text,
	"hero_slug" text,
	"event" text NOT NULL,
	"fields" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_changes_kind" CHECK ("content_changes"."kind" in ('lineup', 'build')),
	CONSTRAINT "content_changes_event" CHECK ("content_changes"."event" in ('created', 'updated', 'imported', 'deleted'))
);
--> statement-breakpoint
CREATE INDEX "content_changes_target_idx" ON "content_changes" USING btree ("kind","target_id","id");
--> statement-breakpoint
ALTER TABLE "content_changes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "content_changes" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "content_changes" TO "lineup_app";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "content_changes_id_seq" TO "lineup_app";
