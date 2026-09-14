import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { loadTypeScript } from "./load-typescript.mjs";

const policy = loadTypeScript("src/lib/invitation-policy.ts");
const token = "a".repeat(43);
const device = { id: 1, fullAccess: false, lineupIds: [12, 34] };
const headers = { cookie: `mh_device=${token}` };
const request = (path, options = {}) =>
  new NextRequest(`http://localhost:3000${path}`, options);
const post = (path, body) =>
  request(path, {
    method: "POST",
    headers: {
      ...headers,
      origin: "http://localhost:3000",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

function routing(access = device, publicPages = []) {
  return loadTypeScript("src/proxy.ts", {
    "@/lib/invitations": {
      findRegisteredDevice: async () => access,
      newDeviceToken: () => token,
    },
    "@/lib/public-urls": {
      isPublicPage: async (path) => publicPages.includes(path),
    },
    "@/lib/public-url-assets": {
      isPublicPageAsset: async (page, asset, ids) => {
        assert.deepEqual(ids, device.lineupIds);
        return (
          ["/lineups", "/lineups/12"].includes(page) &&
          asset === "/heroes/sea-captain.png"
        );
      },
    },
  }).proxy;
}

test("scoped devices read only their invited lineup pages and collection, including RSC and HEAD", async () => {
  const proxy = routing();
  for (const path of ["/lineups", "/lineups/12", "/lineups/34?mode=arena"]) {
    for (const options of [{}, { method: "HEAD" }, { headers: { RSC: "1" } }]) {
      const response = await proxy(
        request(path, {
          ...options,
          headers: { ...headers, ...options.headers },
        }),
      );
      assert.equal(response.headers.get("x-middleware-next"), "1", path);
      assert.equal(response.headers.get("referrer-policy"), "same-origin");
      assert.match(response.headers.get("cache-control"), /private, no-store/);
    }
  }
  for (const path of [
    "/lineups/56",
    "/lineups/12/edit",
    "/lineups/new?clone=12",
    "/heroes",
    "/heroes/sea-captain",
    "/notes",
  ]) {
    const response = await proxy(
      request(path, {
        headers: { ...headers, "x-app-destination": "/lineups/12" },
      }),
    );
    assert.equal(response.status, 307, path);
    assert.equal(new URL(response.headers.get("location")).pathname, "/invite");
  }
  for (const path of [
    "/api/notes",
    "/api/health",
    "/api/builds/importable?heroId=1",
  ]) {
    assert.equal((await proxy(request(path, { headers }))).status, 401);
  }
  for (const method of ["POST", "DELETE"]) {
    assert.equal(
      (await proxy(request("/lineups/12", { method, headers }))).status,
      401,
    );
  }
  assert.equal(
    new URL((await proxy(request("/", { headers }))).headers.get("location"))
      .pathname,
    "/lineups",
  );
});

test("additional IC links reach redemption on registered browsers, even for public lineups", async () => {
  for (const access of [device, null]) {
    const proxy = routing(access, ["/lineups/56"]);
    const response = await proxy(
      request("/lineups/56?ic=NEW&mode=arena", { headers }),
    );
    const target = new URL(response.headers.get("location"));
    assert.equal(target.pathname, "/invite");
    assert.equal(target.searchParams.get("ic"), "NEW");
    assert.equal(target.searchParams.get("next"), "/lineups/56?mode=arena");
    assert.equal(
      (
        await proxy(request(target.pathname + target.search, { headers }))
      ).headers.get("x-middleware-next"),
      "1",
    );
  }
  const publicRead = await routing(device, ["/lineups/56"])(
    request("/lineups/56", { headers }),
  );
  assert.equal(publicRead.headers.get("x-middleware-next"), "1");
});

test("scoped artwork checks both the referring lineup and the device's filtered collection", async () => {
  const proxy = routing();
  for (const page of ["/lineups", "/lineups/12"]) {
    const response = await proxy(
      request("/heroes/sea-captain.png", {
        headers: { ...headers, referer: `http://localhost:3000${page}` },
      }),
    );
    assert.equal(response.headers.get("x-middleware-next"), "1");
  }
  for (const [asset, referer] of [
    ["/heroes/nezha.png", "http://localhost:3000/lineups"],
    ["/heroes/sea-captain.png", "http://localhost:3000/lineups/56"],
    ["/heroes/sea-captain.png", "https://evil.test/lineups/12"],
    ["/heroes/sea-captain.png", ""],
  ]) {
    assert.equal(
      (await proxy(request(asset, { headers: { ...headers, referer } })))
        .status,
      401,
    );
  }
});

test("page and API guards independently enforce scope and cannot use another page's public rule", async () => {
  let path = "/lineups/12";
  let method = "GET";
  let publicPage = false;
  const access = loadTypeScript("src/lib/app-access.ts", {
    react: { cache: (fn) => fn },
    "next/headers": {
      cookies: async () => ({ get: () => ({ value: token }) }),
      headers: async () =>
        new Headers({ "x-app-destination": path, "x-app-method": method }),
    },
    "next/navigation": {
      redirect: (target) => {
        throw Object.assign(new Error("redirect"), { target });
      },
    },
    "@/lib/invitations": { findRegisteredDevice: async () => device },
    "@/lib/admin-access": { isAdmin: async () => false },
    "@/lib/public-urls": { isPublicPage: async () => publicPage },
  });
  assert.equal(await access.hasAppAccess(), false);
  await access.requirePageAccess("/lineups/12");
  assert.deepEqual(await access.accessibleLineupIds(), [12, 34]);
  await assert.rejects(access.requireAppAccess(), /redirect/);
  await assert.rejects(access.requirePageAccess("/lineups/56"), /redirect/);
  publicPage = true;
  await assert.rejects(access.requirePageAccess("/lineups/56"), /redirect/);
  path = "/lineups/56";
  await access.requirePageAccess("/lineups/56");
  publicPage = false;
  path = "/lineups/12";
  method = "POST";
  await assert.rejects(access.requirePageAccess("/lineups/12"), /redirect/);
});

test("redemption destinations stay within the newly granted scope", async () => {
  for (const [access, next, expected] of [
    [device, "/lineups/34?mode=arena#build", "/lineups/34?mode=arena#build"],
    [device, "/lineups/56", "/lineups"],
    [device, "https://evil.test", "/lineups"],
    [{ ...device, lineupIds: [12] }, "/", "/lineups/12"],
    [{ ...device, fullAccess: true }, "/heroes", "/heroes"],
  ]) {
    const { POST } = loadTypeScript("src/app/api/invitations/redeem/route.ts", {
      "@/lib/invitations": {
        redeemInvitationCode: async () => true,
        findRegisteredDevice: async () => access,
      },
    });
    const response = await POST(
      post("/api/invitations/redeem", { code: "valid", next }),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { destination: expected });
  }
  for (const path of [
    "/lineups/012",
    "/lineups/12/edit",
    "/lineups/12/../56",
    "/heroes",
  ]) {
    assert.equal(policy.deviceCanReadPage(device, path), false, path);
  }
});

test("share-code generation validates a real lineup; standalone generation keeps full scope", async () => {
  const calls = [];
  const db = {
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => [{ id: 12 }] }) }),
    }),
  };
  const schema = loadTypeScript("src/db/schema.ts");
  const { POST } = loadTypeScript("src/app/api/invitations/generate/route.ts", {
    "@/db": { db, schema },
    "@/lib/editing": { canEditContent: async () => true },
    "@/lib/invitations": {
      generateInvitationCode: async (id) => {
        calls.push(id);
        return "CODE";
      },
    },
  });
  for (const body of [{ lineupId: 12 }, {}]) {
    assert.equal(
      (await POST(post("/api/invitations/generate", body))).status,
      201,
    );
  }
  assert.deepEqual(calls, [12, null]);
  for (const lineupId of [null, "12", -1, 0, 1.5, 2147483648, {}, []]) {
    assert.equal(
      (await POST(post("/api/invitations/generate", { lineupId }))).status,
      400,
    );
  }
  db.select = () => ({
    from: () => ({ where: () => ({ limit: async () => [] }) }),
  });
  assert.equal(
    (await POST(post("/api/invitations/generate", { lineupId: 56 }))).status,
    404,
  );
  assert.deepEqual(calls, [12, null]);
});
