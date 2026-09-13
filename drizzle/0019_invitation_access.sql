CREATE TABLE "invitation_codes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invitation_codes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "invitation_codes_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE TABLE "registered_devices" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "registered_devices_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"token_hash" text NOT NULL,
	"invitation_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registered_devices_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "registered_devices_invitation_id_unique" UNIQUE("invitation_id")
);
--> statement-breakpoint
ALTER TABLE "registered_devices" ADD CONSTRAINT "registered_devices_invitation_id_invitation_codes_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitation_codes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invitation_codes" ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "invitation_codes" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);

--> statement-breakpoint
GRANT ALL ON TABLE "invitation_codes" TO "lineup_app";

--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "invitation_codes_id_seq" TO "lineup_app";

--> statement-breakpoint
ALTER TABLE "registered_devices" ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
CREATE POLICY "lineup_app_all" ON "registered_devices" FOR ALL TO "lineup_app" USING (true) WITH CHECK (true);

--> statement-breakpoint
GRANT ALL ON TABLE "registered_devices" TO "lineup_app";

--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "registered_devices_id_seq" TO "lineup_app";
