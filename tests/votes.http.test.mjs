import assert from "node:assert/strict";
import test from "node:test";
import { createHash, randomBytes } from "node:crypto";
import postgres from "postgres";

const origin = process.env.VOTES_TEST_ORIGIN;
const testUrl = process.env.VOTES_TEST_DATABASE_URL;
test(
  "the built app serves vote controls and permits scoped voting through Proxy",
  { skip: !origin || !testUrl },
  async () => {
    assert.equal(origin, "http://127.0.0.1:4403");
    assert.equal(testUrl, "postgres://vote_test@127.0.0.1:55443/votes_test");
    const sql = postgres(testUrl, { prepare: false });
    const token = randomBytes(32).toString("base64url");
    const hash = (value) => createHash("sha256").update(value).digest("hex");
    const fixtures = {};
    try {
      [fixtures.lineup] =
        await sql`insert into lineups (name) values ('HTTP vote lineup') returning id`;
      [fixtures.privateLineup] =
        await sql`insert into lineups (name) values ('HTTP private lineup') returning id`;
      [fixtures.hero] =
        await sql`insert into heroes (slug,name,role,rarity) values ('http-vote-test','HTTP hero','warrior','mythic') returning id`;
      [fixtures.build] =
        await sql`insert into hero_builds (hero_id,name) values (${fixtures.hero.id},'HTTP build') returning id`;
      await sql`insert into lineup_heroes (lineup_id,hero_id,build_id,position) values (${fixtures.lineup.id},${fixtures.hero.id},${fixtures.build.id},0)`;
      [fixtures.invitation] =
        await sql`insert into invitation_codes (code_hash,lineup_id,used_at) values (${hash(token + "invitation")},${fixtures.lineup.id},now()) returning id`;
      [fixtures.device] =
        await sql`insert into registered_devices (token_hash,invitation_id) values (${hash(token)},${fixtures.invitation.id}) returning id`;
      await sql`insert into invitation_redemptions (device_id,invitation_id) values (${fixtures.device.id},${fixtures.invitation.id})`;
      const page = `/lineups/${fixtures.lineup.id}`;
      const cookie = `mh_device=${token}`;
      const target = { kind: "lineup", id: fixtures.lineup.id, page };
      const get = (target, headers = {}) =>
        fetch(`${origin}/api/votes?${new URLSearchParams(target)}`, {
          headers,
        });
      const post = (target, value, headers = {}) =>
        fetch(`${origin}/api/votes`, {
          method: "POST",
          headers: {
            origin,
            "content-type": "application/json",
            cookie,
            ...headers,
          },
          body: JSON.stringify({ ...target, value }),
        });
      assert.equal((await get(target)).status, 404);
      const html = await fetch(`${origin}${page}`, { headers: { cookie } });
      assert.equal(html.status, 200);
      assert.match(await html.text(), /Like HTTP vote lineup/);
      const liked = await post(target, 1);
      assert.equal(liked.status, 200);
      assert.deepEqual(await liked.json(), {
        likes: 1,
        dislikes: 0,
        vote: 1,
        canVote: true,
      });
      assert.equal((await (await get(target, { cookie })).json()).vote, 1);
      assert.equal((await (await post(target, -1)).json()).vote, -1);
      assert.equal((await (await post(target, 0)).json()).vote, 0);
      const build = { ...target, kind: "build", id: fixtures.build.id };
      assert.equal((await post(build, 1)).status, 200);
      assert.equal(
        (await post({ ...target, id: fixtures.privateLineup.id }, 1)).status,
        404,
      );
      assert.equal(
        (await post(target, 1, { origin: "https://evil.test" })).status,
        403,
      );
      assert.equal((await post(target, 1, { cookie: "" })).status, 404);
      await sql`insert into public_urls (path) values (${page})`;
      const publicRead = await get(target);
      assert.equal(publicRead.status, 200);
      assert.match(
        publicRead.headers.get("cache-control"),
        /private, no-store/,
      );
      assert.equal((await publicRead.json()).canVote, false);
      assert.equal((await post(target, 1, { cookie: "" })).status, 401);
    } finally {
      if (fixtures.lineup)
        await sql`delete from public_urls where path = ${`/lineups/${fixtures.lineup.id}`}`;
      if (fixtures.device)
        await sql`delete from registered_devices where id = ${fixtures.device.id}`;
      if (fixtures.lineup)
        await sql`delete from lineups where id = ${fixtures.lineup.id}`;
      if (fixtures.privateLineup)
        await sql`delete from lineups where id = ${fixtures.privateLineup.id}`;
      if (fixtures.hero)
        await sql`delete from heroes where id = ${fixtures.hero.id}`;
      await sql.end();
    }
  },
);
