import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

test("production module reloads reuse one bounded pool and retire a changed database client", () => {
  const previous = globalThis.pg;
  delete globalThis.pg;
  const created = [];
  const load = (url) =>
    loadTypeScript("src/db/index.ts", {
      "@/lib/env": { env: { DATABASE_URL: url, NODE_ENV: "production" } },
      "./schema": {},
      postgres: {
        default: (connection, options) => {
          const client = {
            connection,
            options,
            closed: false,
            end: async () => {
              client.closed = true;
            },
          };
          created.push(client);
          return client;
        },
      },
      "drizzle-orm/postgres-js": { drizzle: (client) => client },
    });
  try {
    const first = load("postgres://test@localhost/first").db;
    const reload = load("postgres://test@localhost/first").db;
    assert.equal(first, reload);
    assert.equal(created.length, 1);
    assert.equal(first.options.prepare, false);
    assert.ok(first.options.max <= 2);
    assert.ok(
      first.options.idle_timeout > 0 && first.options.idle_timeout <= 20,
    );
    assert.ok(
      first.options.max_lifetime > 0 && first.options.max_lifetime <= 300,
    );
    const changed = load("postgres://test@localhost/second").db;
    assert.notEqual(changed, first);
    assert.equal(first.closed, true);
    assert.equal(load("postgres://test@localhost/second").db, changed);
    assert.equal(created.length, 2);
  } finally {
    if (previous === undefined) delete globalThis.pg;
    else globalThis.pg = previous;
  }
});

test("access diagnostics identify pool exhaustion without logging secrets", () => {
  const { reportAccessError } = loadTypeScript("src/lib/access-error.ts");
  const original = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args);
  try {
    reportAccessError("page-access", {
      message: "Query failed: secret-query-parameters",
      cause: {
        code: "XX000",
        message:
          "(EMAXCONN) max client connections reached, limit: 200; secret-cookie",
      },
    });
    reportAccessError("page-access", {
      code: "53300",
      message: "too many connections; secret-url",
    });
    assert.deepEqual(
      logs.map((entry) => entry[1].code),
      ["EMAXCONN", "53300"],
    );
    assert.ok(
      logs.every((entry) => entry[1].hint.includes("connection limit")),
    );
    assert.doesNotMatch(JSON.stringify(logs), /secret-/);
  } finally {
    console.error = original;
  }
});
