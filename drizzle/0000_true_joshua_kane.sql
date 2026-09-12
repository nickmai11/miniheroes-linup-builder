CREATE TABLE "heroes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "heroes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'unknown' NOT NULL,
	"rarity" text DEFAULT 'unknown' NOT NULL,
	"image_url" text,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "heroes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lineup_heroes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lineup_heroes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lineup_id" integer NOT NULL,
	"hero_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "lineup_heroes_lineup_id_position_unique" UNIQUE("lineup_id","position")
);
--> statement-breakpoint
CREATE TABLE "lineups" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lineups_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lineup_heroes" ADD CONSTRAINT "lineup_heroes_lineup_id_lineups_id_fk" FOREIGN KEY ("lineup_id") REFERENCES "public"."lineups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_heroes" ADD CONSTRAINT "lineup_heroes_hero_id_heroes_id_fk" FOREIGN KEY ("hero_id") REFERENCES "public"."heroes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lineup_heroes_hero_id_idx" ON "lineup_heroes" USING btree ("hero_id");