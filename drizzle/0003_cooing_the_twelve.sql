CREATE TABLE "divinities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "divinities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"icon_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "divinities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "divinities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "divinities" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);--> statement-breakpoint
GRANT ALL ON TABLE "divinities" TO "lineup_app";
