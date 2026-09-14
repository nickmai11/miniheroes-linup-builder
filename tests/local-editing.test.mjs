import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import { isLocalEditingAllowed } from "../src/lib/local-edit-policy.ts";

const require = createRequire(import.meta.url);
const deniedMessage = "Sign in as admin to make changes.";

for (const host of [
  "localhost",
  "localhost:3000",
  "127.0.0.1:3000",
  "[::1]:3000",
]) {
  test(`allows local development at ${host}`, () => {
    assert.equal(
      isLocalEditingAllowed(
        new Headers({ host, origin: `http://${host}` }),
        "development",
      ),
      true,
    );
  });
}

test("allows the loopback forwarding headers supplied by Next.js", () => {
  for (const address of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) {
    assert.equal(
      isLocalEditingAllowed(
        new Headers({
          host: "localhost:3000",
          "x-forwarded-host": "localhost:3000",
          "x-forwarded-for": address,
          "sec-fetch-site": "same-origin",
        }),
        "development",
      ),
      true,
    );
  }
});

for (const nodeEnv of ["production", "test", undefined]) {
  test(`denies local-looking requests when NODE_ENV is ${nodeEnv}`, () => {
    assert.equal(
      isLocalEditingAllowed(new Headers({ host: "localhost:3000" }), nodeEnv),
      false,
    );
  });
}

for (const host of [
  "example.com",
  "192.168.1.10:3000",
  "localhost.example.com",
  "example.localhost",
  "localhost@evil.test",
  "localhost:3000, example.com",
  "localhost/path",
  "localhost:0",
  "localhost:65536",
  "127.1",
  "2130706433",
  "[::]",
  "",
]) {
  test(`rejects a non-local or malformed host: ${host || "missing"}`, () => {
    assert.equal(
      isLocalEditingAllowed(new Headers(host ? { host } : {}), "development"),
      false,
    );
  });
}

for (const extra of [
  { "x-forwarded-host": "example.com" },
  { "x-forwarded-host": "localhost:3000, example.com" },
  { "x-forwarded-for": "203.0.113.10" },
  { "x-forwarded-for": "203.0.113.10, 127.0.0.1" },
  { forwarded: "for=127.0.0.1;host=localhost:3000" },
  { origin: "https://example.com" },
  { origin: "http://localhost:4000" },
  { origin: "http://user@localhost:3000" },
  { origin: "http://localhost:3000/path" },
  { origin: "null" },
  { origin: "not a URL" },
  { "sec-fetch-site": "cross-site" },
  { "sec-fetch-site": "same-site" },
]) {
  test(`rejects forwarded or cross-origin access: ${JSON.stringify(extra)}`, () => {
    assert.equal(
      isLocalEditingAllowed(
        new Headers({ host: "localhost:3000", ...extra }),
        "development",
      ),
      false,
    );
  });
}

// Exercise the real server modules with request headers and a database tripwire.
// Transpilation lets Node run the app's TypeScript/path aliases without Next.js.
function loadServerModule(path, overrides, nodeEnv) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const loadedModule = { exports: {} };
  const resolve = (name) => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name.startsWith("@/")) {
      return loadServerModule(`src/${name.slice(2)}.ts`, overrides, nodeEnv);
    }
    return require(name);
  };
  new Function("require", "module", "exports", "process", outputText)(
    resolve,
    loadedModule,
    loadedModule.exports,
    { env: { NODE_ENV: nodeEnv } },
  );
  return loadedModule.exports;
}

function serverModules(nodeEnv, requestHeaders) {
  const access = loadServerModule(
    "src/lib/editing.ts",
    {
      "server-only": {},
      "next/headers": { headers: async () => requestHeaders },
      "@/lib/admin-access": { isAdmin: async () => false },
      "@/lib/local-edit-policy": { isLocalEditingAllowed },
    },
    nodeEnv,
  );
  const databaseTripwire = new Proxy(
    {},
    {
      get() {
        throw new Error("Unexpected database access");
      },
    },
  );
  const overrides = {
    "@/lib/app-access": {
      requireAppAccess: async () => {},
      hasAppAccess: async () => ({ id: 1 }),
    },
    "@/lib/editing": access,
    "@/db": { db: databaseTripwire, schema: databaseTripwire },
    "@/db/schema": { LINEUP_SIZE: 5 },
  };
  return {
    access,
    lineups: loadServerModule("src/app/lineups/actions.ts", overrides, nodeEnv),
    builds: loadServerModule(
      "src/app/heroes/[slug]/build-actions.ts",
      overrides,
      nodeEnv,
    ),
    notes: loadServerModule("src/app/notes/actions.ts", overrides, nodeEnv),
    notesApi: loadServerModule(
      "src/app/api/notes/route.ts",
      overrides,
      nodeEnv,
    ),
  };
}

for (const [name, nodeEnv, requestHeaders] of [
  [
    "production with forged localhost headers",
    "production",
    new Headers({
      host: "localhost:3000",
      "x-forwarded-host": "localhost:3000",
      "x-forwarded-for": "127.0.0.1",
    }),
  ],
  [
    "a public host in development",
    "development",
    new Headers({ host: "example.com" }),
  ],
  [
    "a public proxy to localhost",
    "development",
    new Headers({ host: "localhost:3000", "x-forwarded-host": "example.com" }),
  ],
]) {
  test(`all write entry points reject ${name} before accessing data`, async () => {
    const { access, lineups, builds, notes, notesApi } = serverModules(
      nodeEnv,
      requestHeaders,
    );
    assert.equal(await access.canEditContent(), false);
    for (const result of [
      await lineups.saveLineup({}),
      await builds.saveHeroBuild({}),
      await builds.saveHeroBuild({ id: 1 }),
      await builds.importHeroBuild({}),
      await builds.deleteHeroBuild(1),
      await notes.createNote({}, new FormData()),
    ]) {
      assert.deepEqual(result, { error: deniedMessage });
    }
    await assert.rejects(lineups.deleteLineup(1), { message: deniedMessage });
    await assert.rejects(notes.deleteNote(1), { message: deniedMessage });
    const response = await notesApi.POST({
      json() {
        throw new Error("Unauthorized body parsed");
      },
    });
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: deniedMessage });
  });
}

test("local write entry points still reach validation without changing any data", async () => {
  const { access, lineups, builds, notes, notesApi } = serverModules(
    "development",
    new Headers({ host: "localhost:3000" }),
  );
  assert.equal(await access.canEditContent(), true);
  for (const result of [
    await lineups.saveLineup({}),
    await builds.saveHeroBuild({}),
    await builds.importHeroBuild({}),
    await notes.createNote({}, new FormData()),
  ]) {
    assert.ok(result.error);
    assert.notEqual(result.error, deniedMessage);
  }
  const response = await notesApi.POST(
    new Request("http://localhost:3000/api/notes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: "{}",
    }),
  );
  assert.equal(response.status, 400);
});
