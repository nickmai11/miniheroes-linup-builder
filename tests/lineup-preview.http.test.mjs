import assert from "node:assert/strict";
import test from "node:test";
import { createHash, randomBytes } from "node:crypto";
import postgres from "postgres";

const origin = process.env.LINEUP_PREVIEW_TEST_ORIGIN;
const testUrl = process.env.LINEUP_PREVIEW_TEST_DATABASE_URL;
test(
  "preview data and artwork follow public and scoped lineup access through the built app",
  { skip: !origin || !testUrl },
  async () => {
    assert.equal(origin, "http://127.0.0.1:4403");
    assert.equal(testUrl, "postgres://vote_test@127.0.0.1:55443/votes_test");
    const sql = postgres(testUrl, { prepare: false });
    const fixtures = {};
    const createdHeroes = [];
    const token = randomBytes(32).toString("base64url");
    const hash = (value) => createHash("sha256").update(value).digest("hex");
    try {
      const heroes = [];
      for (const slug of ["sea-captain", "nezha"]) {
        let [hero] = await sql`select id from heroes where slug = ${slug}`;
        if (!hero) {
          [hero] =
            await sql`insert into heroes (slug,name,role,rarity,image_url) values (${slug},${slug},'warrior','mythic',${`/heroes/${slug}.png`}) returning id`;
          createdHeroes.push(hero.id);
        }
        heroes.push(hero);
      }
      [fixtures.lineup] =
        await sql`insert into lineups (name,description) values ('Preview fixture','Protected preview notes') returning id`;
      [fixtures.other] =
        await sql`insert into lineups (name) values ('Unrelated private lineup') returning id`;
      [fixtures.build] =
        await sql`insert into hero_builds (hero_id,name) values (${heroes[1].id},'Preview build') returning id`;
      await sql`insert into lineup_heroes (lineup_id,hero_id,position) values (${fixtures.lineup.id},${heroes[0].id},0)`;
      await sql`insert into lineup_heroes (lineup_id,hero_id,position,build_id) values (${fixtures.lineup.id},${heroes[1].id},1,${fixtures.build.id})`;
      const heroPage = "/heroes/sea-captain";
      const lineupPage = `/lineups/${fixtures.lineup.id}`;
      const preview = (cookie = "", id = fixtures.lineup.id) =>
        fetch(`${origin}/api/lineups/preview?id=${id}&hero=sea-captain`, {
          headers: { cookie },
        });
      const image = (cookie = "") =>
        fetch(`${origin}/heroes/nezha.png?v=5`, {
          headers: { referer: `${origin}${heroPage}`, cookie },
        });
      assert.equal((await preview()).status, 403);
      await sql`insert into public_urls (path) values (${heroPage})`;
      assert.equal((await preview()).status, 403);
      assert.equal((await image()).status, 401);
      await sql`insert into public_urls (path) values (${lineupPage})`;
      let response = await preview();
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      let data = await response.json();
      assert.equal(data.description, "Protected preview notes");
      assert.equal(data.slots.length, 5);
      assert.equal(data.slots[1].build.id, fixtures.build.id);
      assert.equal(data.contextPage, lineupPage);
      assert.equal((await image()).status, 200);
      assert.equal((await preview("", fixtures.other.id)).status, 403);
      const vote = (page) =>
        fetch(
          `${origin}/api/votes?${new URLSearchParams({ kind: "build", id: String(fixtures.build.id), page })}`,
        );
      assert.equal((await vote(data.contextPage)).status, 200);
      await sql`delete from public_urls where path = ${lineupPage}`;
      assert.equal((await preview()).status, 403);
      assert.equal((await image()).status, 401);

      [fixtures.invitation] =
        await sql`insert into invitation_codes (code_hash,lineup_id,used_at) values (${hash(token + "invitation")},${fixtures.lineup.id},now()) returning id`;
      [fixtures.device] =
        await sql`insert into registered_devices (token_hash,invitation_id) values (${hash(token)},${fixtures.invitation.id}) returning id`;
      await sql`insert into invitation_redemptions (device_id,invitation_id) values (${fixtures.device.id},${fixtures.invitation.id})`;
      const cookie = `mh_device=${token}`;
      assert.equal((await preview(cookie)).status, 200);
      assert.equal((await image(cookie)).status, 200);
      assert.equal((await preview(cookie, fixtures.other.id)).status, 403);
      await sql`insert into public_urls (path) values ('/lineups')`;
      data = await (await preview()).json();
      assert.equal(data.contextPage, "/lineups");
      assert.equal((await vote(data.contextPage)).status, 200);
      assert.equal((await preview("", fixtures.other.id)).status, 403);
      const heroHtml = await fetch(`${origin}${heroPage}`);
      assert.equal(heroHtml.status, 200);
      const html = await heroHtml.text();
      assert.match(html, /Preview Preview fixture lineup/);
      assert.equal(
        html.includes("Protected preview notes"),
        false,
        "Unopened previews must not serialize lineup notes in the hero page payload",
      );
    } finally {
      await sql`delete from public_urls where path in ('/heroes/sea-captain','/lineups')`;
      if (fixtures.lineup)
        await sql`delete from public_urls where path = ${`/lineups/${fixtures.lineup.id}`}`;
      if (fixtures.device)
        await sql`delete from registered_devices where id = ${fixtures.device.id}`;
      if (fixtures.lineup)
        await sql`delete from lineups where id = ${fixtures.lineup.id}`;
      if (fixtures.other)
        await sql`delete from lineups where id = ${fixtures.other.id}`;
      if (fixtures.build)
        await sql`delete from hero_builds where id = ${fixtures.build.id}`;
      for (const id of createdHeroes)
        await sql`delete from heroes where id = ${id}`;
      await sql.end();
    }
  },
);
