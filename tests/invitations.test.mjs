import assert from "node:assert/strict";
import test from "node:test";
import { AsyncLocalStorage } from "node:async_hooks";
import { createRequire } from "node:module";
import { NextRequest } from "next/server.js";
import { loadTypeScript as loadAppTypeScript } from "./load-typescript.mjs";

function loadTypeScript(path, overrides = {}) {
  return loadAppTypeScript(path, {
    "@/lib/public-urls": { isPublicPage: async () => false },
    "@/lib/public-url-assets": { isPublicPageAsset: async () => false },
    ...overrides,
  });
}

const policy = loadTypeScript("src/lib/invitation-policy.ts");
const { ASSET_VERSION } = loadTypeScript("src/lib/asset-version.ts");
const { PRODUCTION_APP_URL } = loadTypeScript("src/lib/site-url.ts");
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
const transfer = loadTypeScript("src/lib/device-transfer.ts");
const token = "a".repeat(43);
const code = "ABCD-1234-EFAB-5678-CDEF-9012";

test("the proxy matcher protects content while allowing only framework assets and the favicon", () => {
  globalThis.AsyncLocalStorage ??= AsyncLocalStorage;
  const require = createRequire(import.meta.url);
  const {
    unstable_doesMiddlewareMatch,
  } = require("next/experimental/testing/server");
  const { config } = loadTypeScript("src/proxy.ts", {
    "@/lib/invitations": {},
  });
  for (const url of [
    "/",
    "/heroes/sea-captain",
    "/heroes/sea-captain.png",
    "/api/notes",
    "/_next/image",
    "/faviconXico",
    "/_next/webpack-hmr-extra",
  ]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), true, url);
  }
  for (const url of [
    "/_next/static/chunks/app.js",
    "/_next/static/media/font.woff2",
    "/_next/webpack-hmr",
    "/favicon.ico",
  ]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), false, url);
  }
});

test("codes accept pasted spaces, separators, and lowercase, and reject malformed input", () => {
  assert.equal(
    policy.normalizeInvitationCode(` ${code.toLowerCase()} `),
    "ABCD1234EFAB5678CDEF9012",
  );
  for (const invalid of [
    null,
    {},
    "",
    "123",
    "G".repeat(24),
    " ".repeat(101),
  ]) {
    assert.equal(policy.normalizeInvitationCode(invalid), null);
  }
});

test("return destinations preserve app queries and fragments without codes or external redirects", () => {
  assert.equal(
    policy.invitationDestination(
      "/heroes/sea-captain?q=one&ic=secret&q=two#talents",
    ),
    "/heroes/sea-captain?q=one&q=two#talents",
  );
  for (const invalid of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%2f%2fevil.test",
    "/%5cevil.test",
    "/invite?ic=secret",
    "/api/notes",
    "/_next/image",
    "/a/../invite",
    "/%69nvite",
    "/%00",
    "/%zz",
    null,
  ]) {
    assert.equal(policy.invitationDestination(invalid), "/", String(invalid));
  }
});

function request(path, options = {}) {
  return new NextRequest(`http://localhost:3000${path}`, options);
}

