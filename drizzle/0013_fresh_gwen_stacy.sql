CREATE TYPE "public"."build_priority" AS ENUM('must', 'should', 'optional');--> statement-breakpoint
ALTER TABLE "hero_build_cores" ADD COLUMN "priority" "build_priority" DEFAULT 'should' NOT NULL;--> statement-breakpoint
ALTER TABLE "hero_build_runes" ADD COLUMN "priority" "build_priority" DEFAULT 'should' NOT NULL;--> statement-breakpoint
ALTER TABLE "hero_build_weapons" ADD COLUMN "priority" "build_priority" DEFAULT 'should' NOT NULL;