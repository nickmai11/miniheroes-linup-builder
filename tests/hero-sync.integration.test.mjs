import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

// Opt-in only: migrate a disposable local DB first, then set this URL.
// Never use DATABASE_URL: ordinary test runs must not write to the app database.
const testUrl = process.env.HERO_SYNC_TEST_DATABASE_URL;

test(
  "hero synchronization skips unchanged data, handles races and retries, and preserves builds",
  {
    skip: !testUrl,
  },
  async () => {
    const target = new URL(testUrl);
    assert.equal(
      target.hostname,
      "127.0.0.1",
      "Use the isolated local test database",
    );
    assert.equal(target.port, "55439");
    assert.equal(target.username, "perf");
    const sql = postgres(testUrl, { prepare: false, max: 4 });
    const schema = loadTypeScript("src/db/schema.ts");
    let writes = 0;
    let queries = 0;
    let failFingerprint = false;
    const db = drizzle(sql, {
      schema,
      logger: {
        logQuery(query) {
          queries++;
          if (/^(insert|update|delete)/i.test(query)) writes++;
          if (failFingerprint && query.startsWith('update "heroes"')) {
            throw new Error("simulated sync failure");
          }
        },
      },
    });
    const { heroDetailSeeds } = loadTypeScript("src/data/hero-details.ts");
    const slug = `sync-test-${Date.now()}`;
    const seed = structuredClone(heroDetailSeeds["sea-captain"]);
    const loadHeroes = () =>
      loadTypeScript("src/lib/heroes.ts", {
        "server-only": {},
        "@/db": { db, schema },
        "@/data/hero-details": {
          heroDetailSeeds: { [slug]: structuredClone(seed) },
        },
      });
    let hero;
    try {
      [hero] = await db
        .insert(schema.heroes)
        .values({ slug, name: "Sync test", role: "warrior", rarity: "mythic" })
        .returning();
      const original = loadHeroes();
      assert.equal(await original.syncHeroDetail(hero), true);
      const first = await original.getHeroDetail(slug);
      assert.ok(first.detailSeedHash);
      const coreIds = first.cores.map((core) => core.id);
      const [build] = await db
        .insert(schema.heroBuilds)
        .values({ heroId: hero.id, name: "Keep selected cores" })
        .returning();
      await db
        .insert(schema.heroBuildCores)
        .values({ buildId: build.id, coreId: coreIds[0], position: 0 });

      writes = queries = 0;
      assert.equal(
        (await original.getHeroDetail(slug)).skills[0].description,
        seed.skills[0].description,
      );
      assert.equal(writes, 0, "An unchanged detail page must be read-only");
      assert.equal(queries, 6);

      seed.awakeningSkills = [
        {
          stage: "I",
          name: "Test awakening",
          description: "File-only content",
          sourceScreenshot: "test.png",
        },
      ];
      writes = 0;
      const awakened = await loadHeroes().getHeroDetail(slug);
      assert.equal(awakened.awakeningSkills[0].name, "Test awakening");
      assert.equal(awakened.detailSeedHash, first.detailSeedHash);
      assert.equal(
        writes,
        0,
        "Module reloads and awakening edits must not rewrite persisted details",
      );

      seed.skills[0].description = "Updated talent content";
      const changed = loadHeroes();
      const results = await Promise.all([
        changed.syncHeroDetail({ id: hero.id, slug }),
        changed.syncHeroDetail({ id: hero.id, slug }),
      ]);
      assert.deepEqual(
        results.sort(),
        [false, true],
        "Only one concurrent request should sync",
      );
      const refreshed = await changed.getHeroDetail(slug);
      assert.notEqual(refreshed.detailSeedHash, first.detailSeedHash);
      assert.equal(refreshed.skills[0].description, seed.skills[0].description);
      assert.deepEqual(
        refreshed.cores.map((core) => core.id),
        coreIds,
      );
      assert.equal(
        (
          await db
            .select()
            .from(schema.heroBuildCores)
            .where(eq(schema.heroBuildCores.buildId, build.id))
        )[0].coreId,
        coreIds[0],
      );

      seed.artifact.name = "Updated artifact";
      const concurrentPages = loadHeroes();
      const pages = await Promise.all([
        concurrentPages.getHeroDetail(slug),
        concurrentPages.getHeroDetail(slug),
      ]);
      assert.ok(
        pages.every((page) => page.artifactName === "Updated artifact"),
      );

      seed.skills[0].description = "Content after retry";
      const failing = loadHeroes();
      failFingerprint = true;
      await assert.rejects(failing.syncHeroDetail({ id: hero.id, slug }));
      failFingerprint = false;
      const [afterFailure] = await db
        .select()
        .from(schema.heroes)
        .where(eq(schema.heroes.id, hero.id));
      assert.equal(afterFailure.detailSeedHash, pages[0].detailSeedHash);
      const [skillAfterFailure] = await db
        .select()
        .from(schema.heroSkills)
        .where(eq(schema.heroSkills.id, refreshed.skills[0].id));
      assert.equal(skillAfterFailure.description, "Updated talent content");
      assert.equal(await failing.syncHeroDetail({ id: hero.id, slug }), true);
      assert.equal(
        (await failing.getHeroDetail(slug)).skills[0].description,
        "Content after retry",
      );
    } finally {
      failFingerprint = false;
      if (hero)
        await db.delete(schema.heroes).where(eq(schema.heroes.id, hero.id));
      await sql.end({ timeout: 1 });
    }
  },
);
