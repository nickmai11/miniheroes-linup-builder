import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, inArray } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

const testUrl = process.env.PRIVACY_TEST_DATABASE_URL;
test(
  "private builds stay owner-only across reads, assignments, imports, votes, history and mutations",
  { skip: !testUrl },
  async () => {
    const url = new URL(testUrl);
    assert.equal(url.hostname, "127.0.0.1");
    assert.equal(url.port, "55443");
    assert.equal(url.username, "vote_test");
    assert.equal(url.pathname, "/votes_test");
    const client = postgres(testUrl, { prepare: false });
    const schema = loadTypeScript("src/db/schema.ts");
    const db = drizzle(client, { schema });
    let adminId = "owner";
    let device = null;
    const overrides = {
      "@/db": { db, schema },
      "@/lib/admin-access": { getAdminId: async () => adminId },
      "@/lib/app-access": {
        getRegisteredDevice: async () => device,
        hasAppAccess: async () => Boolean(adminId || device?.fullAccess),
        requireAppAccess: async () => {
          assert.ok(adminId);
        },
      },
      "@/lib/editing": {
        canEditContent: async () => Boolean(adminId),
        EDITING_ERROR: "Sign in as admin to make changes.",
      },
      "next/cache": { revalidatePath() {} },
      "./heroes": {
        syncSeededHeroDetails: async () => {},
        divinitiesByHeroIds: async () => new Map(),
      },
    };
    const actions = loadTypeScript(
      "src/app/heroes/[slug]/build-actions.ts",
      overrides,
    );
    const lineupActions = loadTypeScript(
      "src/app/lineups/actions.ts",
      overrides,
    );
    const builds = loadTypeScript("src/lib/builds.ts", overrides);
    const lineups = loadTypeScript("src/lib/lineups.ts", overrides);
    const changes = loadTypeScript("src/lib/changes.ts", overrides);
    const votes = loadTypeScript("src/lib/votes.ts", overrides);
    const prefix = `build-privacy-${Date.now()}`;
    const fixtures = [];
    const buildIds = [];
    const lineupIds = [];
    async function insert(table, values) {
      const rows = await db.insert(table).values(values).returning();
      fixtures.push({ table, ids: rows.map((r) => r.id) });
      return rows;
    }
    try {
      const heroes = await insert(
        schema.heroes,
        Array.from({ length: 5 }, (_, i) => ({
          slug: `${prefix}-${i}`,
          name: `${prefix} hero ${i}`,
          role: "warrior",
          rarity: "mythic",
        })),
      );
      const [rune] = await insert(schema.runeAttributes, {
        slug: prefix,
        name: "Test rune",
        runeType: "attack",
        maxValue: 10,
      });
      const input = {
        heroId: heroes[0].id,
        name: `${prefix} secret build`,
        notes: "Private strategy",
        runeAttributeIds: [rune.id],
        weaponAttributeIds: [],
      };
      const saved = await actions.saveHeroBuild(input);
      assert.ok(saved.id, saved.error);
      const id = saved.id;
      buildIds.push(id);
      const lineupInput = {
        name: `${prefix} lineup`,
        slots: heroes.map((h, i) => ({
          heroId: h.id,
          buildId: i === 0 ? id : null,
        })),
      };
      const lineup = await lineupActions.saveLineup(lineupInput);
      assert.ok(lineup.id, lineup.error);
      lineupIds.push(lineup.id);
      const page = `/heroes/${heroes[0].slug}`;
      await insert(schema.publicUrls, [
        { path: page },
        { path: `/lineups/${lineup.id}` },
      ]);
      assert.equal(
        (await actions.setBuildVisibility(id, true)).error,
        undefined,
      );
      const [privateBuild] = await builds.getHeroBuilds(heroes[0].id);
      assert.equal(privateBuild.isPrivate, true);
      assert.equal(Object.hasOwn(privateBuild, "privateOwnerId"), false);
      assert.ok(
        (await builds.getHeroIdsWithBuilds([heroes[0].id])).has(heroes[0].id),
      );
      // Older editors must not publish by omitting isPrivate.
      assert.equal(
        (await actions.saveHeroBuild({ ...input, id })).error,
        undefined,
      );
      assert.equal((await builds.getBuildsByIds([id]))[0].isPrivate, true);
      const imported = await actions.importHeroBuild({
        heroId: heroes[1].id,
        sourceBuildId: id,
      });
      assert.ok(imported.id, imported.error);
      buildIds.push(imported.id);
      assert.equal(
        (await builds.getBuildsByIds([imported.id]))[0].isPrivate,
        true,
      );
      assert.ok(
        (await changes.getChangeHistory("build", id)).entries.some((e) =>
          e.fields.some((f) => f.label === "Visibility"),
        ),
      );

      for (const audience of [
        { admin: null, device: null },
        { admin: null, device: { id: 999, fullAccess: true, lineupIds: [] } },
        {
          admin: null,
          device: { id: 999, fullAccess: false, lineupIds: [lineup.id] },
        },
        { admin: "other-admin", device: null },
      ]) {
        adminId = audience.admin;
        device = audience.device;
        assert.deepEqual(await builds.getHeroBuilds(heroes[0].id), []);
        assert.deepEqual(await builds.getBuildsByIds([id]), []);
        assert.deepEqual(await builds.getBuildsForHeroes([heroes[0].id]), []);
        assert.equal(
          (await builds.getHeroIdsWithBuilds([heroes[0].id])).size,
          0,
        );
        assert.equal(
          (await builds.getOtherHeroBuilds(heroes[4].id, prefix)).builds.length,
          0,
        );
        assert.equal((await lineups.getLineup(lineup.id)).slots[0].build, null);
        assert.equal(
          (await votes.getVoteAccess({ kind: "build", id, page })).allowed,
          false,
        );
        assert.equal(
          (
            await votes.getVoteAccess({
              kind: "build",
              id,
              page: `/lineups/${lineup.id}`,
            })
          ).allowed,
          false,
        );
        assert.equal(await changes.getChangeHistory("build", id), null);
        assert.equal(
          (await changes.getChangeHistory("lineup", lineup.id)).entries.length,
          0,
        );
        assert.equal(
          (await changes.getRecentChanges()).some(
            (e) => e.kind === "build" && buildIds.includes(e.targetId),
          ),
          false,
        );
        assert.ok((await actions.setBuildVisibility(id, false)).error);
        assert.ok((await actions.saveHeroBuild({ ...input, id })).error);
        assert.ok(
          (
            await actions.importHeroBuild({
              heroId: heroes[3].id,
              sourceBuildId: id,
            })
          ).error,
        );
        assert.ok((await actions.deleteHeroBuild(id)).error);
        assert.ok(
          (
            await lineupActions.saveLineup({
              ...lineupInput,
              name: "Unauthorized copy",
            })
          ).error,
        );
      }
      adminId = "owner";
      device = null;
      assert.equal(
        (await actions.setBuildVisibility(id, false)).error,
        undefined,
      );
      adminId = null;
      assert.equal((await builds.getBuildsByIds([id])).length, 1);
      assert.equal(
        (await votes.getVoteAccess({ kind: "build", id, page })).allowed,
        true,
      );
      assert.ok(
        (await changes.getChangeHistory("lineup", lineup.id)).entries.length,
      );

      // Removing a build assignment cannot expose its name in past lineup history.
      adminId = "owner";
      await lineupActions.saveLineup({
        ...lineupInput,
        id: lineup.id,
        slots: lineupInput.slots.map((s) => ({ ...s, buildId: null })),
      });
      await actions.setBuildVisibility(id, true);
      await actions.deleteHeroBuild(id);
      adminId = "other-admin";
      assert.equal(
        (await changes.getChangeHistory("lineup", lineup.id)).entries.length,
        0,
      );
      assert.equal(
        (await changes.getRecentChanges()).some(
          (e) => e.kind === "build" && e.targetId === id,
        ),
        false,
      );
      adminId = "owner";
      assert.ok(
        (await changes.getChangeHistory("lineup", lineup.id)).entries.length,
      );
      assert.ok(
        (await changes.getRecentChanges()).some(
          (e) =>
            e.kind === "build" && e.targetId === id && e.event === "deleted",
        ),
      );
    } finally {
      for (const [kind, ids] of [
        ["build", buildIds],
        ["lineup", lineupIds],
      ]) {
        if (ids.length)
          await db
            .delete(schema.contentChanges)
            .where(
              and(
                eq(schema.contentChanges.kind, kind),
                inArray(schema.contentChanges.targetId, ids),
              ),
            );
      }
      if (lineupIds.length)
        await db
          .delete(schema.lineups)
          .where(inArray(schema.lineups.id, lineupIds));
      for (const fixture of fixtures.reverse())
        await db
          .delete(fixture.table)
          .where(inArray(fixture.table.id, fixture.ids));
      await client.end();
    }
  },
);
