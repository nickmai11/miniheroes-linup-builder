ALTER TABLE "content_changes" ADD COLUMN "private_owner_id" text;--> statement-breakpoint
ALTER TABLE "lineups" ADD COLUMN "private_owner_id" text;
--> statement-breakpoint
GRANT UPDATE ("private_owner_id") ON TABLE "content_changes" TO "lineup_app";
