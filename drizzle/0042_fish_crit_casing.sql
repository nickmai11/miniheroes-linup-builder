-- Fish stat names now use the in-game CRIT casing; rename existing sample keys to match.
UPDATE "fishes" SET "stat_sample" = jsonb_set(
  "stat_sample" #- ARRAY['stats', r.old_name],
  ARRAY['stats', r.new_name],
  "stat_sample" -> 'stats' -> r.old_name
)
FROM (VALUES
  ('Anti-Crit Rate', 'Anti-CRIT Rate'),
  ('Crit DMG', 'CRIT DMG'),
  ('Crit DMG RES', 'CRIT DMG RES'),
  ('Crit Rate', 'CRIT Rate')
) AS r(old_name, new_name)
WHERE "stat_sample" -> 'stats' ? r.old_name;
