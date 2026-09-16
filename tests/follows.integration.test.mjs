import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

const testUrl = process.env.FOLLOWS_TEST_DATABASE_URL;
test(
  "follows persist per viewer, filter changes, and never grant content access",
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
    let adminId = null;
    let device = null;
    const overrides = {
      "@/db": { db, schema },
      "@/lib/admin-access": { getAdminId: async () => adminId },
      "@/lib/app-access": {
        getRegisteredDevice: async () => device,
        hasAppAccess: async () => Boolean(adminId || device?.fullAccess),
      },
    };
    const follows = loadTypeScript("src/lib/follows.ts", overrides);
    const { getRecentChanges } = loadTypeScript("src/lib/changes.ts", {
      ...overrides,
      "@/lib/follows": follows,
    });
    const { GET, POST } = loadTypeScript("src/app/api/follows/route.ts", {
      "@/lib/follows": follows,
    });
    const origin = "https://miniheroes-library.vercel.app";
    const get = (target) =>
      GET(new Request(`${origin}/api/follows?${new URLSearchParams(target)}`));
    const post = (target, following, extra = {}, requestOrigin = origin) =>
      POST(
        new Request(`${origin}/api/follows`, {
          method: "POST",
          headers: {
            origin: requestOrigin,
            "content-type": "application/json",
          },
          body: JSON.stringify({ ...target, following, ...extra }),
        }),
      );
    const fixtures = [];
    const prefix = `follow-test-${Date.now()}`;
    const key = `device:${Date.now()}`;
    async function insert(table, values) {
      const rows = await db.insert(table).values(values).returning();
      fixtures.push({ table, ids: rows.map((row) => row.id) });
      return rows;
    }
    try {
      const [hero, otherHero] = await insert(
        schema.heroes,
        [0, 1].map((i) => ({
          slug: `${prefix}-${i}`,
          name: `Hero ${i}`,
          role: "warrior",
          rarity: "mythic",
        })),
      );
      const [lineup, privateLineup] = await insert(schema.lineups, [
        { name: "Followed lineup" },
        { name: "Private lineup" },
      ]);
      const [build, otherBuild] = await insert(schema.heroBuilds, [
        { heroId: hero.id, name: "Followed hero build" },
        { heroId: otherHero.id, name: "Other hero build" },
      ]);
      await insert(schema.contentChanges, [
        {
          kind: "lineup",
          targetId: lineup.id,
          name: lineup.name,
          event: "updated",
          fields: [],
        },
        {
          kind: "lineup",
          targetId: privateLineup.id,
          name: privateLineup.name,
          event: "updated",
          fields: [],
        },
        {
          kind: "build",
          targetId: build.id,
          name: build.name,
          heroSlug: hero.slug,
          event: "updated",
          fields: [],
        },
        {
          kind: "build",
          targetId: otherBuild.id,
          name: otherBuild.name,
          heroSlug: otherHero.slug,
          event: "updated",
          fields: [],
        },
      ]);
      const target = { kind: "lineup", id: lineup.id };
      const heroTarget = { kind: "hero", id: hero.id };
      assert.equal((await get(target)).status, 404);
      assert.equal((await post(target, true)).status, 401);
      assert.equal(
        (await post(target, true, {}, "https://other.example")).status,
        403,
      );
      assert.equal(
        (await post({ kind: "build", id: build.id }, true)).status,
        400,
      );
      assert.equal((await get({ kind: "hero", id: -1 })).status, 400);
      await insert(schema.publicUrls, { path: `/heroes/${hero.slug}` });
      assert.deepEqual(await (await get(heroTarget)).json(), {
        following: false,
        canFollow: false,
      });
      assert.equal((await post(heroTarget, true)).status, 401);

      device = {
        id: Number(key.split(":")[1]),
        fullAccess: false,
        lineupIds: [lineup.id],
      };
      assert.deepEqual(await (await get(target)).json(), {
        following: false,
        canFollow: true,
      });
      const results = await Promise.all([
        post(target, true),
        post(target, true),
      ]);
      assert.ok(results.every((response) => response.status === 200));
      assert.equal(
        (
          await db
            .select()
            .from(schema.contentFollows)
            .where(eq(schema.contentFollows.followerKey, key))
        ).length,
        1,
      );
      assert.equal(
        (await post({ kind: "lineup", id: privateLineup.id }, true)).status,
        404,
      );
      assert.equal(
        (await post(heroTarget, true, { followerKey: "admin:forged" })).status,
        200,
      );
      assert.deepEqual(
        new Set(
          (await getRecentChanges(true)).map(
            (entry) => `${entry.kind}:${entry.targetId}`,
          ),
        ),
        new Set([`lineup:${lineup.id}`, `build:${build.id}`]),
      );
      const followed = await follows.getFollowedItems();
      assert.equal(followed.length, 2);
      assert.ok(followed.every((item) => item.available && item.href));
      assert.equal(
        (await get(target)).headers.get("cache-control"),
        "private, no-store",
      );

      adminId = prefix;
      assert.deepEqual(await (await get(target)).json(), {
        following: false,
        canFollow: true,
      });
      assert.equal((await post(target, true)).status, 200);
      assert.equal(
        (await follows.getFollowedItems()).length,
        1,
        "admin follows are separate from device follows",
      );
      adminId = null;
      assert.equal((await follows.getFollowedItems()).length, 2);
      await db
        .delete(schema.publicUrls)
        .where(eq(schema.publicUrls.path, `/heroes/${hero.slug}`));
      assert.deepEqual(await (await get(heroTarget)).json(), {
        following: true,
        canFollow: false,
      });
      assert.ok(
        !(await getRecentChanges(true)).some(
          (entry) => entry.kind === "build" && entry.targetId === build.id,
        ),
      );
      const unavailable = (await follows.getFollowedItems()).find(
        (item) => item.kind === "hero",
      );
      assert.equal(unavailable.name, "Unavailable hero");
      assert.equal(unavailable.href, null);
      assert.equal(
        (await post(heroTarget, false)).status,
        200,
        "unfollow works after access revocation",
      );
      assert.equal(
        (await post(heroTarget, false)).status,
        200,
        "repeated unfollow is safe",
      );

      await db.delete(schema.lineups).where(eq(schema.lineups.id, lineup.id));
      await insert(schema.contentChanges, {
        kind: "lineup",
        targetId: lineup.id,
        name: lineup.name,
        event: "deleted",
        fields: [],
      });
      assert.deepEqual(await (await get(target)).json(), {
        following: true,
        canFollow: false,
      });
      assert.deepEqual(await getRecentChanges(true), []);
      device.fullAccess = true;
      assert.ok(
        (await getRecentChanges(true)).some(
          (entry) => entry.event === "deleted" && entry.targetId === lineup.id,
        ),
      );
      assert.equal((await post(target, false)).status, 200);
      assert.deepEqual(await getRecentChanges(true), []);
    } finally {
      await db
        .delete(schema.contentFollows)
        .where(
          inArray(schema.contentFollows.followerKey, [key, `admin:${prefix}`]),
        );
      for (const { table, ids } of fixtures.reverse())
        await db.delete(table).where(inArray(table.id, ids));
      await client.end();
    }
  },
);
