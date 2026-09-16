import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const deniedMessage = "Sign in as admin to make changes.";

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

function serverModules(nodeEnv, requestHeaders, admin = false) {
  const access = loadServerModule(
    "src/lib/editing.ts",
    {
      "server-only": {},
      "next/headers": { headers: async () => requestHeaders },
      "@/lib/admin-access": { isAdmin: async () => admin },
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
    "server-only": {},
    "@/lib/admin-access": { getAdminId: async () => (admin ? "owner" : null) },
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
    invitations: loadServerModule(
      "src/app/api/invitations/generate/route.ts",
      overrides,
      nodeEnv,
    ),
    publicUrls: loadServerModule(
      "src/app/api/public-urls/route.ts",
      overrides,
      nodeEnv,
    ),
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
  ...["localhost:3000", "127.0.0.1:3000", "[::1]:3000"].map((host) => [
    `local development at ${host} without admin access`,
    "development",
    new Headers({ host, origin: `http://${host}` }),
  ]),
  [
    "local development with Next.js loopback forwarding headers",
    "development",
    new Headers({
      host: "localhost:3000",
      "x-forwarded-host": "localhost:3000",
      "x-forwarded-for": "127.0.0.1",
      "sec-fetch-site": "same-origin",
    }),
  ],
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
    const {
      access,
      lineups,
      builds,
      notes,
      notesApi,
      invitations,
      publicUrls,
    } = serverModules(nodeEnv, requestHeaders);
    assert.equal(await access.canEditContent(), false);
    await assert.rejects(access.requireEditing(), { message: deniedMessage });
    for (const result of [
      await lineups.saveLineup({}),
      await lineups.setLineupVisibility(1, true),
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
    const unauthorizedRequest = {
      json() {
        throw new Error("Unauthorized body parsed");
      },
    };
    const response = await notesApi.POST(unauthorizedRequest);
    for (const mutate of [
      invitations.POST,
      publicUrls.POST,
      publicUrls.DELETE,
    ]) {
      assert.equal((await mutate(unauthorizedRequest)).status, 404);
    }
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: deniedMessage });
  });
}

for (const nodeEnv of ["development", "production"]) {
  for (const origin of ["http://localhost:3000", "https://example.com"]) {
    test(`admins can edit at ${origin} in ${nodeEnv}`, async () => {
      const { access, lineups, builds, notes, notesApi } = serverModules(
        nodeEnv,
        new Headers({ host: new URL(origin).host }),
        true,
      );
      assert.equal(await access.canEditContent(), true);
      await access.requireEditing();
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
        new Request(`${origin}/api/notes`, {
          method: "POST",
          headers: { "content-type": "application/json", origin },
          body: "{}",
        }),
      );
      assert.equal(response.status, 400);
    });
  }
}
