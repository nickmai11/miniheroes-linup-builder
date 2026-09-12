CREATE TABLE "hero_artifact_bonuses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hero_artifact_bonuses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"hero_id" integer NOT NULL,
	"skill_id" integer,
	"tier" text NOT NULL,
	"name" text,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hero_artifact_bonuses" ADD CONSTRAINT "hero_artifact_bonuses_hero_id_heroes_id_fk" FOREIGN KEY ("hero_id") REFERENCES "public"."heroes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_artifact_bonuses" ADD CONSTRAINT "hero_artifact_bonuses_skill_id_hero_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."hero_skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hero_artifact_bonuses_hero_id_idx" ON "hero_artifact_bonuses" USING btree ("hero_id");--> statement-breakpoint
ALTER TABLE "hero_skills" DROP COLUMN "artifact_bonus";--> statement-breakpoint
ALTER TABLE "hero_skills" DROP COLUMN "artifact_bonus_tier";--> statement-breakpoint
ALTER TABLE "hero_artifact_bonuses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "hero_artifact_bonuses" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);--> statement-breakpoint
GRANT ALL ON TABLE "hero_artifact_bonuses" TO "lineup_app";
