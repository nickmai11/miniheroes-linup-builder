ALTER TABLE "content_changes" ADD COLUMN "build_ids" integer[] DEFAULT '{}'::integer[] NOT NULL;--> statement-breakpoint
-- Old history predates structured build references. Match current and historic
-- build names in slot text, including renamed/deleted builds. Ambiguous matches
-- conservatively restrict the entry instead of disclosing a private name.
WITH build_names AS (
  SELECT id, name FROM hero_builds
  UNION
  SELECT target_id, name FROM content_changes WHERE kind = 'build'
  UNION
  SELECT c.target_id, v.name
  FROM content_changes c
  CROSS JOIN LATERAL jsonb_array_elements(c.fields) f
  CROSS JOIN LATERAL (VALUES (f->>'before'), (f->>'after')) v(name)
  WHERE c.kind = 'build' AND f->>'label' = 'Name' AND v.name IS NOT NULL
)
UPDATE content_changes c SET build_ids = ARRAY(
  SELECT DISTINCT b.id FROM build_names b
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements(c.fields) f
    WHERE f->>'label' LIKE 'Slot %'
      AND (strpos(coalesce(f->>'before', ''), ' · ' || b.name) > 0
        OR strpos(coalesce(f->>'after', ''), ' · ' || b.name) > 0)
  )
) WHERE c.kind = 'lineup';
