CREATE TABLE "hero_build_cores" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hero_build_cores_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"build_id" integer NOT NULL,
	"core_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "hero_build_cores_build_id_core_id_unique" UNIQUE("build_id","core_id")
);
--> statement-breakpoint
ALTER TABLE "hero_build_cores" ADD CONSTRAINT "hero_build_cores_build_id_hero_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."hero_builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_build_cores" ADD CONSTRAINT "hero_build_cores_core_id_hero_cores_id_fk" FOREIGN KEY ("core_id") REFERENCES "public"."hero_cores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hero_build_cores_core_id_idx" ON "hero_build_cores" USING btree ("core_id");--> statement-breakpoint
ALTER TABLE "hero_build_cores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "hero_build_cores" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);--> statement-breakpoint
GRANT ALL ON TABLE "hero_build_cores" TO "lineup_app";
