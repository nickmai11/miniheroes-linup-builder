CREATE TABLE "hero_build_runes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hero_build_runes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"build_id" integer NOT NULL,
	"rune_attribute_id" integer NOT NULL,
	CONSTRAINT "hero_build_runes_build_id_rune_attribute_id_unique" UNIQUE("build_id","rune_attribute_id")
);
--> statement-breakpoint
CREATE TABLE "hero_build_weapons" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hero_build_weapons_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"build_id" integer NOT NULL,
	"weapon_attribute_id" integer NOT NULL,
	CONSTRAINT "hero_build_weapons_build_id_weapon_attribute_id_unique" UNIQUE("build_id","weapon_attribute_id")
);
--> statement-breakpoint
CREATE TABLE "hero_builds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hero_builds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"hero_id" integer NOT NULL,
	"name" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hero_build_runes" ADD CONSTRAINT "hero_build_runes_build_id_hero_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."hero_builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_build_runes" ADD CONSTRAINT "hero_build_runes_rune_attribute_id_rune_attributes_id_fk" FOREIGN KEY ("rune_attribute_id") REFERENCES "public"."rune_attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_build_weapons" ADD CONSTRAINT "hero_build_weapons_build_id_hero_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."hero_builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_build_weapons" ADD CONSTRAINT "hero_build_weapons_weapon_attribute_id_weapon_attributes_id_fk" FOREIGN KEY ("weapon_attribute_id") REFERENCES "public"."weapon_attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_builds" ADD CONSTRAINT "hero_builds_hero_id_heroes_id_fk" FOREIGN KEY ("hero_id") REFERENCES "public"."heroes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hero_build_runes_rune_attribute_id_idx" ON "hero_build_runes" USING btree ("rune_attribute_id");--> statement-breakpoint
CREATE INDEX "hero_build_weapons_weapon_attribute_id_idx" ON "hero_build_weapons" USING btree ("weapon_attribute_id");--> statement-breakpoint
CREATE INDEX "hero_builds_hero_id_idx" ON "hero_builds" USING btree ("hero_id");--> statement-breakpoint
ALTER TABLE "hero_builds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "hero_builds" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);--> statement-breakpoint
GRANT ALL ON TABLE "hero_builds" TO "lineup_app";
--> statement-breakpoint
ALTER TABLE "hero_build_runes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "hero_build_runes" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);--> statement-breakpoint
GRANT ALL ON TABLE "hero_build_runes" TO "lineup_app";
--> statement-breakpoint
ALTER TABLE "hero_build_weapons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "hero_build_weapons" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);--> statement-breakpoint
GRANT ALL ON TABLE "hero_build_weapons" TO "lineup_app";
