CREATE TYPE "public"."fish_rarity" AS ENUM('eternal', 'mythic', 'legend', 'epic', 'rare');--> statement-breakpoint
ALTER TABLE "fishes" ADD COLUMN "rarity" "fish_rarity";