function post(path, body, extraHeaders = {}) {
  return request(path, {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      "content-type": "application/json",
      cookie: `${policy.DEVICE_COOKIE}=${token}`,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

test("JSON redemption requires the same origin, even for sibling origins", () => {
  assert.equal(
    policy.isSameOriginInvitationRequest(
      post(
        "/api/invitations/redeem",
        {},
        {
          host: "127.0.0.1:3000",
          origin: "http://127.0.0.1:3000",
          "x-forwarded-proto": "http",
        },
      ),
    ),
    true,
    "Next.js may normalize request.url to localhost",
  );
  assert.equal(
    policy.isSameOriginInvitationRequest(post("/api/invitations/redeem", {})),
    true,
  );
  for (const headers of [
    { origin: "https://evil.test" },
    { origin: "http://localhost:4000" },
    { origin: "null" },
    { "sec-fetch-site": "cross-site" },
    { "sec-fetch-site": "same-site" },
    { "content-type": "text/plain" },
  ]) {
    assert.equal(
      policy.isSameOriginInvitationRequest(
        post("/api/invitations/redeem", {}, headers),
      ),
      false,
    );
  }
});

const rotated = "b".repeat(43);

function routing(registered = false, rotations = []) {
  return loadTypeScript("src/proxy.ts", {
    "@/lib/invitations": {
      findRegisteredDevice: async (value) =>
        registered && value === token ? { id: 1 } : null,
      newDeviceToken: () => token,
      rotateDeviceToken: async (value) => {
        rotations.push(value);
        return registered && value === token ? rotated : null;
      },
    },
  }).proxy;
}

const legacy = { host: "miniheroes-linup-builder.vercel.app" };
const production = new URL(PRODUCTION_APP_URL).origin;

test("the old address forwards every page and moves a registered browser with a one-time token", async () => {
  const rotations = [];
  const proxy = routing(true, rotations);
  const moved = await proxy(
    request("/heroes/sea-captain?mode=arena&mt=stale#talents", {
      headers: { ...legacy, cookie: `${policy.DEVICE_COOKIE}=${token}` },
    }),
  );
  assert.equal(moved.status, 307);
  const location = new URL(moved.headers.get("location"));
  assert.equal(
    location.origin + location.pathname,
    `${production}/heroes/sea-captain`,
  );
  assert.equal(location.searchParams.get("mode"), "arena");
  assert.equal(
    transfer.openDeviceTransfer(
      location.searchParams.get(policy.TRANSFER_PARAM),
    ),
    token,
  );
  assert.match(moved.headers.get("cache-control"), /no-store/);
  // The old cookie is left intact until the new address takes it over.
  assert.deepEqual(rotations, []);
  assert.equal(moved.headers.get("set-cookie"), null);
  const forwarded = await proxy(
    request("/lineups/123", {
      headers: {
        host: "localhost:3000",
        "x-forwarded-host": legacy.host,
        cookie: `${policy.DEVICE_COOKIE}=${token}`,
      },
    }),
  );
  const forwardedTo = new URL(forwarded.headers.get("location"));
  assert.equal(
    forwardedTo.origin + forwardedTo.pathname,
    `${production}/lineups/123`,
  );
  assert.equal(
    transfer.openDeviceTransfer(
      forwardedTo.searchParams.get(policy.TRANSFER_PARAM),
    ),
    token,
  );
  // Assets, APIs, RSC, and actions from a stale tab carry no token.
  for (const [path, options] of [
    ["/heroes/sea-captain.png", {}],
    ["/api/notes", {}],
    ["/heroes?_rsc=123", { headers: { RSC: "1" } }],
    ["/heroes", { method: "POST", headers: { "next-action": "test" } }],
  ]) {
    const before = rotations.length;
    const response = await proxy(
      request(path, {
        ...options,
        headers: {
          ...legacy,
          cookie: `${policy.DEVICE_COOKIE}=${token}`,
          ...options.headers,
        },
      }),
    );
    assert.equal(response.status, 307, path);
    const target = new URL(response.headers.get("location"));
    assert.equal(target.origin, production);
    assert.equal(target.searchParams.has(policy.TRANSFER_PARAM), false, path);
    assert.equal(rotations.length, before, path);
  }
});

test("sealed transfers open only for this app, only intact, and only briefly", () => {
  const sealed = transfer.sealDeviceTransfer(token, 1000);
  assert.equal(transfer.openDeviceTransfer(sealed, 1000), token);
  assert.equal(
    transfer.openDeviceTransfer(sealed, 1000 + transfer.TRANSFER_TTL_MS),
    null,
  );
  assert.notEqual(transfer.sealDeviceTransfer(token), sealed);
  for (const invalid of [
    null,
    "",
    token,
    sealed.slice(0, -2),
    `${sealed.slice(0, -2)}AA`,
    "A".repeat(300),
  ]) {
    assert.equal(transfer.openDeviceTransfer(invalid, 1000), null, invalid);
  }
});

test("unused invitation links on the old address carry their code to the new one", async () => {
  const proxy = routing();
  const response = await proxy(request("/?ic=ABCD-1234", { headers: legacy }));
  assert.equal(response.headers.get("location"), `${production}/?ic=ABCD-1234`);
  assert.equal(
    (await proxy(request("/heroes", { headers: legacy }))).headers.get(
      "location",
    ),
    `${production}/heroes`,
  );
});

test("the new address exchanges a one-time token for its own cookie exactly once", async () => {
  const rotations = [];
  const proxy = routing(true, rotations);
  const sealed = transfer.sealDeviceTransfer(token);
  const arrived = await proxy(
    request(
      `/heroes/sea-captain?${policy.TRANSFER_PARAM}=${sealed}&mode=arena`,
    ),
  );
  assert.equal(arrived.status, 307);
  assert.equal(
    arrived.headers.get("location"),
    "http://localhost:3000/heroes/sea-captain?mode=arena",
  );
  assert.match(
    arrived.headers.get("set-cookie"),
    new RegExp(`${policy.DEVICE_COOKIE}=${rotated}; .*HttpOnly`),
  );
  assert.deepEqual(rotations, [token]);
  // A spent, expired, or forged token is dropped and the visit reaches the gate.
  for (const [registered, value] of [
    [false, sealed],
    [
      true,
      transfer.sealDeviceTransfer(token, Date.now() - transfer.TRANSFER_TTL_MS),
    ],
    [true, token],
  ]) {
    const spent = await routing(registered)(
      request(`/heroes?${policy.TRANSFER_PARAM}=${value}`),
    );
    assert.equal(spent.headers.get("location"), "http://localhost:3000/heroes");
    assert.equal(spent.headers.get("set-cookie"), null);
  }
  // An already registered browser just loses the parameter.
  const registered = await proxy(
    request(`/heroes?${policy.TRANSFER_PARAM}=${sealed}`, {
      headers: { cookie: `${policy.DEVICE_COOKIE}=${token}` },
    }),
  );
  assert.equal(
    registered.headers.get("location"),
    "http://localhost:3000/heroes",
  );
  assert.deepEqual(rotations, [token]);
  assert.equal(
    policy.invitationDestination(`/heroes?${policy.TRANSFER_PARAM}=${token}`),
    "/heroes",
  );
});

test("unregistered visits and invitation links reach the gate without consuming a code", async () => {
  const proxy = routing();
  for (const path of [
    "/",
    "/heroes",
    "/lineups/123?mode=arena",
    "/heroes/sea-captain?ic=INVALID&mode=arena",
  ]) {
    const response = await proxy(request(path));
    assert.equal(response.status, 307);
    const location = new URL(response.headers.get("location"));
    assert.equal(location.pathname, "/invite");
    assert.equal(
      location.searchParams.get("next"),
      policy.invitationDestination(path),
    );
    assert.match(response.headers.get("cache-control"), /no-store/);
    if (path.includes("ic="))
      assert.equal(location.searchParams.get("ic"), "INVALID");
  }
  const gate = await proxy(request("/invite"));
  assert.equal(gate.headers.get("x-middleware-next"), "1");
  assert.match(gate.headers.get("set-cookie"), /HttpOnly/);
  assert.match(gate.headers.get("set-cookie"), /SameSite=lax/);
  const cookieAlone = await proxy(
    request("/heroes", {
      headers: { cookie: `${policy.DEVICE_COOKIE}=${token}` },
    }),
  );
  assert.equal(cookieAlone.status, 307);
});

test("registered devices keep access and strip even invalid codes without redemption", async () => {
  const proxy = routing(true);
  const headers = {
    cookie: `${policy.DEVICE_COOKIE}=${token}`,
    "x-app-destination": "//evil.test",
  };
  const clean = await proxy(request("/heroes?ic=USED&mode=arena", { headers }));
  assert.equal(
    clean.headers.get("location"),
    "http://localhost:3000/heroes?mode=arena",
  );
  const allowed = await proxy(request("/heroes?mode=arena", { headers }));
  assert.equal(allowed.headers.get("x-middleware-next"), "1");
  assert.equal(
    allowed.headers.get("x-middleware-request-x-app-destination"),
    "/heroes?mode=arena",
  );
  const gate = await proxy(
    request("/invite?next=%2Flineups%2F123&ic=USED", { headers }),
  );
  assert.equal(
    gate.headers.get("location"),
    "http://localhost:3000/lineups/123",
  );
});

test("APIs, RSC, actions, and original artwork are gated; the image optimizer is unavailable", async () => {
  const proxy = routing();
  for (const path of [
    "/api/notes",
    "/api/builds/importable?heroId=1",
    "/api/health",
    "/heroes/sea-captain.png",
    "/talents/sea-captain/ghost-ship.png",
    "/icons/cores.png",
  ]) {
    assert.equal((await proxy(request(path))).status, 401, path);
  }
  assert.equal(
    (await proxy(request("/heroes?_rsc=123", { headers: { RSC: "1" } })))
      .status,
    307,
  );
  assert.equal(
    (
      await proxy(
        request("/heroes", {
          method: "POST",
          headers: { "next-action": "test" },
        }),
      )
    ).status,
    401,
  );
  for (const registered of [false, true]) {
    assert.equal(
      (
        await routing(registered)(
          request("/_next/image?url=%2Fheroes%2Fsea-captain.png&w=256&q=75", {
            headers: { cookie: `${policy.DEVICE_COOKIE}=${token}` },
          }),
        )
      ).status,
      404,
    );
  }
  const file = await routing(true)(
    request("/heroes/sea-captain.png", {
      headers: { cookie: `${policy.DEVICE_COOKIE}=${token}` },
    }),
  );
  assert.equal(file.headers.get("x-middleware-next"), "1");
  assert.equal(
    file.headers.get("cache-control"),
    "private, max-age=0, must-revalidate",
  );
});

test("authorized image reads cache privately by version, cookie, and referrer", async () => {
  const proxy = routing(true);
  const headers = { cookie: `${policy.DEVICE_COOKIE}=${token}` };
  for (const method of ["GET", "HEAD"]) {
    for (const path of [
      "/heroes/sea-captain.png",
      "/talents/sea-captain/ghost-ship.png",
      "/icons/core.png",
    ]) {
      const response = await proxy(
        request(`${path}?v=${ASSET_VERSION}`, { method, headers }),
      );
      assert.equal(response.headers.get("x-middleware-next"), "1");
      assert.equal(
        response.headers.get("cache-control"),
        "private, max-age=31536000, immutable",
      );
      assert.equal(response.headers.get("vary"), "Cookie, Referer");
    }
  }
  const oldVersion = await proxy(
    request("/heroes/sea-captain.png?v=outdated", { headers }),
  );
  assert.equal(
    oldVersion.headers.get("cache-control"),
    "private, max-age=0, must-revalidate",
  );
  for (const [path, options] of [
    [`/heroes/sea-captain.png?v=${ASSET_VERSION}`, {}],
    [`/heroes/sea-captain.png?v=${ASSET_VERSION}&ic=USED`, { headers }],
    [`/heroes/sea-captain.png?v=${ASSET_VERSION}`, { method: "POST", headers }],
    [
      `/heroes/sea-captain.png?v=${ASSET_VERSION}`,
      { headers: { ...headers, "next-action": "test" } },
    ],
    [`/heroes?v=${ASSET_VERSION}`, { headers }],
    [`/api/notes?v=${ASSET_VERSION}`, { headers }],
  ]) {
    const response = await proxy(request(path, options));
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  }
});

test("database failures fail closed without exposing internal errors", async () => {
  const { proxy } = loadTypeScript("src/proxy.ts", {
    "@/lib/invitations": {
      findRegisteredDevice: async () => {
        throw new Error("secret database details");
      },
    },
  });
  const response = await proxy(request("/heroes"));
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret/);
});

test("generation is restricted on both the route and the proxy", async () => {
  const previous = process.env.NODE_ENV;
  try {
    for (const nodeEnv of ["development", "production"]) {
      process.env.NODE_ENV = nodeEnv;
      for (const path of ["/invitations/new", "/api/invitations/generate"]) {
        const response = await routing()(
          request(path, { headers: { host: "localhost:3000" } }),
        );
        assert.equal(response.status, 404);
        const remote = await routing()(
          request(path, {
            headers: {
              host: "localhost:3000",
              "x-forwarded-host": "public.test",
            },
          }),
        );
        assert.equal(remote.status, 404);
      }
    }
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
  const { POST } = loadTypeScript("src/app/api/invitations/generate/route.ts", {
    "@/lib/editing": { canEditContent: async () => false },
    "@/lib/invitations": {
      generateInvitationCode: async () => {
        throw new Error("Unauthorized generation");
      },
    },
  });
  assert.equal((await POST(post("/api/invitations/generate", {}))).status, 404);
});

test("redemption validates input and origin, sets a persistent cookie, and sanitizes redirects", async () => {
  let calls = 0;
  const { POST } = loadTypeScript("src/app/api/invitations/redeem/route.ts", {
    "@/lib/invitations": {
      redeemInvitationCode: async (value, deviceToken) => {
        calls++;
        assert.equal(deviceToken, token);
        return value === code;
      },
    },
  });
  assert.equal(
    (
      await POST(
        post(
          "/api/invitations/redeem",
          { code },
          { origin: "https://evil.test" },
        ),
      )
    ).status,
    403,
  );
  assert.equal(
    (await POST(post("/api/invitations/redeem", { code }, { cookie: "" })))
      .status,
    400,
  );
  assert.equal((await POST(post("/api/invitations/redeem", null))).status, 400);
  assert.equal(calls, 0);
  const invalid = await POST(
    post("/api/invitations/redeem", { code: "invalid" }),
  );
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error, policy.INVALID_INVITATION);
  const success = await POST(
    post("/api/invitations/redeem", { code, next: "//evil.test" }),
  );
  assert.equal(success.status, 200);
  assert.deepEqual(await success.json(), { destination: "/" });
  assert.match(success.headers.get("set-cookie"), /Max-Age=31536000/);
  assert.match(success.headers.get("set-cookie"), /HttpOnly/);
});

test("API and action entry points check registration even without Proxy", async () => {
  const denied = new Error("Invitation required");
  const databaseTripwire = new Proxy(
    {},
    {
      get() {
        throw new Error("Unauthorized database access");
      },
    },
  );
  const overrides = {
    "@/db": { db: databaseTripwire, schema: databaseTripwire },
    "@/db/schema": { LINEUP_SIZE: 5 },
    "@/lib/app-access": {
      hasAppAccess: async () => null,
      requireAppAccess: async () => {
        throw denied;
      },
    },
    "@/lib/editing": {
      canEditContent: async () => true,
      requireEditing: async () => {},
    },
    "@/lib/builds": {
      getOtherHeroBuilds: async () => {
        throw new Error("Unauthorized build access");
      },
    },
  };
  for (const path of ["notes", "health", "builds/importable"]) {
    const { GET } = loadTypeScript(`src/app/api/${path}/route.ts`, overrides);
    assert.equal((await GET(request(`/api/${path}`))).status, 401);
  }
  const notesApi = loadTypeScript("src/app/api/notes/route.ts", overrides);
  assert.equal((await notesApi.POST(post("/api/notes", {}))).status, 401);
  const lineups = loadTypeScript("src/app/lineups/actions.ts", overrides);
  const builds = loadTypeScript(
    "src/app/heroes/[slug]/build-actions.ts",
    overrides,
  );
  const notes = loadTypeScript("src/app/notes/actions.ts", overrides);
  for (const call of [
    () => lineups.saveLineup({}),
    () => lineups.deleteLineup(1),
    () => builds.saveHeroBuild({}),
    () => builds.importHeroBuild({}),
    () => builds.deleteHeroBuild(1),
    () => notes.createNote({}, new FormData()),
    () => notes.deleteNote(1),
  ]) {
    await assert.rejects(call, denied);
  }
});
