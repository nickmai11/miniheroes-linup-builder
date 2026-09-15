import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, inArray } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

const testUrl = process.env.CHANGES_TEST_DATABASE_URL;
test(
  "history records atomic changes, paginates, and respects current target access",
  { skip: !testUrl },
  async () => {
    const url = new URL(testUrl);
    assert.equal(url.hostname, "127.0.0.1");
    assert.equal(url.port, "55443");
    assert.equal(url.username, "vote_test");
    assert.equal(url.pathname, "/votes_test");
    const client = postgres(testUrl, { prepare: false, max: 6 });
    const schema = loadTypeScript("src/db/schema.ts");
    let failHistory = false;
    const db = drizzle(client, {
      schema,
      logger: {
        logQuery(query) {
          if (failHistory && query.startsWith('insert into "content_changes"'))
            throw new Error("History insert failed");
        },
      },
    });
    let fullAccess = true;
    let device = null;
    const invalidations = [];
    const overrides = {
      "@/db": { db, schema },
      "@/lib/app-access": {
        requireAppAccess: async () => {},
        hasAppAccess: async () => fullAccess,
        getRegisteredDevice: async () => device,
      },
      "@/lib/editing": {
        canEditContent: async () => true,
        requireEditing: async () => {},
      },
      "next/cache": { revalidatePath: (path) => invalidations.push(path) },
      "next/navigation": {
        redirect: (path) => {
          throw new Error(`Redirect ${path}`);
        },
      },
    };
    const { saveLineup, deleteLineup } = loadTypeScript(
      "src/app/lineups/actions.ts",
      overrides,
    );
    const { saveHeroBuild, importHeroBuild, deleteHeroBuild } = loadTypeScript(
      "src/app/heroes/[slug]/build-actions.ts",
      overrides,
    );
    const changes = loadTypeScript("src/lib/changes.ts", overrides);
    const { GET } = loadTypeScript("src/app/api/changes/route.ts", {
      "@/lib/changes": changes,
    });
    const get = (query) =>
      GET(new Request(`http://localhost/api/changes?${query}`));
    const fixtures = [];
    const lineupIds = [];
    const buildIds = [];
    const prefix = `history-test-${Date.now()}`;
    async function insert(table, values) {
      const rows = await db.insert(table).values(values).returning();
      fixtures.push({ table, ids: rows.map((row) => row.id) });
      return rows;
    }
    async function save(action, input, ids) {
      const result = await action(input);
      assert.equal(result.error, undefined);
      assert.ok(result.id);
      if (!ids.includes(result.id)) ids.push(result.id);
      return result.id;
    }
    const history = (kind, id, before) =>
      changes.getChangeHistory(kind, id, before);
    try {
      const heroes = await insert(
        schema.heroes,
        Array.from({ length: 6 }, (_, i) => ({
          slug: `${prefix}-${i}`,
          name: `Hero ${i}`,
          role: "warrior",
          rarity: "mythic",
        })),
      );
      const [rune] = await insert(schema.runeAttributes, {
        slug: prefix,
        name: "ATK",
        runeType: "attack",
        maxValue: 10,
      });
      const [weapon] = await insert(schema.weaponAttributes, {
        slug: prefix,
        name: "Physical DMG",
      });
      const [core] = await insert(schema.heroCores, {
        heroId: heroes[0].id,
        name: "Test Helm",
      });
      for (const table of [schema.pets, schema.relics, schema.fishes]) {
        await insert(table, {
          slug: prefix,
          name: table === schema.fishes ? "Fish A" : "Companion A",
          iconUrl: "/test.png",
          ...(table === schema.fishes ? { fishType: "Small" } : {}),
        });
      }
      const [petId, relicId, fishId] = fixtures
        .slice(-3)
        .map((fixture) => fixture.ids[0]);
      const buildInput = {
        heroId: heroes[0].id,
        name: `${prefix} build`,
        notes: "Original",
        runeAttributeIds: [rune.id],
        weaponAttributeIds: [weapon.id],
        coreIds: [core.id],
      };
      const buildId = await save(saveHeroBuild, buildInput, buildIds);
      assert.equal(
        (await history("build", buildId)).entries[0].event,
        "created",
      );
      const editedBuild = {
        ...buildInput,
        id: buildId,
        notes: "Revised",
        runePriorities: { [rune.id]: "important" },
        weaponPriorities: { [weapon.id]: "must" },
        corePriorities: { [core.id]: "important" },
      };
      await save(saveHeroBuild, editedBuild, buildIds);
      const buildChange = (await history("build", buildId)).entries[0];
      assert.deepEqual(
        buildChange.fields.map((field) => field.label),
        ["Notes", "Runes", "Weapons", "Cores"],
      );
      assert.match(
        buildChange.fields.find((field) => field.label === "Runes").after,
        /Important/,
      );
      await save(saveHeroBuild, editedBuild, buildIds);
      assert.equal(
        (await history("build", buildId)).entries.length,
        2,
        "no-op saves do not create events",
      );

      const lineupInput = {
        name: `${prefix} lineup`,
        description: "Original lineup",
        slots: heroes.slice(0, 5).map((hero, i) => ({
          heroId: hero.id,
          ...(i === 0 ? { buildId, petIds: [petId], relicIds: [relicId] } : {}),
        })),
        fishSelections: [{ fishId, quantity: 1 }],
      };
      const lineupId = await save(saveLineup, lineupInput, lineupIds);
      const original = (await history("lineup", lineupId)).entries[0];
      assert.equal(original.event, "created");
      assert.match(
        original.fields.find((field) => field.label === "Slot 1").after,
        /Companion A/,
      );
      const edited = {
        ...lineupInput,
        id: lineupId,
        name: `${prefix} renamed`,
        description: "Changed notes",
        fishSelections: [{ fishId, quantity: 2 }],
      };
      await save(saveLineup, edited, lineupIds);
      const event = (await history("lineup", lineupId)).entries[0];
      assert.deepEqual(
        event.fields.map((field) => field.label),
        ["Name", "Notes", "Fishes"],
      );
      assert.deepEqual(event.fields[2], {
        label: "Fishes",
        before: "Fish A ×1",
        after: "Fish A ×2",
      });
      await save(saveLineup, edited, lineupIds);
      assert.equal((await history("lineup", lineupId)).entries.length, 2);

      failHistory = true;
      await assert.rejects(saveLineup({ ...edited, name: "Must roll back" }));
      await assert.rejects(
        saveHeroBuild({ ...editedBuild, notes: "Must roll back" }),
      );
      failHistory = false;
      assert.equal(
        (
          await db
            .select()
            .from(schema.lineups)
            .where(eq(schema.lineups.id, lineupId))
        )[0].name,
        edited.name,
      );
      assert.equal(
        (
          await db
            .select()
            .from(schema.heroBuilds)
            .where(eq(schema.heroBuilds.id, buildId))
        )[0].notes,
        "Revised",
      );
      assert.equal((await history("lineup", lineupId)).entries.length, 2);
      const importedId = await save(
        importHeroBuild,
        { heroId: heroes[5].id, sourceBuildId: buildId },
        buildIds,
      );
      assert.equal(
        (await history("build", importedId)).entries[0].event,
        "imported",
      );

      // A published home or hero page must never expose a private lineup.
      fullAccess = false;
      assert.equal(await history("lineup", lineupId), null);
      assert.equal((await get(`kind=lineup&id=${lineupId}`)).status, 403);
      assert.equal((await get("kind=lineup&id=-1")).status, 400);
      await insert(schema.publicUrls, { path: `/heroes/${heroes[0].slug}` });
      assert.equal((await history("build", buildId)).entries.length, 2);
      assert.equal(await history("lineup", lineupId), null);
      assert.ok(
        !(await changes.getRecentChanges()).some(
          (row) => row.kind === "lineup" && row.targetId === lineupId,
        ),
      );
      await db
        .delete(schema.publicUrls)
        .where(eq(schema.publicUrls.path, `/heroes/${heroes[0].slug}`));
      device = { lineupIds: [lineupId], fullAccess: false };
      assert.equal((await history("lineup", lineupId)).entries.length, 2);
      assert.equal((await history("build", buildId)).entries.length, 2);
      assert.equal(await history("build", importedId), null);
      assert.ok(
        (await changes.getRecentChanges())
          .filter(
            (entry) => entry.targetId === buildId && entry.kind === "build",
          )
          .every((entry) => entry.href === `/lineups/${lineupId}`),
      );
      device = null;
      await insert(schema.publicUrls, { path: `/lineups/${lineupId}` });
      const publicResponse = await get(`kind=lineup&id=${lineupId}`);
      assert.equal(publicResponse.status, 200);
      assert.equal(
        publicResponse.headers.get("cache-control"),
        "private, no-store",
      );
      assert.equal((await history("build", buildId)).entries.length, 2);
      await db
        .delete(schema.publicUrls)
        .where(eq(schema.publicUrls.path, `/lineups/${lineupId}`));
      assert.equal(
        await history("lineup", lineupId),
        null,
        "revocation takes effect immediately",
      );

      await insert(schema.publicUrls, { path: "/lineups" });
      assert.equal((await history("lineup", lineupId)).entries.length, 2);
      assert.ok(
        (await changes.getRecentChanges())
          .filter(
            (entry) => entry.targetId === lineupId && entry.kind === "lineup",
          )
          .every((entry) => entry.href === "/lineups"),
      );
      await db
        .delete(schema.publicUrls)
        .where(eq(schema.publicUrls.path, "/lineups"));

      fullAccess = true;
      for (let i = 0; i < 22; i++)
        await save(
          saveLineup,
          { ...edited, description: `Revision ${i}` },
          lineupIds,
        );
      const first = await history("lineup", lineupId);
      const second = await history("lineup", lineupId, first.nextCursor);
      assert.equal(first.entries.length, 20);
      assert.equal(second.entries.length, 4);
      assert.equal(second.nextCursor, null);
      assert.equal(
        new Set([...first.entries, ...second.entries].map((entry) => entry.id))
          .size,
        24,
      );
      const recent = await changes.getRecentChanges();
      assert.equal(recent.length, 10);
      assert.ok(
        recent.every((entry, i) => i === 0 || entry.id < recent[i - 1].id),
      );
      await Promise.all([
        save(saveLineup, { ...edited, description: "Concurrent A" }, lineupIds),
        save(saveLineup, { ...edited, description: "Concurrent B" }, lineupIds),
      ]);
      const concurrent = (await history("lineup", lineupId)).entries.slice(
        0,
        2,
      );
      assert.equal(
        concurrent[0].fields.find((field) => field.label === "Notes").before,
        concurrent[1].fields.find((field) => field.label === "Notes").after,
      );

      // Distinct builds may have the same display name; swapping them still counts.
      const sameNameId = await save(saveHeroBuild, buildInput, buildIds);
      const swapped = {
        ...edited,
        slots: edited.slots.map((slot, i) =>
          i === 0 ? { ...slot, buildId: sameNameId } : slot,
        ),
      };
      await save(saveLineup, swapped, lineupIds);
      const swap = (await history("lineup", lineupId)).entries[0].fields.find(
        (field) => field.label === "Slot 1",
      );
      assert.equal(swap.before, swap.after);
      assert.equal(swap.selectionChanged, true);
      await save(saveLineup, edited, lineupIds);

      await deleteHeroBuild(buildId);
      const cleared = (await history("lineup", lineupId)).entries[0];
      assert.equal(cleared.fields[0].label, "Slot 1");
      assert.ok(cleared.fields[0].before.includes(buildInput.name));
      assert.ok(!cleared.fields[0].after.includes(buildInput.name));
      assert.ok(
        (await changes.getRecentChanges()).some(
          (entry) =>
            entry.kind === "build" &&
            entry.targetId === buildId &&
            entry.event === "deleted" &&
            entry.href === null,
        ),
      );
      assert.equal(await history("build", buildId), null);
      await assert.rejects(deleteLineup(lineupId), /Redirect/);
      assert.ok(
        (await changes.getRecentChanges()).some(
          (entry) =>
            entry.kind === "lineup" &&
            entry.targetId === lineupId &&
            entry.event === "deleted" &&
            entry.href === null,
        ),
      );
      fullAccess = false;
      device = { lineupIds: [lineupId] };
      assert.equal(await history("lineup", lineupId), null);
      assert.ok(
        !(await changes.getRecentChanges()).some(
          (entry) =>
            lineupIds.includes(entry.targetId) && entry.kind === "lineup",
        ),
      );
      assert.ok(invalidations.includes("/"));
    } finally {
      failHistory = false;
      if (lineupIds.length) {
        await db
          .delete(schema.contentChanges)
          .where(
            and(
              eq(schema.contentChanges.kind, "lineup"),
              inArray(schema.contentChanges.targetId, lineupIds),
            ),
          );
        await db
          .delete(schema.lineups)
          .where(inArray(schema.lineups.id, lineupIds));
      }
      if (buildIds.length) {
        await db
          .delete(schema.contentChanges)
          .where(
            and(
              eq(schema.contentChanges.kind, "build"),
              inArray(schema.contentChanges.targetId, buildIds),
            ),
          );
        await db
          .delete(schema.heroBuilds)
          .where(inArray(schema.heroBuilds.id, buildIds));
      }
      for (const { table, ids } of fixtures.reverse())
        await db.delete(table).where(inArray(table.id, ids));
      await client.end();
    }
  },
);
