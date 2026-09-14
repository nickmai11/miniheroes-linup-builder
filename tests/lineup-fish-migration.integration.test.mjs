import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

const testUrl = process.env.LINEUP_TEST_DATABASE_URL;

test(
  "lineups work before the fish migration and enable quantities immediately afterward",
  {
    skip: !testUrl,
  },
  async () => {
    const target = new URL(testUrl);
    assert.equal(target.hostname, "127.0.0.1");
    assert.equal(target.port, "55440");
    assert.equal(target.username, "lineup_test");
    assert.equal(target.pathname, "/lineup_edit_test");
    const namespace = `fish_legacy_${Date.now()}`;
    const sql = postgres(testUrl, {
      max: 1,
      prepare: false,
      connection: { search_path: `${namespace},public` },
    });
    const schema = loadTypeScript("src/db/schema.ts");
    const db = drizzle(sql, { schema });
    const overrides = {
      "server-only": {},
      "@/db": { db, schema },
      "@/lib/app-access": { requireAppAccess: async () => {} },
      "@/lib/editing": { canEditContent: async () => true },
      "next/cache": { revalidatePath: () => {} },
      "./heroes": {
        syncSeededHeroDetails: async () => {},
        divinitiesByHeroIds: async () => new Map(),
      },
    };
    const { saveLineup } = loadTypeScript(
      "src/app/lineups/actions.ts",
      overrides,
    );
    const { getLineup, getAllLineups } = loadTypeScript(
      "src/lib/lineups.ts",
      overrides,
    );
    const { createLineupDraft } = loadTypeScript("src/lib/lineup-draft.ts");
    const lineupIds = [];
    let hero;
    let fishes = [];
    try {
      await sql`create schema ${sql(namespace)}`;
      await sql`
      create table ${sql(namespace)}.lineup_fishes (
        id integer generated always as identity primary key,
        lineup_id integer not null references public.lineups(id) on delete cascade,
        fish_id integer not null references public.fishes(id) on delete cascade,
        sort_order integer not null default 0,
        unique (lineup_id, fish_id)
      )
    `;
      [hero] = await db
        .insert(schema.heroes)
        .values({
          slug: namespace,
          name: "Migration test hero",
          role: "warrior",
          rarity: "mythic",
        })
        .returning();
      fishes = await db
        .insert(schema.fishes)
        .values(
          [0, 1].map((i) => ({
            slug: `${namespace}-${i}`,
            name: `Migration test fish ${i}`,
            fishType: "Small",
          })),
        )
        .returning();
      const input = {
        name: "Before fish migration",
        slots: [{ heroId: hero.id }, null, null, null, null],
        fishSelections: fishes.map((fish) => ({
          fishId: fish.id,
          quantity: 1,
        })),
      };
      const created = await saveLineup(input);
      assert.equal(created.error, undefined);
      lineupIds.push(created.id);
      const original = await getLineup(created.id);
      assert.deepEqual(
        original.fishes.map((fish) => fish.quantity),
        [1, 1],
      );
      assert.deepEqual(
        (await getAllLineups()).find((lineup) => lineup.id === created.id)
          .fishes,
        original.fishes,
      );
      const clone = await saveLineup(createLineupDraft(original, true));
      assert.equal(clone.error, undefined);
      lineupIds.push(clone.id);
      assert.deepEqual((await getLineup(clone.id)).fishes, original.fishes);
      const quantities = [
        { fishId: fishes[0].id, quantity: 4 },
        { fishId: fishes[1].id, quantity: 2 },
      ];
      const rejected = await saveLineup({
        ...input,
        id: created.id,
        name: "Must not change",
        fishSelections: quantities,
      });
      assert.match(rejected.error, /Multiple copies/);
      assert.deepEqual(await getLineup(created.id), original);
      const edited = await saveLineup({
        ...input,
        id: created.id,
        name: "Still editable",
      });
      assert.equal(edited.error, undefined);
      assert.equal((await getLineup(created.id)).name, "Still editable");

      const migration = readFileSync(
        new URL("../drizzle/0024_lineup_fish_quantities.sql", import.meta.url),
        "utf8",
      );
      for (const statement of migration.split("--> statement-breakpoint")) {
        if (statement.trim()) await sql.unsafe(statement);
      }
      assert.deepEqual(
        (await getLineup(created.id)).fishes.map((fish) => fish.quantity),
        [1, 1],
      );
      const updated = await saveLineup({
        ...input,
        id: created.id,
        fishSelections: quantities,
      });
      assert.equal(updated.error, undefined);
      assert.deepEqual(
        (await getLineup(created.id)).fishes.map((fish) => fish.quantity),
        [4, 2],
      );
    } finally {
      if (lineupIds.length)
        await db
          .delete(schema.lineups)
          .where(inArray(schema.lineups.id, lineupIds));
      if (fishes.length)
        await db.delete(schema.fishes).where(
          inArray(
            schema.fishes.id,
            fishes.map((fish) => fish.id),
          ),
        );
      if (hero)
        await db.delete(schema.heroes).where(eq(schema.heroes.id, hero.id));
      await sql`drop schema if exists ${sql(namespace)} cascade`;
      await sql.end({ timeout: 1 });
    }
  },
);
