import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { loadTypeScript } from "./load-typescript.mjs";

const { normalizePublicUrl, publicPagePath, publicAssetReferrer } =
  loadTypeScript("src/lib/public-url-policy.ts");
const { ASSET_VERSION } = loadTypeScript("src/lib/asset-version.ts");

test("public URL input accepts app links and normalizes exact page paths", () => {
  for (const value of [
    "/heroes/sea-captain",
    " /heroes/sea-captain/?ic=secret#cores ",
    "http://127.0.0.1:3000/heroes/sea-captain",
    "https://miniheroes-library.vercel.app/heroes/sea-captain?x=1",
  ]) {
    assert.equal(normalizePublicUrl(value), "/heroes/sea-captain");
  }
  assert.equal(publicPagePath("/"), "/");
  assert.equal(publicPagePath("/lineups/123?_rsc=abc"), "/lineups/123");
  for (const value of [
    "//evil.test",
    "https://evil.test/heroes",
    "https://user:password@miniheroes-library.vercel.app/heroes",
    "/public-urls",
    "/api/public-urls",
    "/api/notes",
    "/invitations/new",
    "/invite",
    "/_next/image",
    "/heroes/*",
    "/lineups/new",
    "/lineups/123/edit",
    "/%70ublic-urls",
    "/%00",
    "/%zz",
    null,
    {},
  ]) {
    assert.equal(normalizePublicUrl(value), null, String(value));
  }
});

function request(path, options = {}) {
  return new NextRequest(`http://localhost:3000${path}`, options);
}

function routing(publicPaths = new Set(["/heroes/sea-captain"])) {
  return loadTypeScript("src/proxy.ts", {
    "@/lib/public-urls": {
      isPublicPage: async (path) => publicPaths.has(path),
    },
    "@/lib/public-url-assets": {
      isPublicPageAsset: async (page, asset) =>
        page === "/heroes/sea-captain" && asset === "/heroes/sea-captain.png",
    },
    "@/lib/invitations": {
      findRegisteredDevice: async () => null,
      newDeviceToken: () => "a".repeat(43),
    },
  }).proxy;
}

test("registered visitors do not add public URL lookups to ordinary navigation", async () => {
  const { proxy } = loadTypeScript("src/proxy.ts", {
    "@/lib/public-urls": {
      isPublicPage: async () => {
        throw new Error("Unnecessary public URL lookup");
      },
    },
    "@/lib/public-url-assets": {},
    "@/lib/invitations": { findRegisteredDevice: async () => ({ id: 1 }) },
  });
  const response = await proxy(
    request("/heroes", { headers: { cookie: `mh_device=${"a".repeat(43)}` } }),
  );
  assert.equal(response.headers.get("x-middleware-next"), "1");
});

test("public HTML, HEAD and RSC reads work without a device; removing a rule restores the gate", async () => {
  const paths = new Set(["/heroes/sea-captain"]);
  const proxy = routing(paths);
  for (const options of [
    {},
    { method: "HEAD" },
    {
      headers: {
        RSC: "1",
        "x-app-destination": "/about",
        "x-app-method": "POST",
      },
    },
  ]) {
    const response = await proxy(
      request("/heroes/sea-captain?_rsc=test", options),
    );
    assert.equal(response.headers.get("x-middleware-next"), "1");
    assert.equal(
      response.headers.get("x-middleware-request-x-app-method"),
      options.method ?? "GET",
    );
    assert.equal(
      response.headers.get("x-middleware-request-x-app-destination"),
      "/heroes/sea-captain",
    );
    assert.equal(response.headers.get("referrer-policy"), "same-origin");
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.equal(response.headers.has("set-cookie"), false);
  }
  for (const path of ["/heroes", "/heroes/sea-captain/edit", "/heroes/nezha"])
    assert.equal((await proxy(request(path))).status, 307);
  paths.clear();
  assert.equal((await proxy(request("/heroes/sea-captain"))).status, 307);
});

