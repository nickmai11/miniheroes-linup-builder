CREATE TABLE "invitation_redemptions" (
	"invitation_id" integer PRIMARY KEY NOT NULL,
	"device_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registered_devices" DROP CONSTRAINT "registered_devices_invitation_id_invitation_codes_id_fk";
--> statement-breakpoint
ALTER TABLE "registered_devices" ALTER COLUMN "invitation_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation_codes" ADD COLUMN "lineup_id" integer;--> statement-breakpoint
ALTER TABLE "invitation_redemptions" ADD CONSTRAINT "invitation_redemptions_invitation_id_invitation_codes_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitation_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_redemptions" ADD CONSTRAINT "invitation_redemptions_device_id_registered_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."registered_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitation_redemptions_device_id_idx" ON "invitation_redemptions" USING btree ("device_id");--> statement-breakpoint
ALTER TABLE "invitation_codes" ADD CONSTRAINT "invitation_codes_lineup_id_lineups_id_fk" FOREIGN KEY ("lineup_id") REFERENCES "public"."lineups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registered_devices" ADD CONSTRAINT "registered_devices_invitation_id_invitation_codes_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitation_codes"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Preserve every existing device's full-library invitation.
INSERT INTO "invitation_redemptions" ("invitation_id", "device_id")
SELECT "invitation_id", "id" FROM "registered_devices" WHERE "invitation_id" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "invitation_redemptions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "invitation_redemptions" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);
--> statement-breakpoint
GRANT ALL ON TABLE "invitation_redemptions" TO "lineup_app";
