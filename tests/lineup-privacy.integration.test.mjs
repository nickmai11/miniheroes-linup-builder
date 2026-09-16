import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, inArray } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

const testUrl = process.env.PRIVACY_TEST_DATABASE_URL;

test(
  "private lineups are owner-only across reads, sharing, mutations, and retained history",
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
        requireEditing: async () => {
          assert.ok(adminId);
        },
      },
      "next/cache": { revalidatePath: () => {} },
      "next/navigation": {
        redirect: (path) => {
          throw new Error(`Redirect ${path}`);
        },
      },
      "./heroes": {
        syncSeededHeroDetails: async () => {},
        divinitiesByHeroIds: async () => new Map(),
      },
    };
    const actions = loadTypeScript("src/app/lineups/actions.ts", overrides);
    const lineups = loadTypeScript("src/lib/lineups.ts", overrides);
    const { getHeroDetail } = loadTypeScript("src/lib/heroes.ts", overrides);
    const previews = loadTypeScript(
      "src/lib/lineup-preview-access.ts",
      overrides,
    );
    const votes = loadTypeScript("src/lib/votes.ts", overrides);
    const follows = loadTypeScript("src/lib/follows.ts", overrides);
    const changes = loadTypeScript("src/lib/changes.ts", overrides);
    const { GET: preview } = loadTypeScript(
      "src/app/api/lineups/preview/route.ts",
      overrides,
    );
    const { GET: vote } = loadTypeScript(
      "src/app/api/votes/route.ts",
      overrides,
    );
    const { GET: history } = loadTypeScript(
      "src/app/api/changes/route.ts",
      overrides,
    );
    const { POST: invite } = loadTypeScript(
      "src/app/api/invitations/generate/route.ts",
      overrides,
    );
    const { createLineupDraft } = loadTypeScript("src/lib/lineup-draft.ts");
    const prefix = `privacy-${Date.now()}`;
    const savedIds = [];
    const fixtures = [];
    async function insert(table, values) {
      const rows = await db.insert(table).values(values).returning();
      fixtures.push({ table, ids: rows.map((row) => row.id) });
      return rows;
    }
    try {
      const heroes = await insert(
        schema.heroes,
        Array.from({ length: 5 }, (_, i) => ({
          slug: `${prefix}-${i}`,
          name: `Privacy hero ${i}`,
          role: "warrior",
          rarity: "mythic",
          imageUrl: `/heroes/${prefix}-${i}.png`,
        })),
      );
      const [build] = await insert(schema.heroBuilds, {
        heroId: heroes[0].id,
        name: "Shared build",
      });
      const [pet] = await insert(schema.pets, {
        slug: prefix,
        name: "Pet",
        iconUrl: `/pets/${prefix}.png`,
      });
      const assets = loadTypeScript("src/lib/public-url-assets.ts", {
        ...overrides,
        "@/data/heroes": { heroSeeds: heroes },
      });
      const input = {
        name: "Owner's hidden strategy",
        description: "Secret notes",
        slots: heroes.map((hero, i) => ({
          heroId: hero.id,
          buildId: i === 0 ? build.id : null,
          petIds: [pet.id],
        })),
      };
      const saved = await actions.saveLineup(input);
      assert.ok(saved.id, saved.error);
      const id = saved.id;
      savedIds.push(id);
      const page = `/lineups/${id}`;
      await insert(schema.publicUrls, [
        { path: page },
        { path: `/heroes/${heroes[0].slug}` },
      ]);
      const target = { kind: "lineup", id, page };
      const buildTarget = { kind: "build", id: build.id, page };
      const get = (endpoint, query) =>
        new Request(
          `https://example.com/api/${endpoint}?${new URLSearchParams(query)}`,
        );
      adminId = null;
      device = { id: 321, fullAccess: true, lineupIds: [] };
      await follows.setFollow(target, "device:321", true);
      assert.equal((await lineups.getLineup(id)).isPrivate, false);
      assert.equal((await votes.getVoteAccess(target)).allowed, true);
      assert.equal((await follows.getFollowedItems())[0].name, input.name);

      adminId = "owner";
      const beforeHide = await lineups.getLineup(id);
      assert.deepEqual(await actions.setLineupVisibility(id, true), { id });
      const hidden = await lineups.getLineup(id);
      assert.equal(hidden.isPrivate, true);
      assert.ok(hidden.updatedAt > beforeHide.updatedAt);
      assert.equal(Object.hasOwn(hidden, "privateOwnerId"), false);
      assert.equal(
        (await changes.getChangeHistory("lineup", id)).entries[0].fields[0]
          .label,
        "Visibility",
      );
      assert.equal(
        (
          await invite(
            new Request("https://example.com/api/invitations/generate", {
              method: "POST",
              headers: {
                origin: "https://example.com",
                "content-type": "application/json",
              },
              body: JSON.stringify({ lineupId: id }),
            }),
          )
        ).status,
        404,
      );

      // An older editor omitting visibility must not accidentally publish it.
      assert.deepEqual(await actions.saveLineup({ ...input, id }), { id });
      assert.equal((await lineups.getLineup(id)).isPrivate, true);
      const copied = await actions.saveLineup(createLineupDraft(hidden, true));
      assert.ok(copied.id, copied.error);
      savedIds.push(copied.id);
      assert.equal((await lineups.getLineup(copied.id)).isPrivate, true);

      for (const viewer of [
        { admin: null, device: null },
        { admin: null, device: { id: 321, fullAccess: true, lineupIds: [] } },
        {
          admin: null,
          device: { id: 321, fullAccess: false, lineupIds: [id] },
        },
        { admin: "another-admin", device: null },
      ]) {
        adminId = viewer.admin;
        device = viewer.device;
        assert.equal(await lineups.getLineup(id), undefined);
        assert.equal(
          (await lineups.getAllLineups()).some((lineup) => lineup.id === id),
          false,
        );
        assert.equal(
          (await getHeroDetail(heroes[0].slug)).lineups.some(
            (lineup) => lineup.id === id,
          ),
          false,
        );
        assert.equal(
          (
            await previews.heroLineupPreviewIds(
              heroes[0].slug,
              [id],
              Boolean(adminId || device?.fullAccess),
            )
          ).includes(id),
          false,
        );
        assert.equal((await votes.getVoteAccess(target)).allowed, false);
        assert.equal((await follows.getFollowAccess(target)).allowed, false);
        assert.equal(await changes.getChangeHistory("lineup", id), null);
        assert.equal(
          (await changes.getRecentChanges()).some(
            (change) => change.kind === "lineup" && change.targetId === id,
          ),
          false,
        );
        assert.equal(
          await assets.isPublicPageAsset(page, pet.iconUrl, [id]),
          false,
        );
        assert.equal(
          await assets.isPublicPageAsset("/lineups", pet.iconUrl),
          false,
        );
        assert.equal((await vote(get("votes", target))).status, 404);
        assert.equal(
          (await history(get("changes", { kind: "lineup", id }))).status,
          403,
        );
        assert.equal(
          (await preview(get("lineups/preview", { id, hero: heroes[0].slug })))
            .status,
          403,
        );
        if (device) {
          const followed = (await follows.getFollowedItems()).find(
            (item) => item.id === id,
          );
          assert.equal(followed.available, false);
          assert.equal(followed.name, "Unavailable lineup");
        }
        if (!adminId && !device?.fullAccess) {
          assert.equal((await votes.getVoteAccess(buildTarget)).allowed, false);
          // The build is independently readable through its published hero page.
          assert.ok(await changes.getChangeHistory("build", build.id));
        }
      }
      // An unrelated admin cannot reveal, overwrite, or delete the hidden lineup.
      assert.ok((await actions.setLineupVisibility(id, false)).error);
      assert.ok(
        (await actions.saveLineup({ ...input, id, isPrivate: false })).error,
      );
      await assert.rejects(actions.deleteLineup(id), /Redirect/);
      assert.equal(
        (
          await db
            .select()
            .from(schema.lineups)
            .where(eq(schema.lineups.id, id))
        )[0].privateOwnerId,
        "owner",
      );

      adminId = "owner";
      device = null;
      assert.deepEqual(await actions.setLineupVisibility(id, false), { id });
      adminId = null;
      assert.equal((await lineups.getLineup(id)).isPrivate, false);
      assert.equal((await votes.getVoteAccess(target)).allowed, true);
      assert.ok((await changes.getChangeHistory("lineup", id)).entries.length);
      assert.equal(await assets.isPublicPageAsset(page, pet.iconUrl), true);

      // Deletion cannot make old names, notes, or history public again.
      adminId = "owner";
      await actions.setLineupVisibility(id, true);
      await assert.rejects(actions.deleteLineup(id), /Redirect/);
      assert.ok(
        (await changes.getRecentChanges()).some(
          (change) => change.targetId === id && change.event === "deleted",
        ),
      );
      for (const other of [null, "another-admin"]) {
        adminId = other;
        device = { id: 321, fullAccess: true, lineupIds: [] };
        assert.equal(
          (await changes.getRecentChanges()).some(
            (change) => change.kind === "lineup" && change.targetId === id,
          ),
          false,
        );
      }
    } finally {
      if (savedIds.length) {
        await db
          .delete(schema.contentChanges)
          .where(
            and(
              eq(schema.contentChanges.kind, "lineup"),
              inArray(schema.contentChanges.targetId, savedIds),
            ),
          );
        await db
          .delete(schema.contentFollows)
          .where(
            and(
              eq(schema.contentFollows.kind, "lineup"),
              inArray(schema.contentFollows.targetId, savedIds),
            ),
          );
        await db
          .delete(schema.lineups)
          .where(inArray(schema.lineups.id, savedIds));
      }
      for (const fixture of fixtures.reverse()) {
        await db
          .delete(fixture.table)
          .where(inArray(fixture.table.id, fixture.ids));
      }
      await client.end();
    }
  },
);
