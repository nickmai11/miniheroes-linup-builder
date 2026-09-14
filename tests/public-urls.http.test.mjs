import assert from "node:assert/strict";
import test from "node:test";

// Opt-in: run a separate app on port 3111 with a disposable seeded database.
// Set PUBLIC_URL_TEST_ADMIN_COOKIE to its signed-in admin's Cookie header.
// The test adds and removes a public rule in that database.
const testBase = process.env.PUBLIC_URL_TEST_BASE_URL;

test(
  "public URL settings, navigation, artwork and revocation work in the isolated app",
  { skip: !testBase },
  async () => {
    const base = testBase;
    assert.equal(
      base,
      "http://127.0.0.1:3111",
      "Run only against the isolated test app",
    );
    const adminCookie = process.env.PUBLIC_URL_TEST_ADMIN_COOKIE;
    assert.ok(
      adminCookie,
      "Provide an admin session for the isolated test app",
    );
    const adminHeaders = { cookie: adminCookie };
    async function get(path, extra = {}) {
      return fetch(base + path, {
        redirect: "manual",
        signal: AbortSignal.timeout(25000),
        ...extra,
      });
    }
    async function update(url, method = "POST") {
      const response = await get("/api/public-urls", {
        method,
        headers: {
          ...adminHeaders,
          origin: base,
          "content-type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const result = await response.json();
      assert.equal(
        response.status,
        method === "POST" ? 201 : 200,
        JSON.stringify(result),
      );
      return result;
    }
    const page = "/heroes/sea-captain";
    try {
      assert.equal((await get("/public-urls")).status, 404);
      assert.equal(
        (await get("/api/public-urls", { method: "POST" })).status,
        404,
      );
      const manager = await get("/public-urls", { headers: adminHeaders });
      const managerHtml = await manager.text();
      assert.equal(manager.status, 200);
      assert.ok(
        managerHtml.includes("Add public URL") &&
          managerHtml.includes("No public URLs yet"),
        "Manager form and empty state",
      );
      assert.equal((await get(page)).status, 307);
      await update(page);
      const publicPage = await get(page);
      const html = await publicPage.text();
      assert.equal(publicPage.status, 200);
      assert.ok(
        html.includes("Siren Blade"),
        "Public page renders its content",
      );
      assert.equal(publicPage.headers.get("referrer-policy"), "same-origin");
      assert.ok(
        !html.includes("Create build"),
        "Unregistered visitors do not see editing controls",
      );
      const sources = [
        ...new Set(
          [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) =>
            match[1].replaceAll("&amp;", "&"),
          ),
        ),
      ];
      assert.ok(sources.length >= 8, "Hero artwork rendered");
      for (const source of sources) {
        const image = await get(source, { headers: { referer: base + page } });
        assert.equal(image.status, 200, `Public artwork ${source}`);
        assert.ok(image.headers.get("content-type")?.startsWith("image/"));
        await image.arrayBuffer();
      }
      assert.equal(
        (await get("/heroes/nezha.png", { headers: { referer: base + page } }))
          .status,
        401,
      );
      assert.equal((await get("/heroes/nezha")).status, 307);
      assert.equal((await get("/api/notes")).status, 401);
      assert.equal(
        (
          await get(page, {
            method: "POST",
            headers: { "next-action": "test" },
          })
        ).status,
        401,
      );
      let rsc = await get(page + "?_rsc=public-test", {
        headers: { RSC: "1" },
      });
      if (rsc.status === 307) {
        const target = new URL(rsc.headers.get("location"), base);
        assert.equal(
          target.pathname,
          page,
          "RSC must not redirect to the invitation gate",
        );
        rsc = await get(target.pathname + target.search, {
          headers: { RSC: "1" },
        });
      }
      assert.equal(rsc.status, 200);
      assert.match(rsc.headers.get("content-type"), /text\/x-component/);
      assert.ok((await rsc.text()).includes("Siren Blade"));
      const managerAfter = await get("/public-urls", { headers: adminHeaders });
      assert.ok(
        (await managerAfter.text()).includes(
          "Remove public access to /heroes/sea-captain",
        ),
      );
      console.log(
        `PASS: admin manager, public page and RSC, ${sources.length} public artwork requests, private sibling/API/action denial.`,
      );
    } finally {
      await update(page, "DELETE");
      assert.equal((await get(page)).status, 307);
      assert.equal(
        (
          await get("/heroes/sea-captain.png", {
            headers: { referer: base + page },
          })
        ).status,
        401,
      );
      console.log(
        "PASS: removal restores invitation protection for the page and its images.",
      );
    }
  },
);
