ALTER TABLE "fishes" ADD COLUMN "best_size_cm" double precision;--> statement-breakpoint
ALTER TABLE "fishes" ADD COLUMN "stat_sample" jsonb;
--> statement-breakpoint
UPDATE "fishes" SET "best_size_cm" = 724.31,
  "stat_sample" = '{"sizeCm":643.2,"stats":{"Warrior ATK":2997,"DMG Increase":2.46,"Magic DMG Boost":3.82}}'::jsonb
WHERE "slug" = 'fin-squid';
--> statement-breakpoint
UPDATE "fishes" SET "best_size_cm" = 8.10,
  "stat_sample" = '{"sizeCm":7.27,"stats":{"Warrior HP":62185,"Crit DMG":8.08,"DMG Reduction":2.55}}'::jsonb
WHERE "slug" = 'rainbow-snail';
