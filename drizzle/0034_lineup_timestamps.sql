ALTER TABLE "lineups" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
-- Preserve known history instead of marking every existing lineup as edited now.
UPDATE "lineups" AS l
SET "updated_at" = greatest(l."created_at", coalesce((
  SELECT max(c."created_at") FROM "content_changes" AS c
  WHERE c."kind" = 'lineup' AND c."target_id" = l."id"
), l."created_at"));
