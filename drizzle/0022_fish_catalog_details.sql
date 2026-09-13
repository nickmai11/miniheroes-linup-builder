ALTER TABLE "fishes" ADD COLUMN "area" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "fishes" ADD COLUMN "fish_type" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "fishes" ADD COLUMN "collection" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "fishes" ADD COLUMN "stats" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "fishes" ADD COLUMN "bait" text;