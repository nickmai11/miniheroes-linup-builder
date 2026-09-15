import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server.js";
import { loadTypeScript } from "./load-typescript.mjs";

// Explicitly opt in to a migrated disposable database, never DATABASE_URL.
const testUrl = process.env.VOTES_TEST_DATABASE_URL;
test(
  "votes persist, switch, clear, resist duplicate requests, and enforce target access",
  { skip: !testUrl },
  async () => {
    const url = new URL(testUrl);
    assert.equal(url.hostname, "127.0.0.1");
    assert.equal(url.port, "55443");
    assert.equal(url.username, "vote_test");
    assert.equal(url.pathname, "/votes_test");
    const client = postgres(testUrl, { prepare: false, max: 8 });
    const schema = loadTypeScript("src/db/schema.ts");
    const db = drizzle(client, { schema });
    let adminId = null;
    let device = null;
    const publicPages = new Set();
    const votes = loadTypeScript("src/lib/votes.ts", {
      "@/db": { db, schema },
      "@/lib/admin-access": { getAdminId: async () => adminId },
      "@/lib/app-access": { getRegisteredDevice: async () => device },
      "@/lib/public-urls": {
        isPublicPage: async (page) => publicPages.has(page),
      },
    });
    const route = loadTypeScript("src/app/api/votes/route.ts", {
      "next/server": { NextResponse },
      "@/lib/votes": votes,
    });
    const origin = "https://miniheroes-library.vercel.app";
    const get = (target) =>
      route.GET(
        new Request(`${origin}/api/votes?${new URLSearchParams(target)}`),
      );
    const post = (target, value, extra = {}) =>
      route.POST(
        new Request(`${origin}/api/votes`, {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: JSON.stringify({ ...target, value, ...extra }),
        }),
      );
    const heroes = [];
    const lineups = [];
    try {
      heroes.push(
        ...(await db
          .insert(schema.heroes)
          .values([
            {
              slug: "vote-test-a",
              name: "Vote A",
              role: "warrior",
              rarity: "mythic",
            },
            {
              slug: "vote-test-b",
              name: "Vote B",
              role: "mage",
              rarity: "mythic",
            },
          ])
          .returning()),
      );
      lineups.push(
        ...(await db
          .insert(schema.lineups)
          .values([{ name: "Vote lineup" }, { name: "Private lineup" }])
          .returning()),
      );
      const builds = await db
        .insert(schema.heroBuilds)
        .values(heroes.map((hero) => ({ heroId: hero.id, name: "Vote build" })))
        .returning();
      await db
        .insert(schema.lineupHeroes)
        .values({
          lineupId: lineups[0].id,
          heroId: heroes[0].id,
          buildId: builds[0].id,
          position: 0,
        });
      const lineup = {
        kind: "lineup",
        id: lineups[0].id,
        page: `/lineups/${lineups[0].id}`,
      };
      const build = { kind: "build", id: builds[0].id, page: lineup.page };
      const hiddenLineup = { ...lineup, id: lineups[1].id };
      const hiddenBuild = { ...build, id: builds[1].id };
      assert.equal((await get(lineup)).status, 404);
      assert.equal((await post(lineup, 1)).status, 404);
      publicPages.add(lineup.page);
      assert.deepEqual(await (await get(lineup)).json(), {
        likes: 0,
        dislikes: 0,
        vote: 0,
        canVote: false,
      });
      assert.equal((await post(lineup, 1, { voterKey: "forged" })).status, 401);
      assert.equal((await get(build)).status, 200);
      assert.equal((await get(hiddenLineup)).status, 404);
      assert.equal((await get(hiddenBuild)).status, 404);
      publicPages.clear();
      device = { id: 10, fullAccess: false, lineupIds: [lineup.id] };
      for (const target of [lineup, build]) {
        assert.deepEqual(await (await post(target, 1)).json(), {
          likes: 1,
          dislikes: 0,
          vote: 1,
          canVote: true,
        });
        await Promise.all(Array.from({ length: 12 }, () => post(target, 1)));
        assert.deepEqual(await (await get(target)).json(), {
          likes: 1,
          dislikes: 0,
          vote: 1,
          canVote: true,
        });
        assert.deepEqual(await (await post(target, -1)).json(), {
          likes: 0,
          dislikes: 1,
          vote: -1,
          canVote: true,
        });
        device = { ...device, id: 11 };
        assert.deepEqual(await (await post(target, 1)).json(), {
          likes: 1,
          dislikes: 1,
          vote: 1,
          canVote: true,
        });
        assert.deepEqual(await (await post(target, 0)).json(), {
          likes: 0,
          dislikes: 1,
          vote: 0,
          canVote: true,
        });
        device = { ...device, id: 10 };
        assert.deepEqual(await (await get(target)).json(), {
          likes: 0,
          dislikes: 1,
          vote: -1,
          canVote: true,
        });
        await post(target, 0);
        await post(target, 0);
        assert.equal((await (await get(target)).json()).dislikes, 0);
      }
      assert.equal((await post(hiddenLineup, 1)).status, 404);
      assert.equal((await post(hiddenBuild, 1)).status, 404);
      device = { ...device, fullAccess: true };
      assert.equal((await post(hiddenBuild, -1)).status, 200);
      adminId = "admin-a";
      assert.equal((await post(hiddenBuild, 1)).status, 200);
      adminId = "admin-b";
      assert.deepEqual(await (await post(hiddenBuild, 1)).json(), {
        likes: 2,
        dislikes: 1,
        vote: 1,
        canVote: true,
      });
      assert.equal((await post(lineup, 2)).status, 400);
      assert.equal((await post({ ...lineup, id: "1" }, 1)).status, 400);
      assert.equal((await get({ ...lineup, id: 2147483647 })).status, 404);
      assert.equal((await get({ ...lineup, id: 2147483648 })).status, 400);
      adminId = null;
      device = null;
      publicPages.add(`/heroes/${heroes[0].slug}`);
      assert.equal(
        (await get({ ...build, page: `/heroes/${heroes[0].slug}` })).status,
        200,
      );
      assert.equal(
        (await get({ ...lineup, page: `/heroes/${heroes[0].slug}` })).status,
        200,
      );
      assert.equal(
        (await get({ ...hiddenBuild, page: `/heroes/${heroes[0].slug}` }))
          .status,
        404,
      );
      publicPages.clear();
      publicPages.add("/lineups");
      assert.equal((await get({ ...build, page: "/lineups" })).status, 200);
      assert.equal(
        (await get({ ...hiddenBuild, page: "/lineups" })).status,
        404,
      );
      assert.equal(
        (await get({ ...hiddenLineup, page: "/lineups" })).status,
        200,
      );
      assert.match(
        (await get(lineup)).headers.get("cache-control"),
        /private, no-store/,
      );

      for (const fields of [
        { lineupId: lineup.id, value: 0 },
        { lineupId: lineup.id, buildId: build.id, value: 1 },
        { value: 1 },
      ])
        await assert.rejects(
          db
            .insert(schema.contentVotes)
            .values({ ...fields, voterKey: "invalid" }),
          (error) => error.cause?.code === "23514",
        );
      await client.begin(async (tx) => {
        await tx.unsafe("SET LOCAL ROLE lineup_app");
        await tx`insert into content_votes (lineup_id, voter_key, value) values (${lineup.id}, 'permissions-test', 1)`;
        assert.equal(
          (
            await tx`select * from content_votes where voter_key = 'permissions-test'`
          ).length,
          1,
        );
        await tx`delete from content_votes where voter_key = 'permissions-test'`;
      });
      const [rls] =
        await client`select relrowsecurity from pg_class where relname = 'content_votes'`;
      assert.equal(rls.relrowsecurity, true);
      await votes.setVote(lineup, "cascade-test", 1);
      await votes.setVote(build, "cascade-test", 1);
      await db.delete(schema.lineups).where(eq(schema.lineups.id, lineup.id));
      assert.equal(
        (
          await db
            .select()
            .from(schema.contentVotes)
            .where(eq(schema.contentVotes.lineupId, lineup.id))
        ).length,
        0,
      );
      assert.equal((await votes.getVoteSummary(build, null)).likes, 1);
      await db
        .delete(schema.heroBuilds)
        .where(eq(schema.heroBuilds.id, build.id));
      assert.equal(
        (
          await db
            .select()
            .from(schema.contentVotes)
            .where(eq(schema.contentVotes.buildId, build.id))
        ).length,
        0,
      );
    } finally {
      for (const lineup of lineups)
        await db.delete(schema.lineups).where(eq(schema.lineups.id, lineup.id));
      for (const hero of heroes)
        await db.delete(schema.heroes).where(eq(schema.heroes.id, hero.id));
      await client.end();
    }
  },
);