test("public pages never unlock actions, APIs, admin routes, or forged public context", async () => {
  const proxy = routing();
  for (const options of [
    { method: "POST" },
    { method: "POST", headers: { "next-action": "action" } },
    { headers: { "next-action": "action" } },
  ]) {
    assert.notEqual(
      (await proxy(request("/heroes/sea-captain", options))).headers.get(
        "x-middleware-next",
      ),
      "1",
    );
  }
  assert.equal(
    (
      await proxy(
        request("/api/notes", {
          headers: {
            "x-app-destination": "/heroes/sea-captain",
            "x-app-method": "GET",
          },
        }),
      )
    ).status,
    401,
  );
  const previous = process.env.NODE_ENV;
  try {
    for (const nodeEnv of ["development", "production"]) {
      process.env.NODE_ENV = nodeEnv;
      for (const path of ["/public-urls", "/api/public-urls"])
        assert.equal(
          (await proxy(request(path, { headers: { host: "localhost:3000" } })))
            .status,
          404,
        );
    }
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test("only a public page's own artwork loads through its same-origin referrer", async () => {
  const paths = new Set(["/heroes/sea-captain"]);
  const proxy = routing(paths);
  const headers = {
    referer: "http://localhost:3000/heroes/sea-captain",
    host: "localhost:3000",
  };
  const imagePath = `/heroes/sea-captain.png?v=${ASSET_VERSION}`;
  for (const method of ["GET", "HEAD"]) {
    const image = await proxy(request(imagePath, { method, headers }));
    assert.equal(image.headers.get("x-middleware-next"), "1");
    assert.equal(
      image.headers.get("cache-control"),
      "private, max-age=31536000, immutable",
    );
    assert.equal(image.headers.get("vary"), "Cookie, Referer");
    assert.equal(image.headers.has("set-cookie"), false);
  }
  assert.equal(
    (await proxy(request("/heroes/nezha.png", { headers }))).status,
    401,
  );
  for (const referer of [
    "https://evil.test/heroes/sea-captain",
    "http://localhost:3000/heroes/nezha",
    "http://localhost:4000/heroes/sea-captain",
  ]) {
    assert.equal(
      (
        await proxy(
          request("/heroes/sea-captain.png", {
            headers: { ...headers, referer },
          }),
        )
      ).status,
      401,
    );
  }
  assert.equal((await proxy(request("/heroes/sea-captain.png"))).status, 401);
  assert.equal(
    publicAssetReferrer(request("/heroes/sea-captain.png", { headers })),
    "/heroes/sea-captain",
  );
  paths.clear();
  const revoked = await proxy(request(imagePath, { headers }));
  assert.equal(revoked.status, 401);
  assert.equal(revoked.headers.get("cache-control"), "private, no-store");
});

test("the real artwork policy limits hero and divinity assets without database writes", async () => {
  const tripwire = new Proxy(
    {},
    {
      get() {
        throw new Error("Unexpected database access");
      },
    },
  );
  const { isPublicPageAsset } = loadTypeScript("src/lib/public-url-assets.ts", {
    "server-only": {},
    "@/db": { db: tripwire, schema: tripwire },
  });
  for (const path of [
    "/heroes/sea-captain.png",
    "/talents/sea-captain/ghost-ship.png",
    "/artifacts/sea-captain.png",
    "/badges/warrior.png",
    "/icons/core.png",
  ])
    assert.equal(
      await isPublicPageAsset("/heroes/sea-captain", path),
      true,
      path,
    );
  for (const path of [
    "/heroes/nezha.png",
    "/talents/nezha/wind-fire-wheels.png",
    "/secret.png",
    "/../heroes/sea-captain.png",
  ])
    assert.equal(
      await isPublicPageAsset("/heroes/sea-captain", path),
      false,
      path,
    );
  assert.equal(
    await isPublicPageAsset("/heroes", "/talents/sea-captain/ghost-ship.png"),
    false,
  );
  assert.equal(
    await isPublicPageAsset("/divinities", "/divinities/atk.png"),
    true,
  );
  assert.equal(
    await isPublicPageAsset("/about", "/heroes/sea-captain.png"),
    false,
  );
});

test("page guards accept a public read independently, while action guards still reject it", async () => {
  let method = "GET";
  let published = true;
  const { requirePageAccess, requireAppAccess } = loadTypeScript(
    "src/lib/app-access.ts",
    {
      "server-only": {},
      "next/headers": {
        cookies: async () => new Map(),
        headers: async () =>
          new Headers({
            "x-app-method": method,
            "x-app-destination": "/heroes/sea-captain",
          }),
      },
      "next/navigation": {
        redirect(url) {
          throw new Error(`redirect ${url}`);
        },
      },
      "@/lib/invitations": { findRegisteredDevice: async () => null },
      "@/lib/public-urls": { isPublicPage: async () => published },
    },
  );
  await requirePageAccess();
  await assert.rejects(requireAppAccess(), /redirect/);
  method = "POST";
  await assert.rejects(requirePageAccess(), /redirect/);
  method = "GET";
  published = false;
  await assert.rejects(requirePageAccess(), /redirect/);
});

test("public URL management validates admin access, origin, paths and duplicate additions", async () => {
  let admin = false;
  const paths = new Set();
  const { POST, DELETE } = loadTypeScript("src/app/api/public-urls/route.ts", {
    "@/lib/editing": { canEditContent: async () => admin },
    "@/lib/public-urls": {
      addPublicUrl: async (path) => {
        if (paths.has(path)) return undefined;
        paths.add(path);
        return { path };
      },
      removePublicUrl: async (path) => {
        paths.delete(path);
      },
    },
  });
  const post = (body, extra = {}) =>
    request("/api/public-urls", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "content-type": "application/json",
        ...extra,
      },
      body: JSON.stringify(body),
    });
  assert.equal((await POST(post({ url: "/about" }))).status, 404);
  assert.equal((await DELETE(post({ url: "/about" }))).status, 404);
  assert.equal(paths.size, 0);
  admin = true;
  assert.equal(
    (await POST(post({ url: "/about" }, { origin: "https://evil.test" })))
      .status,
    403,
  );
  for (const body of [{ url: "/api/notes" }, { url: "/public-urls" }, null, {}])
    assert.equal((await POST(post(body))).status, 400);
  assert.equal((await POST(post({ url: "/about?ic=secret" }))).status, 201);
  assert.deepEqual([...paths], ["/about"]);
  assert.equal((await POST(post({ url: "/about" }))).status, 409);
  assert.equal((await DELETE(post({ url: "/about" }))).status, 200);
  assert.equal(paths.size, 0);
});
