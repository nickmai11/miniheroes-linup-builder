import "server-only";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  changedFields,
  type ChangeEvent,
  type ChangeKind,
} from "@/lib/change-types";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Snapshot = {
  name: string;
  heroName?: string;
  heroSlug?: string;
  fields: Record<string, string>;
  identity: Record<string, unknown>;
};

/** Coordinate saved-content writes, including build deletion's lineup side effects. */
export async function lockContentWrites(tx: Transaction) {
  await tx.execute(sql`select pg_advisory_xact_lock(1835626088, 1)`);
}

/** Read within the writer's transaction, after locking the parent row. */
export async function lineupSnapshot(
  tx: Transaction,
  id: number,
): Promise<Snapshot | null> {
  const [row] = await tx.execute<{
    name: string;
    description: string;
    slots: Record<string, string>;
    fishes: string;
    identity: Record<string, unknown>;
  }>(sql`
    select l.name, l.description,
      coalesce((select jsonb_object_agg('Slot ' || (lh.position + 1), jsonb_build_array(lh.hero_id, lh.build_id,
        (select jsonb_agg(a.pet_id order by a.sort_order, a.id) from lineup_hero_pets a where a.lineup_hero_id = lh.id),
        (select jsonb_agg(a.relic_id order by a.sort_order, a.id) from lineup_hero_relics a where a.lineup_hero_id = lh.id)))
        from lineup_heroes lh where lh.lineup_id = l.id), '{}'::jsonb) ||
        jsonb_build_object('Fishes', (select jsonb_agg(jsonb_build_array(lf.fish_id, coalesce(to_jsonb(lf)->>'quantity', '1')) order by lf.sort_order, lf.id)
          from lineup_fishes lf where lf.lineup_id = l.id)) as identity,
      coalesce((select jsonb_object_agg('Slot ' || (lh.position + 1),
        h.name || coalesce(' · ' || b.name, '') ||
        coalesce(' · Pets: ' || (select string_agg(p.name, ', ' order by a.sort_order, a.id)
          from lineup_hero_pets a join pets p on p.id = a.pet_id where a.lineup_hero_id = lh.id), '') ||
        coalesce(' · Relics: ' || (select string_agg(r.name, ', ' order by a.sort_order, a.id)
          from lineup_hero_relics a join relics r on r.id = a.relic_id where a.lineup_hero_id = lh.id), ''))
        from lineup_heroes lh join heroes h on h.id = lh.hero_id
        left join hero_builds b on b.id = lh.build_id where lh.lineup_id = l.id), '{}'::jsonb) as slots,
      coalesce((select string_agg(f.name || ' ×' || coalesce(to_jsonb(lf)->>'quantity', '1'), ', ' order by lf.sort_order, lf.id)
        from lineup_fishes lf join fishes f on f.id = lf.fish_id where lf.lineup_id = l.id), '') as fishes
    from lineups l where l.id = ${id}
  `);
  if (!row) return null;
  return {
    name: row.name,
    identity: row.identity,
    fields: {
      Name: row.name,
      Notes: row.description,
      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [
          `Slot ${i + 1}`,
          row.slots[`Slot ${i + 1}`] ?? "",
        ]),
      ),
      Fishes: row.fishes,
    },
  };
}

export async function buildSnapshot(
  tx: Transaction,
  id: number,
): Promise<Snapshot | null> {
  const [row] = await tx.execute<{
    name: string;
    notes: string;
    heroName: string;
    heroSlug: string;
    runes: string;
    weapons: string;
    cores: string;
    identity: Record<string, unknown>;
  }>(sql`
    select b.name, b.notes, h.name as "heroName", h.slug as "heroSlug",
      jsonb_build_object(
        'Runes', (select jsonb_agg(jsonb_build_array(a.rune_attribute_id, a.priority) order by a.sort_order, a.id) from hero_build_runes a where a.build_id = b.id),
        'Weapons', (select jsonb_agg(jsonb_build_array(a.weapon_attribute_id, a.priority) order by a.sort_order, a.id) from hero_build_weapons a where a.build_id = b.id),
        'Cores', (select jsonb_agg(jsonb_build_array(a.core_id, a.priority) order by a.sort_order, a.id) from hero_build_cores a where a.build_id = b.id)) as identity,
      coalesce((select string_agg(r.rune_type || ': ' || r.name || ' [' || a.priority || ']', E'\n' order by a.sort_order, a.id)
        from hero_build_runes a join rune_attributes r on r.id = a.rune_attribute_id where a.build_id = b.id), '') as runes,
      coalesce((select string_agg(w.name || ' [' || a.priority || ']', E'\n' order by a.sort_order, a.id)
        from hero_build_weapons a join weapon_attributes w on w.id = a.weapon_attribute_id where a.build_id = b.id), '') as weapons,
      coalesce((select string_agg(c.name || ' [' || a.priority || ']', E'\n' order by a.sort_order, a.id)
        from hero_build_cores a join hero_cores c on c.id = a.core_id where a.build_id = b.id), '') as cores
    from hero_builds b join heroes h on h.id = b.hero_id where b.id = ${id}
  `);
  if (!row) return null;
  const priorities = (value: string) =>
    value
      .replaceAll("[important]", "[Important]")
      .replaceAll("[must]", "[Should have]")
      .replaceAll("[optional]", "[OK to have]");
  return {
    name: row.name,
    heroName: row.heroName,
    heroSlug: row.heroSlug,
    identity: row.identity,
    fields: {
      Name: row.name,
      Notes: row.notes,
      Runes: priorities(row.runes),
      Weapons: priorities(row.weapons),
      Cores: priorities(row.cores),
    },
  };
}

export async function recordChange(
  tx: Transaction,
  kind: ChangeKind,
  targetId: number,
  event: ChangeEvent,
  before: Snapshot | null,
  after: Snapshot | null,
) {
  const snapshot = after ?? before;
  if (!snapshot) return;
  const fields = changedFields(
    before?.fields ?? null,
    after?.fields ?? null,
    before?.identity,
    after?.identity,
  );
  if (event === "updated" && fields.length === 0) return;
  await tx.insert(schema.contentChanges).values({
    kind,
    targetId,
    event,
    name: snapshot.name,
    heroName: snapshot.heroName,
    heroSlug: snapshot.heroSlug,
    fields,
  });
}
