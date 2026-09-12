CREATE TABLE "hero_cores" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hero_cores_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"hero_id" integer NOT NULL,
	"skill_id" integer,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hero_divinities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hero_divinities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"hero_id" integer NOT NULL,
	"divinity_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "hero_divinities_hero_id_position_unique" UNIQUE("hero_id","position")
);
--> statement-breakpoint
ALTER TABLE "hero_skills" ADD COLUMN "artifact_bonus" text;--> statement-breakpoint
ALTER TABLE "heroes" ADD COLUMN "artifact_name" text;--> statement-breakpoint
ALTER TABLE "hero_cores" ADD CONSTRAINT "hero_cores_hero_id_heroes_id_fk" FOREIGN KEY ("hero_id") REFERENCES "public"."heroes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_cores" ADD CONSTRAINT "hero_cores_skill_id_hero_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."hero_skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_divinities" ADD CONSTRAINT "hero_divinities_hero_id_heroes_id_fk" FOREIGN KEY ("hero_id") REFERENCES "public"."heroes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_divinities" ADD CONSTRAINT "hero_divinities_divinity_id_divinities_id_fk" FOREIGN KEY ("divinity_id") REFERENCES "public"."divinities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hero_cores_hero_id_idx" ON "hero_cores" USING btree ("hero_id");--> statement-breakpoint
CREATE INDEX "hero_divinities_divinity_id_idx" ON "hero_divinities" USING btree ("divinity_id");--> statement-breakpoint
ALTER TABLE "hero_cores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "hero_cores" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);--> statement-breakpoint
GRANT ALL ON TABLE "hero_cores" TO "lineup_app";--> statement-breakpoint
ALTER TABLE "hero_divinities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "hero_divinities" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);--> statement-breakpoint
GRANT ALL ON TABLE "hero_divinities" TO "lineup_app";
