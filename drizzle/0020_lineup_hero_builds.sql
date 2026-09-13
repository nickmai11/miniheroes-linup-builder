ALTER TABLE "lineup_heroes" ADD COLUMN "build_id" integer;--> statement-breakpoint
ALTER TABLE "lineup_heroes" ADD CONSTRAINT "lineup_heroes_build_id_hero_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."hero_builds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lineup_heroes_build_id_idx" ON "lineup_heroes" USING btree ("build_id");