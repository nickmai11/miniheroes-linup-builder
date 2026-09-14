import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

const { createLineupDraft } = loadTypeScript("src/lib/lineup-draft.ts");

// Opt-in, disposable local database only; never uses the app's DATABASE_URL.
const testUrl = process.env.LINEUP_TEST_DATABASE_URL;

test(
  "lineup create/edit round trips, isolation, validation, rollback, and cascading deletes",
  { skip: !testUrl },
  async () => {
    const target = new URL(testUrl);
    assert.equal(target.hostname, "127.0.0.1");
    assert.equal(target.port, "55440");
    assert.equal(target.username, "lineup_test");
    assert.equal(target.pathname, "/lineup_edit_test");
    const sql = postgres(testUrl, { prepare: false, max: 4 });
    const schema = loadTypeScript("src/db/schema.ts");
    let failRelicInsert = false;
    let failFishInsert = false;
    const db = drizzle(sql, {
      schema,
      logger: {
        logQuery(query) {
          if (failFishInsert && query.startsWith('insert into "lineup_fishes"'))
            throw new Error("Simulated fish selection failure");
          if (
            failRelicInsert &&
            query.startsWith('insert into "lineup_hero_relics"')
          )
            throw new Error("Simulated assignment failure");
        },
      },
    });
    const invalidated = [];
    const actions = loadTypeScript("src/app/lineups/actions.ts", {
      "@/db": { db, schema },
      "@/lib/app-access": { requireAppAccess: async () => {} },
      "@/lib/editing": {
        canEditContent: async () => true,
        requireEditing: async () => {},
      },
      "next/cache": { revalidatePath: (...args) => invalidated.push(args) },
      "next/navigation": {
        redirect: (path) => {
          throw Object.assign(new Error("redirect"), { path });
        },
      },
    });
    const { getLineup, getAllLineups } = loadTypeScript("src/lib/lineups.ts", {
      "server-only": {},
      "@/db": { db, schema },
      "./heroes": {
        syncSeededHeroDetails: async () => {},
        divinitiesByHeroIds: async () => new Map(),
      },
    });
    const savedIds = [];
    const fixtures = [];
    async function save(input) {
      const result = await actions.saveLineup(input);
      assert.equal(result.error, undefined);
      assert.ok(Number.isInteger(result.id));
      if (!savedIds.includes(result.id)) savedIds.push(result.id);
      return result.id;
    }
    try {
      const prefix = `lineup-test-${Date.now()}`;
      for (const [table, count] of [
        [schema.heroes, 5],
        [schema.pets, 2],
        [schema.relics, 2],
        [schema.fishes, 3],
      ]) {
        const rows = await db
          .insert(table)
          .values(
            Array.from({ length: count }, (_, i) =>
              table === schema.heroes
                ? {
                    slug: `${prefix}-hero-${i}`,
                    name: `Hero ${i}`,
                    role: "warrior",
                    rarity: "mythic",
                  }
                : {
                    slug: `${prefix}-${i}`,
                    name: `Item ${i}`,
                    iconUrl: "/test.png",
                    ...(table === schema.fishes ? { fishType: "Small" } : {}),
                  },
            ),
          )
          .returning();
        fixtures.push({ table, rows });
      }
      const [heroes, pets, relics, fishes] = fixtures.map(
        (fixture) => fixture.rows,
      );
      const heroId = heroes[0].id;
      const [build, otherBuild] = await db
        .insert(schema.heroBuilds)
        .values([
          { heroId, name: "Own build", notes: "Build priorities" },
          { heroId: heroes[1].id, name: "Another hero's build" },
        ])
        .returning();
      const [skill] = await db
        .insert(schema.heroSkills)
        .values({
          heroId,
          kind: "battle",
          name: "Linked talent",
          description: "Recorded skill effect",
          unlockStars: 2,
        })
        .returning();
      const [core] = await db
        .insert(schema.heroCores)
        .values({
          heroId,
          skillId: skill.id,
          name: "Linked core",
          description: "Recorded core effect",
        })
        .returning();
      await db
        .insert(schema.heroBuildCores)
        .values({ buildId: build.id, coreId: core.id, priority: "must" });
      const selection = {
        heroId,
        buildId: build.id,
        petIds: pets.map((pet) => pet.id).reverse(),
        relicIds: relics.map((relic) => relic.id),
      };
      const original = {
        name: "Original",
        fishSelections: [
          { fishId: fishes[1].id, quantity: 4 },
          { fishId: fishes[0].id, quantity: 3 },
        ],
        description: "Keep notes",
        slots: [
          selection,
          { heroId: heroes[3].id },
          { heroId: heroes[1].id },
          { heroId: heroes[2].id },
          { heroId: heroes[4].id },
        ],
      };
      const id = await save(original);
      const first = await getLineup(id);
      assert.equal(first.name, "Original");
      assert.deepEqual(
        first.fishes.map((fish) => ({
          fishId: fish.id,
          quantity: fish.quantity,
        })),
        original.fishSelections,
      );
      assert.ok(first.fishes.every((fish) => fish.fishType === "Small"));
      assert.equal(first.slots[1].id, heroes[3].id);
      assert.deepEqual(
        first.slots[0].pets.map((pet) => pet.id),
        selection.petIds,
      );
      assert.deepEqual(
        first.slots[0].relics.map((relic) => relic.id),
        selection.relicIds,
      );
      assert.deepEqual(first.slots[2].pets, []);
      assert.equal(first.slots[0].build.id, build.id);
      assert.equal(first.slots[0].build.cores[0].skill.name, "Linked talent");
      assert.equal(
        first.slots[0].build.cores[0].skill.description,
        "Recorded skill effect",
      );
      assert.equal(first.slots[0].build.cores[0].priority, "must");
      assert.equal(first.slots[2].build, null);

      const cloneId = await save(createLineupDraft(first, true));
      assert.notEqual(cloneId, id);
      const clone = await getLineup(cloneId);
      assert.equal(clone.name, "Original (copy)");
      assert.deepEqual(clone.slots, first.slots);
      assert.deepEqual(clone.fishes, first.fishes);
      assert.equal(clone.description, first.description);
      await save({
        ...createLineupDraft(clone),
        name: "Changed copy",
        fishSelections: [],
        slots: heroes.map((hero) => ({ heroId: hero.id })),
      });
      assert.deepEqual(await getLineup(id), first);
      assert.deepEqual((await getLineup(cloneId)).fishes, []);

      const otherId = await save({
        name: "Other lineup",
        slots: heroes.map((hero) => ({ heroId: hero.id })),
      });
      const edited = {
        id,
        name: "Edited",
        fishSelections: [
          { fishId: fishes[2].id, quantity: 2 },
          { fishId: fishes[1].id, quantity: 1 },
        ],
        description: "Changed notes",
        slots: [
          { heroId: heroes[3].id },
          { ...selection, petIds: [pets[0].id] },
          { heroId: heroes[1].id },
          { heroId: heroes[2].id },
          { heroId: heroes[4].id },
        ],
      };
      assert.equal(await save(edited), id);
      const after = await getLineup(id);
      assert.equal(after.createdAt.getTime(), first.createdAt.getTime());
      assert.equal(after.name, "Edited");
      assert.deepEqual(
        after.fishes.map((fish) => ({
          fishId: fish.id,
          quantity: fish.quantity,
        })),
        edited.fishSelections,
      );
      assert.deepEqual((await getLineup(otherId)).fishes, []);
      assert.deepEqual(
        (await getAllLineups()).find((lineup) => lineup.id === id).fishes,
        after.fishes,
      );
      assert.equal(after.description, "Changed notes");
      assert.equal(after.slots[0].id, heroes[3].id);
      assert.equal(after.slots[2].id, heroes[1].id);
      assert.equal(
        after.slots[1].build.id,
        build.id,
        "Build follows the hero into another slot",
      );
      assert.deepEqual(
        after.slots[1].pets.map((pet) => pet.id),
        [pets[0].id],
      );
      assert.deepEqual(
        after.slots[1].relics.map((relic) => relic.id),
        selection.relicIds,
      );
      assert.deepEqual((await getLineup(otherId)).slots[0].pets, []);
      assert.equal((await getLineup(otherId)).slots[0].build, null);
      assert.equal(
        (await getAllLineups()).filter((lineup) => savedIds.includes(lineup.id))
          .length,
        3,
      );
      assert.ok(invalidated.some(([path]) => path === `/lineups/${id}/edit`));

      for (const saveId of [undefined, id]) {
        const input = structuredClone(edited);
        input.id = saveId;
        input.slots[4] = null;
        assert.equal(
          (await actions.saveLineup(input)).error,
          "Pick all five heroes before saving",
        );
        assert.deepEqual(await getLineup(id), after);
      }

      for (const [field, value, message] of [
        ["heroId", 2147483647, "heroes"],
        ["petIds", [2147483647], "pets"],
        ["relicIds", [2147483647], "relics"],
        ["buildId", otherBuild.id, "belonging"],
        ["buildId", 2147483647, "belonging"],
      ]) {
        const input = structuredClone(edited);
        input.slots[1][field] = value;
        assert.match(
          (await actions.saveLineup(input)).error,
          new RegExp(message),
        );
        assert.deepEqual(await getLineup(id), after);
      }
      assert.match(
        (await actions.saveLineup({ ...edited, id: 2147483647 })).error,
        /no longer exists/,
      );

      assert.match(
        (
          await actions.saveLineup({
            ...edited,
            fishSelections: [{ fishId: 2147483647, quantity: 1 }],
          })
        ).error,
        /fishes no longer exists/,
      );
      assert.deepEqual(await getLineup(id), after);
      for (const quantity of [0, 5, 1.5]) {
        assert.ok(
          (
            await actions.saveLineup({
              ...edited,
              fishSelections: [{ fishId: fishes[0].id, quantity }],
            })
          ).error,
        );
        assert.deepEqual(await getLineup(id), after);
      }
      for (const quantity of [0, 5]) {
        await assert.rejects(
          db
            .update(schema.lineupFishes)
            .set({ quantity })
            .where(eq(schema.lineupFishes.lineupId, id)),
          (error) => error.cause?.code === "23514",
          "The database also enforces the per-fish quantity limit",
        );
      }
      assert.deepEqual(await getLineup(id), after);
      const [defaultFish] = await db
        .insert(schema.lineupFishes)
        .values({ lineupId: otherId, fishId: fishes[0].id })
        .returning();
      assert.equal(defaultFish.quantity, 1);
      await db
        .delete(schema.lineupFishes)
        .where(eq(schema.lineupFishes.id, defaultFish.id));
      failFishInsert = true;
      await assert.rejects(
        actions.saveLineup({
          ...edited,
          name: "Fish failure",
          fishSelections: [{ fishId: fishes[0].id, quantity: 4 }],
        }),
      );
      assert.deepEqual(
        await getLineup(id),
        after,
        "Fish insert failure rolls back the whole lineup",
      );
      failFishInsert = false;
      await save({ ...edited, fishSelections: [] });
      assert.deepEqual((await getLineup(id)).fishes, []);
      await save(edited);

      failRelicInsert = true;
      await assert.rejects(
        actions.saveLineup({ ...edited, name: "Must roll back" }),
      );
      assert.deepEqual(
        await getLineup(id),
        after,
        "An assignment failure must roll back name, formation and all assignments",
      );
      failRelicInsert = false;
      await save({
        ...edited,
        slots: edited.slots.map((slot) => ({ heroId: slot.heroId })),
      });
      assert.deepEqual((await getLineup(id)).slots[1].pets, []);
      assert.deepEqual((await getLineup(id)).slots[1].relics, []);
      assert.equal((await getLineup(id)).slots[1].build, null);
      await save(edited);
      await db
        .update(schema.heroBuilds)
        .set({ name: "Updated build" })
        .where(eq(schema.heroBuilds.id, build.id));
      assert.equal(
        (await getLineup(id)).slots[1].build.name,
        "Updated build",
        "Previews reflect the current saved build",
      );
      await db
        .delete(schema.heroBuilds)
        .where(eq(schema.heroBuilds.id, build.id));
      assert.equal(
        (await getLineup(id)).slots[1].build,
        null,
        "Deleting a build clears the assignment without deleting the hero",
      );
      assert.equal((await getLineup(id)).slots[1].id, heroId);
      await db.delete(schema.fishes).where(eq(schema.fishes.id, fishes[2].id));
      assert.deepEqual(
        (await getLineup(id)).fishes.map((fish) => fish.id),
        [fishes[1].id],
      );
      const slotIds = (
        await db
          .select()
          .from(schema.lineupHeroes)
          .where(eq(schema.lineupHeroes.lineupId, id))
      ).map((slot) => slot.id);
      await assert.rejects(
        actions.deleteLineup(id),
        (error) => error.path === "/lineups",
      );
      assert.equal(await getLineup(id), undefined);
      assert.deepEqual(
        await db
          .select()
          .from(schema.lineupFishes)
          .where(eq(schema.lineupFishes.lineupId, id)),
        [],
      );
      assert.ok(
        (await db.select().from(schema.lineupHeroPets)).every(
          (row) => !slotIds.includes(row.lineupHeroId),
        ),
      );
      assert.ok(
        (await db.select().from(schema.lineupHeroRelics)).every(
          (row) => !slotIds.includes(row.lineupHeroId),
        ),
      );
      assert.ok(await getLineup(otherId));
    } finally {
      for (const id of savedIds)
        await db.delete(schema.lineups).where(eq(schema.lineups.id, id));
      for (const { table, rows } of fixtures)
        for (const row of rows)
          await db.delete(table).where(eq(table.id, row.id));
      await sql.end({ timeout: 1 });
    }
  },
);
