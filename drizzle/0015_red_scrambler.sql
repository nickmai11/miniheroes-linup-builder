-- Merge Should have into OK to have before removing the old enum value.
UPDATE "public"."hero_build_cores" SET "priority" = 'optional' WHERE "priority" = 'should';--> statement-breakpoint
UPDATE "public"."hero_build_runes" SET "priority" = 'optional' WHERE "priority" = 'should';--> statement-breakpoint
UPDATE "public"."hero_build_weapons" SET "priority" = 'optional' WHERE "priority" = 'should';--> statement-breakpoint
ALTER TABLE "public"."hero_build_cores" ALTER COLUMN "priority" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."hero_build_cores" ALTER COLUMN "priority" SET DATA TYPE text USING "priority"::text;--> statement-breakpoint
ALTER TABLE "public"."hero_build_runes" ALTER COLUMN "priority" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."hero_build_runes" ALTER COLUMN "priority" SET DATA TYPE text USING "priority"::text;--> statement-breakpoint
ALTER TABLE "public"."hero_build_weapons" ALTER COLUMN "priority" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."hero_build_weapons" ALTER COLUMN "priority" SET DATA TYPE text USING "priority"::text;--> statement-breakpoint
DROP TYPE "public"."build_priority";--> statement-breakpoint
CREATE TYPE "public"."build_priority" AS ENUM('must', 'optional');--> statement-breakpoint
ALTER TABLE "public"."hero_build_cores" ALTER COLUMN "priority" SET DATA TYPE "public"."build_priority" USING "priority"::"public"."build_priority";--> statement-breakpoint
ALTER TABLE "public"."hero_build_cores" ALTER COLUMN "priority" SET DEFAULT 'optional'::"public"."build_priority";--> statement-breakpoint
ALTER TABLE "public"."hero_build_runes" ALTER COLUMN "priority" SET DATA TYPE "public"."build_priority" USING "priority"::"public"."build_priority";--> statement-breakpoint
ALTER TABLE "public"."hero_build_runes" ALTER COLUMN "priority" SET DEFAULT 'optional'::"public"."build_priority";--> statement-breakpoint
ALTER TABLE "public"."hero_build_weapons" ALTER COLUMN "priority" SET DATA TYPE "public"."build_priority" USING "priority"::"public"."build_priority";--> statement-breakpoint
ALTER TABLE "public"."hero_build_weapons" ALTER COLUMN "priority" SET DEFAULT 'optional'::"public"."build_priority";
