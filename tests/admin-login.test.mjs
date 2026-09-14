import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server.js";
import { loadTypeScript } from "./load-typescript.mjs";

const origin = "https://miniheroes-library.vercel.app";
const credentials = { email: "admin@example.test", password: "test-password" };
const admin = { id: "owner-id", app_metadata: { role: "admin" } };
const viewer = {
  id: "viewer-id",
  app_metadata: {},
  user_metadata: { role: "admin" },
};
function post(path, body = credentials, headers = {}) {
  return new Request(`${origin}${path}`, {
    method: "POST",
    headers: { origin, "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
function authRoute(path, auth) {
  return loadTypeScript(`src/app/api/admin/${path}/route.ts`, {
    "@/lib/supabase/server": {
      createClient: async () => (auth ? { auth } : null),
    },
  }).POST;
}

test("only server-managed Supabase app_metadata grants admin access", () => {
  const { isAdminUser } = loadTypeScript("src/lib/admin-policy.ts");
  assert.equal(isAdminUser(admin), true);
  for (const user of [
    null,
    viewer,
    { app_metadata: { role: "user" } },
    { user_metadata: { role: "admin" } },
  ]) {
    assert.equal(isAdminUser(user), false);
  }
});

test("login rejects cross-origin and malformed requests before contacting Supabase", async () => {
  const POST = authRoute("login", {
    signInWithPassword() {
      throw new Error("Supabase must not be contacted");
    },
  });
  for (const headers of [
    { origin: "https://evil.test" },
    { origin: "" },
    { "sec-fetch-site": "same-site" },
    { "content-type": "text/plain" },
  ]) {
    assert.equal(
      (await POST(post("/api/admin/login", credentials, headers))).status,
      403,
    );
  }
  for (const body of [
    null,
    {},
    { email: "not-an-email", password: "test" },
    { ...credentials, password: [] },
  ]) {
    assert.equal((await POST(post("/api/admin/login", body))).status, 400);
  }
  assert.equal(
    (await POST(post("/api/admin/login", { email: "x".repeat(9000) }))).status,
    413,
  );
});

test("login passes the password to Supabase and grants access only to a returned admin user", async () => {
  let user = admin;
  let signouts = 0;
  const POST = authRoute("login", {
    async signInWithPassword(input) {
      assert.deepEqual(input, credentials);
      return { data: { user }, error: null };
    },
    async signOut(options) {
      assert.deepEqual(options, { scope: "local" });
      signouts++;
      return { error: null };
    },
  });
  const response = await POST(post("/api/admin/login"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.match(response.headers.get("cache-control"), /private, no-store/);
  assert.equal(
    response.headers.get("set-cookie"),
    null,
    "The route does not mint its own session cookie",
  );
  assert.equal(signouts, 0);
  user = viewer;
  const denied = await POST(post("/api/admin/login"));
  assert.equal(denied.status, 403);
  assert.equal(signouts, 1);
});

test("login reports Supabase credential, rate-limit, and availability errors without exposing provider details", async () => {
  for (const [error, status, message] of [
    [
      { status: 400, message: "Sensitive provider detail" },
      401,
      "Incorrect email or password.",
    ],
    [{ status: 429 }, 429, "Too many login attempts. Please try again later."],
    [{ status: 503 }, 503, "Could not sign in. Please try again."],
  ]) {
    const POST = authRoute("login", {
      signInWithPassword: async () => ({ data: { user: null }, error }),
    });
    const response = await POST(post("/api/admin/login"));
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { error: message });
  }
  assert.equal(
    (await authRoute("login", null)(post("/api/admin/login"))).status,
    503,
  );
  const failed = authRoute("login", {
    signInWithPassword() {
      throw new Error("Network failed");
    },
  });
  assert.equal((await failed(post("/api/admin/login"))).status, 503);
});

test("logout calls Supabase for this session, requires same origin, and reports failures", async () => {
  let calls = 0;
  let error = null;
  const POST = authRoute("logout", {
    async signOut(options) {
      assert.deepEqual(options, { scope: "local" });
      calls++;
      return { error };
    },
  });
  assert.equal(
    (await POST(post("/api/admin/logout", {}, { origin: "https://evil.test" })))
      .status,
    403,
  );
  assert.equal(calls, 0);
  const response = await POST(post("/api/admin/logout", {}));
  assert.equal(response.status, 200);
  assert.equal(calls, 1);
  assert.match(response.headers.get("cache-control"), /no-store/);
  error = new Error("Provider unavailable");
  assert.equal((await POST(post("/api/admin/logout", {}))).status, 503);
});

test("server authorization revalidates the user through Supabase instead of trusting session contents", async () => {
  let user = admin;
  let error = null;
  let calls = 0;
  const { isAdmin } = loadTypeScript("src/lib/admin-access.ts", {
    "@/lib/supabase/server": {
      createClient: async () => ({
        auth: {
          async getUser() {
            calls++;
            return { data: { user }, error };
          },
          getSession() {
            throw new Error("Unverified session must not authorize");
          },
        },
      }),
    },
  });
  assert.equal(await isAdmin(), true);
  user = viewer;
  assert.equal(await isAdmin(), false);
  user = admin;
  error = new Error("Invalid or revoked session");
  assert.equal(await isAdmin(), false);
  assert.equal(calls, 3);
  const unavailable = loadTypeScript("src/lib/admin-access.ts", {
    "@/lib/supabase/server": { createClient: async () => null },
  });
  assert.equal(await unavailable.isAdmin(), false);
});

function refreshFixture({ user = admin, error = null, refresh = true } = {}) {
  return {
    "@/lib/supabase/config": {
      getSupabaseConfig: () => ({
        url: "https://test.supabase.co",
        key: "publishable-key",
      }),
      supabaseCookieOptions: () => ({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      }),
    },
    "@supabase/ssr": {
      createServerClient(url, key, options) {
        assert.equal(url, "https://test.supabase.co");
        assert.equal(key, "publishable-key");
        return {
          auth: {
            async getUser() {
              assert.ok(
                options.cookies
                  .getAll()
                  .some((cookie) => cookie.name === "sb-test-auth-token"),
              );
              if (refresh)
                options.cookies.setAll(
                  [
                    {
                      name: "sb-test-auth-token",
                      value: "refreshed-by-supabase",
                      options: { httpOnly: true, secure: true, path: "/" },
                    },
                  ],
                  {
                    "Cache-Control": "private, no-store",
                    Pragma: "no-cache",
                    Expires: "0",
                  },
                );
              return { data: { user }, error };
            },
          },
        };
      },
    },
  };
}
function request(path) {
  return new NextRequest(`${origin}${path}`, {
    headers: {
      host: new URL(origin).host,
      cookie: "sb-test-auth-token=expired; mh_device=existing-invitation",
    },
  });
}

test("Supabase refresh cookies update both the incoming request and outgoing response", async () => {
  const { refreshAdminSession } = loadTypeScript(
    "src/lib/supabase/proxy.ts",
    refreshFixture(),
  );
  const incoming = request("/heroes");
  const result = await refreshAdminSession(incoming);
  assert.equal(result.admin, true);
  assert.equal(
    incoming.cookies.get("sb-test-auth-token").value,
    "refreshed-by-supabase",
  );
  assert.equal(incoming.cookies.get("mh_device").value, "existing-invitation");
  assert.match(
    result.response.headers.get("set-cookie"),
    /sb-test-auth-token=refreshed-by-supabase;.*Secure; HttpOnly/,
  );
  assert.equal(result.response.headers.get("pragma"), "no-cache");
  const rejected = loadTypeScript(
    "src/lib/supabase/proxy.ts",
    refreshFixture({ user: viewer }),
  );
  assert.equal(
    (await rejected.refreshAdminSession(request("/heroes"))).admin,
    false,
  );
  const invalid = loadTypeScript(
    "src/lib/supabase/proxy.ts",
    refreshFixture({ error: new Error("Revoked") }),
  );
  assert.equal(
    (await invalid.refreshAdminSession(request("/heroes"))).admin,
    false,
  );
});

function routing(fixture = refreshFixture()) {
  return loadTypeScript("src/proxy.ts", {
    ...fixture,
    "@/lib/invitations": {
      findRegisteredDevice: async () => null,
      newDeviceToken: () => "a".repeat(43),
    },
    "@/lib/public-urls": { isPublicPage: async () => false },
    "@/lib/public-url-assets": { isPublicPageAsset: async () => false },
  }).proxy;
}

test("proxy preserves refreshed Supabase cookies on pages, images, redirects, and denied responses", async () => {
  const proxy = routing();
  for (const path of [
    "/heroes",
    "/heroes/sea-captain.png",
    "/lineups/new",
    "/public-urls",
    "/invitations/new",
    "/api/notes",
  ]) {
    const response = await proxy(request(path));
    assert.equal(response.status, 200, path);
    assert.match(
      response.headers.get("x-middleware-request-cookie"),
      /sb-test-auth-token=refreshed-by-supabase/,
    );
    assert.match(
      response.headers.get("set-cookie"),
      /sb-test-auth-token=refreshed-by-supabase/,
    );
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  const redirect = await proxy(request("/invite?next=/heroes"));
  assert.equal(redirect.headers.get("location"), `${origin}/heroes`);
  assert.match(redirect.headers.get("set-cookie"), /refreshed-by-supabase/);
  const denied = await routing(refreshFixture({ user: viewer }))(
    request("/public-urls"),
  );
  assert.equal(denied.status, 404);
  assert.match(denied.headers.get("set-cookie"), /refreshed-by-supabase/);
  const image = await routing(refreshFixture({ refresh: false }))(
    request("/heroes/sea-captain.png"),
  );
  assert.match(image.headers.get("cache-control"), /private, max-age=0/);
});

test("login and logout stay reachable without a session, and legacy custom cookies cannot grant access", async () => {
  const proxy = routing({
    "@/lib/supabase/proxy": {
      refreshAdminSession: async () => ({
        admin: false,
        response: NextResponse.next(),
      }),
    },
  });
  for (const path of ["/api/admin/login", "/api/admin/logout"]) {
    assert.equal(
      (await proxy(new NextRequest(`${origin}${path}`, { method: "POST" })))
        .status,
      200,
    );
  }
  const response = await proxy(
    new NextRequest(`${origin}/public-urls`, {
      headers: { cookie: "mh_admin=legacy-session" },
    }),
  );
  assert.equal(response.status, 404);
  assert.equal((await routing()(request("/_next/image"))).status, 404);
});

test("notes mutations reject cross-origin requests even for an authenticated admin", async () => {
  const { POST } = loadTypeScript("src/app/api/notes/route.ts", {
    "@/lib/editing": { canEditContent: async () => true },
    "@/lib/app-access": { hasAppAccess: async () => true },
    "@/db": {
      db: new Proxy(
        {},
        {
          get() {
            throw new Error("Unauthorized database access");
          },
        },
      ),
      schema: {},
    },
  });
  for (const headers of [
    { origin: "https://evil.test" },
    { "sec-fetch-site": "same-site" },
    { "content-type": "text/plain" },
  ]) {
    assert.equal(
      (
        await POST(
          post("/api/notes", { title: "Must not be created" }, headers),
        )
      ).status,
      403,
    );
  }
});
