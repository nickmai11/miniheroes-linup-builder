ALTER TABLE "hero_skills" ADD COLUMN "artifact_bonus_tier" text;--> statement-breakpoint
ALTER TABLE "hero_skills" ADD COLUMN "unlock_stars" integer;--> statement-breakpoint
ALTER TABLE "hero_skills" ADD COLUMN "icon_url" text;--> statement-breakpoint
ALTER TABLE "heroes" ADD COLUMN "artifact_icon_url" text;