CREATE TABLE "rune_attributes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rune_attributes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"rune_type" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"max_value" real NOT NULL,
	"is_percent" boolean DEFAULT true NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"analysis" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rune_attributes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "rune_attributes_rune_type_idx" ON "rune_attributes" USING btree ("rune_type");--> statement-breakpoint
ALTER TABLE "rune_attributes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "rune_attributes" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);--> statement-breakpoint
GRANT ALL ON TABLE "rune_attributes" TO "lineup_app";
