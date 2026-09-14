import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

// Run against a separate app and disposable database, never the live app.
const base = process.env.INVITATION_TEST_BASE_URL;
const databaseUrl = process.env.INVITATION_TEST_DATABASE_URL;

test(
  "shared lineup ICs accumulate through HTTP while pages, RSC, and artwork enforce scope",
  {
    skip: !base || !databaseUrl,
  },
  async () => {
    assert.equal(base, "http://127.0.0.1:3111");
    const target = new URL(databaseUrl);
    assert.equal(target.hostname, "127.0.0.1");
    assert.equal(target.port, "55441");
    assert.equal(target.username, "invitation_test");
    assert.equal(target.pathname, "/invitation_access_test");
    const sql = postgres(databaseUrl, { prepare: false, max: 1 });
    const schema = loadTypeScript("src/db/schema.ts");
    const db = drizzle(sql, { schema });
    const overrides = { "@/db": { db, schema } };
    const invitations = loadTypeScript("src/lib/invitations.ts", overrides);
    const { syncSeededHeroDetails } = loadTypeScript(
      "src/lib/heroes.ts",
      overrides,
    );
    let cookie = "";
    const tokens = [];
    const codes = [];
    let lineups = [];
    let build;
    async function request(path, options = {}) {
      const response = await fetch(base + path, {
        redirect: "manual",
        signal: AbortSignal.timeout(60000),
        ...options,
        headers: { cookie, ...options.headers },
      });
      const deviceCookie = response.headers
        .getSetCookie()
        .find((value) => value.startsWith("mh_device="));
      if (deviceCookie) {
        cookie = deviceCookie.split(";")[0];
        tokens.push(cookie.slice("mh_device=".length));
      }
      return response;
    }
    async function redeem(code, next) {
      return request("/api/invitations/redeem", {
        method: "POST",
        headers: { origin: base, "content-type": "application/json" },
        body: JSON.stringify({ code, next }),
      });
    }
    try {
      await syncSeededHeroDetails();
      const [hero] = await db
        .select()
        .from(schema.heroes)
        .where(eq(schema.heroes.slug, "sea-captain"));
      lineups = await db
        .insert(schema.lineups)
        .values([
          { name: "HTTP Invited Alpha" },
          { name: "HTTP Invited Beta" },
          { name: "HTTP Hidden Gamma" },
        ])
        .returning();
      [build] = await db
        .insert(schema.heroBuilds)
        .values({ heroId: hero.id, name: "HTTP Assigned Build" })
        .returning();
      await db.insert(schema.lineupHeroes).values({
        lineupId: lineups[0].id,
        heroId: hero.id,
        position: 0,
        buildId: build.id,
      });
      for (const lineup of lineups)
        codes.push(await invitations.generateInvitationCode(lineup.id));
      const paths = lineups.map((lineup) => `/lineups/${lineup.id}`);

      for (let i = 0; i < 2; i++) {
        const shared = await request(`${paths[i]}?ic=${codes[i]}&mode=arena`);
        assert.equal(shared.status, 307);
        const gate = new URL(shared.headers.get("location"), base);
        assert.equal(gate.pathname, "/invite");
        assert.equal(gate.searchParams.get("ic"), codes[i]);
        const form = await request(gate.pathname + gate.search);
        assert.equal(form.status, 200);
        const formHtml = await form.text();
        assert.ok(formHtml.includes("Invitation access"));
        assert.ok(
          formHtml
            .match(/<input[^>]*name="code"[^>]*>/)?.[0]
            .includes(`value="${codes[i]}"`),
          "The linked code remains available for retry if automatic redemption fails",
        );
        assert.ok(cookie);
        const deviceBefore = await invitations.findRegisteredDevice(
          tokens.at(-1),
        );
        assert.equal(
          deviceBefore?.lineupIds.includes(lineups[i].id) ?? false,
          false,
          "GET never redeems an IC",
        );
        const response = await redeem(codes[i], `${paths[i]}?mode=arena`);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
          destination: `${paths[i]}?mode=arena`,
        });
        const listing = await request("/lineups");
        assert.equal(listing.status, 200);
        const html = await listing.text();
        for (let j = 0; j < lineups.length; j++) {
          assert.equal(
            html.includes(lineups[j].name),
            j <= i,
            "Collection contains only redeemed lineups",
          );
        }
      }
      const detail = await request(paths[0]);
      assert.equal(detail.status, 200);
      assert.equal(detail.headers.get("referrer-policy"), "same-origin");
      const html = await detail.text();
      assert.ok(html.includes("HTTP Assigned Build"));
      assert.ok(!html.includes("Edit lineup"));
      for (const asset of ["/heroes/sea-captain.png", "/badges/warrior.png"]) {
        const image = await request(asset, {
          headers: { referer: base + paths[0] },
        });
        assert.equal(image.status, 200, asset);
        await image.arrayBuffer();
      }
      assert.equal(
        (
          await request("/heroes/nezha.png", {
            headers: { referer: base + paths[0] },
          })
        ).status,
        401,
      );
      for (const path of [
        paths[2],
        "/heroes",
        "/heroes/sea-captain",
        `${paths[0]}/edit`,
      ]) {
        const denied = await request(path);
        assert.equal(denied.status, 307, path);
        assert.equal(
          new URL(denied.headers.get("location"), base).pathname,
          "/invite",
        );
      }
      for (const path of ["/lineups", paths[0], paths[1]]) {
        let rsc = await request(path, { headers: { RSC: "1" } });
        if (rsc.status === 307) {
          const canonical = new URL(rsc.headers.get("location"), base);
          assert.equal(
            canonical.pathname,
            path,
            "RSC canonicalization stays on the authorized page",
          );
          rsc = await request(canonical.pathname + canonical.search, {
            headers: { RSC: "1" },
          });
        }
        assert.equal(rsc.status, 200, path);
        assert.match(rsc.headers.get("content-type"), /text\/x-component/);
        assert.ok(!(await rsc.text()).includes(lineups[2].name));
      }
      assert.equal(
        (await request(paths[2], { headers: { RSC: "1" } })).status,
        307,
      );
      assert.equal(
        (
          await request(paths[0], {
            method: "POST",
            headers: { "next-action": "test" },
          })
        ).status,
        401,
      );
      assert.equal(
        (await request("/api/invitations/generate", { method: "POST" })).status,
        404,
      );
      assert.equal(
        (await redeem(codes[1], paths[1])).status,
        200,
        "Same-device retry works",
      );
      assert.equal((await redeem("invalid", paths[0])).status, 400);
      assert.equal(
        (await request(paths[0])).status,
        200,
        "An invalid code preserves previous grants",
      );
      cookie = "";
      await request("/invite");
      assert.equal(
        (await redeem(codes[0], paths[0])).status,
        400,
        "Another device cannot reuse the code",
      );
    } finally {
      if (tokens.length)
        await db
          .delete(schema.registeredDevices)
          .where(
            inArray(
              schema.registeredDevices.tokenHash,
              tokens.map(invitations.hashInvitationSecret),
            ),
          );
      if (lineups.length)
        await db.delete(schema.lineups).where(
          inArray(
            schema.lineups.id,
            lineups.map((lineup) => lineup.id),
          ),
        );
      if (build)
        await db
          .delete(schema.heroBuilds)
          .where(eq(schema.heroBuilds.id, build.id));
      await sql.end();
    }
  },
);
