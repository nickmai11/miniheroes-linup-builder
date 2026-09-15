ALTER TABLE "fishes" ADD COLUMN "base_stats" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "fishes" ADD COLUMN "special_stats" text[] DEFAULT '{}' NOT NULL;