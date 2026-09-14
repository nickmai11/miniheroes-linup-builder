import assert from "node:assert/strict";
import test from "node:test";
import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server.js";
import { loadTypeScript } from "./load-typescript.mjs";

// Exercise the real Supabase SDK and cookie adapter against a stub Auth service.
// No account is created and no request reaches a real Supabase project.
test("Supabase SDK owns login cookies, expired-session refresh, role validation, and logout", async () => {
  const projectUrl = "https://admin-test.supabase.co";
  const origin = "https://miniheroes-library.vercel.app";
  const calls = [];
  const stored = new Map();
  const writes = [];
  let role = "admin";
  let firstLogin = true;
  const user = () => ({
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@example.test",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { role },
    user_metadata: { role: "admin" },
    created_at: new Date().toISOString(),
  });
  const token = (expiresAt) =>
    [
      { alg: "HS256", typ: "JWT" },
      {
        sub: user().id,
        exp: expiresAt,
        aud: "authenticated",
        role: "authenticated",
      },
    ]
      .map((part) => Buffer.from(JSON.stringify(part)).toString("base64url"))
      .join(".") + ".test-signature";
  const fakeFetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input.url);
    calls.push(`${init.method} ${url.pathname}${url.search}`);
    if (url.pathname === "/auth/v1/token") {
      const body = JSON.parse(init.body);
      if (url.searchParams.get("grant_type") === "password") {
        assert.equal(body.email, "admin@example.test");
        assert.equal(body.password, "test-password");
      } else {
        assert.equal(url.searchParams.get("grant_type"), "refresh_token");
        assert.equal(body.refresh_token, "provider-refresh-token");
      }
      const expiresAt =
        Math.floor(Date.now() / 1000) + (firstLogin ? -60 : 3600);
      firstLogin = false;
      return Response.json({
        access_token: token(expiresAt),
        refresh_token: "provider-refresh-token",
        expires_at: expiresAt,
        expires_in: 3600,
        token_type: "bearer",
        user: user(),
      });
    }
    if (url.pathname === "/auth/v1/user") return Response.json(user());
    if (url.pathname === "/auth/v1/logout") {
      assert.equal(url.searchParams.get("scope"), "local");
      return new Response(null, { status: 204 });
    }
    throw new Error(`Unexpected Auth endpoint: ${url.pathname}`);
  };
  const cookieStore = {
    getAll: () => [...stored].map(([name, value]) => ({ name, value })),
    set(name, value, options) {
      writes.push({ name, value, options });
      if (options.maxAge === 0) stored.delete(name);
      else stored.set(name, value);
    },
  };
  const overrides = {
    "@supabase/ssr": {
      createServerClient: (url, key, options) =>
        createServerClient(url, key, {
          ...options,
          global: { fetch: fakeFetch },
        }),
    },
    "@/lib/supabase/config": {
      getSupabaseConfig: () => ({
        url: projectUrl,
        key: "test-publishable-key",
      }),
      supabaseCookieOptions: () => ({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      }),
    },
    "next/headers": { cookies: async () => cookieStore },
  };
  const login = loadTypeScript(
    "src/app/api/admin/login/route.ts",
    overrides,
  ).POST;
  const response = await login(
    new Request(`${origin}/api/admin/login`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.test",
        password: "test-password",
      }),
    }),
  );
  assert.equal(response.status, 200);
  assert.ok(
    writes.some(
      ({ name, options }) =>
        name.startsWith("sb-") && options.httpOnly && options.secure,
    ),
  );
  assert.ok(!stored.has("mh_admin"));
  const beforeRefresh = [...stored.values()].join("");
  const incoming = new NextRequest(`${origin}/invitations/new`, {
    headers: {
      cookie: [...stored].map(([name, value]) => `${name}=${value}`).join("; "),
    },
  });
  const { refreshAdminSession } = loadTypeScript(
    "src/lib/supabase/proxy.ts",
    overrides,
  );
  const refreshed = await refreshAdminSession(incoming);
  assert.equal(refreshed.admin, true);
  assert.ok(calls.some((call) => call.includes("grant_type=refresh_token")));
  assert.ok(calls.some((call) => call.includes("/auth/v1/user")));
  assert.ok(refreshed.response.cookies.getAll().length > 0);
  assert.notEqual(
    incoming.cookies
      .getAll()
      .map(({ value }) => value)
      .join(""),
    beforeRefresh,
  );
  for (const cookie of refreshed.response.cookies.getAll())
    cookieStore.set(cookie.name, cookie.value, cookie);
  const { isAdmin } = loadTypeScript("src/lib/admin-access.ts", overrides);
  assert.equal(await isAdmin(), true);
  role = "viewer";
  assert.equal(
    await isAdmin(),
    false,
    "Fresh provider roles override admin metadata still present in the cookie",
  );
  const logout = loadTypeScript(
    "src/app/api/admin/logout/route.ts",
    overrides,
  ).POST;
  assert.equal(
    (
      await logout(
        new Request(`${origin}/api/admin/logout`, {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: "{}",
        }),
      )
    ).status,
    200,
  );
  assert.ok(calls.some((call) => call.includes("/auth/v1/logout?scope=local")));
  assert.ok(
    writes.some(
      ({ name, options }) => name.startsWith("sb-") && options.maxAge === 0,
    ),
  );
  assert.equal(stored.size, 0);
});
