CREATE TABLE "fishes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fishes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"icon_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fishes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lineup_fishes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lineup_fishes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lineup_id" integer NOT NULL,
	"fish_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "lineup_fishes_lineup_id_fish_id_unique" UNIQUE("lineup_id","fish_id")
);
--> statement-breakpoint
ALTER TABLE "lineup_fishes" ADD CONSTRAINT "lineup_fishes_lineup_id_lineups_id_fk" FOREIGN KEY ("lineup_id") REFERENCES "public"."lineups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_fishes" ADD CONSTRAINT "lineup_fishes_fish_id_fishes_id_fk" FOREIGN KEY ("fish_id") REFERENCES "public"."fishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lineup_fishes_fish_id_idx" ON "lineup_fishes" USING btree ("fish_id");
--> statement-breakpoint
ALTER TABLE "fishes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "fishes" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);
--> statement-breakpoint
GRANT ALL ON TABLE "fishes" TO "lineup_app";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "fishes_id_seq" TO "lineup_app";

--> statement-breakpoint
ALTER TABLE "lineup_fishes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "lineup_fishes" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);
--> statement-breakpoint
GRANT ALL ON TABLE "lineup_fishes" TO "lineup_app";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "lineup_fishes_id_seq" TO "lineup_app";
