CREATE TABLE "weapon_attributes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "weapon_attributes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"divinity_slug" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weapon_attributes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "weapon_attributes" ADD CONSTRAINT "weapon_attributes_divinity_slug_divinities_slug_fk" FOREIGN KEY ("divinity_slug") REFERENCES "public"."divinities"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weapon_attributes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "weapon_attributes" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);--> statement-breakpoint
GRANT ALL ON TABLE "weapon_attributes" TO "lineup_app";
