CREATE TABLE "lineup_hero_pets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lineup_hero_pets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lineup_hero_id" integer NOT NULL,
	"pet_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "lineup_hero_pets_lineup_hero_id_pet_id_unique" UNIQUE("lineup_hero_id","pet_id")
);
--> statement-breakpoint
CREATE TABLE "lineup_hero_relics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lineup_hero_relics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lineup_hero_id" integer NOT NULL,
	"relic_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "lineup_hero_relics_lineup_hero_id_relic_id_unique" UNIQUE("lineup_hero_id","relic_id")
);
--> statement-breakpoint
ALTER TABLE "lineup_hero_pets" ADD CONSTRAINT "lineup_hero_pets_lineup_hero_id_lineup_heroes_id_fk" FOREIGN KEY ("lineup_hero_id") REFERENCES "public"."lineup_heroes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_hero_pets" ADD CONSTRAINT "lineup_hero_pets_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_hero_relics" ADD CONSTRAINT "lineup_hero_relics_lineup_hero_id_lineup_heroes_id_fk" FOREIGN KEY ("lineup_hero_id") REFERENCES "public"."lineup_heroes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_hero_relics" ADD CONSTRAINT "lineup_hero_relics_relic_id_relics_id_fk" FOREIGN KEY ("relic_id") REFERENCES "public"."relics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lineup_hero_pets_pet_id_idx" ON "lineup_hero_pets" USING btree ("pet_id");--> statement-breakpoint
CREATE INDEX "lineup_hero_relics_relic_id_idx" ON "lineup_hero_relics" USING btree ("relic_id");
--> statement-breakpoint
ALTER TABLE "lineup_hero_pets" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "lineup_hero_pets" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);
--> statement-breakpoint
GRANT ALL ON TABLE "lineup_hero_pets" TO "lineup_app";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "lineup_hero_pets_id_seq" TO "lineup_app";
--> statement-breakpoint
ALTER TABLE "lineup_hero_relics" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "lineup_hero_relics" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);
--> statement-breakpoint
GRANT ALL ON TABLE "lineup_hero_relics" TO "lineup_app";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "lineup_hero_relics_id_seq" TO "lineup_app";
