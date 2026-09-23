import assert from "node:assert/strict";
import test from "node:test";
import net from "node:net";
import { once } from "node:events";
import postgres from "postgres";
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

test("concurrent mixed queries wait for ReadyForQuery on each pool connection", async () => {
  // Minimal PostgreSQL peer: delay ReadyForQuery to expose overlapping protocol
  // exchanges. Supavisor can stall when Parse/Describe follows an unfinished
  // parameterless query. Exercise the real driver with the app's pool options.
  const frame = (type, body = Buffer.alloc(0)) => {
    const header = Buffer.alloc(5);
    header.write(type);
    header.writeInt32BE(body.length + 4, 1);
    return Buffer.concat([header, body]);
  };
  const ready = frame("Z", Buffer.from("I"));
  let overlaps = 0;
  const sockets = new Set();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => {});
    let buffer = Buffer.alloc(0);
    let startup = true;
    let busy = false;
    let parameterCount = 0;
    socket.on("data", (data) => {
      buffer = Buffer.concat([buffer, data]);
      if (startup) {
        if (buffer.length < 4 || buffer.length < buffer.readInt32BE(0)) return;
        buffer = buffer.subarray(buffer.readInt32BE(0));
        startup = false;
        socket.write(Buffer.concat([frame("R", Buffer.alloc(4)), ready]));
      }
      while (buffer.length >= 5) {
        const length = buffer.readInt32BE(1) + 1;
        if (buffer.length < length) return;
        const type = String.fromCharCode(buffer[0]);
        const body = buffer.subarray(5, length);
        buffer = buffer.subarray(length);
        if (type === "P") {
          if (busy) overlaps++;
          busy = true;
          parameterCount = body.includes(Buffer.from("$1")) ? 1 : 0;
          socket.write(frame("1"));
        } else if (type === "D") {
          const parameters = Buffer.alloc(2 + 4 * parameterCount);
          parameters.writeInt16BE(parameterCount);
          if (parameterCount) parameters.writeInt32BE(25, 2);
          socket.write(Buffer.concat([frame("t", parameters), frame("n")]));
        } else if (type === "B") {
          socket.write(frame("2"));
        } else if (type === "E") {
          socket.write(frame("C", Buffer.from("SELECT 0\0")));
        } else if (type === "S") {
          setTimeout(() => {
            busy = false;
            if (!socket.destroyed) socket.write(ready);
          }, 5);
        } else if (type === "X") {
          socket.end();
        }
      }
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const previous = globalThis.pg;
  delete globalThis.pg;
  let client;
  let deadline;
  try {
    const { db } = loadTypeScript("src/db/index.ts", {
      "@/lib/env": {
        env: {
          DATABASE_URL: `postgres://test@127.0.0.1:${server.address().port}/test`,
        },
      },
      "./schema": {},
      postgres: {
        default: (url, options) => {
          client = postgres(url, { ...options, fetch_types: false });
          return client;
        },
      },
      "drizzle-orm/postgres-js": { drizzle: (sql) => sql },
    });
    deadline = setTimeout(() => void client.end({ timeout: 0 }), 5000);
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        i % 2 ? db`select ${"probe"}::text` : db`select 1`,
      ),
    );
    assert.equal(results.length, 20);
    assert.equal(
      overlaps,
      0,
      "a socket received a new query before ReadyForQuery",
    );
  } finally {
    clearTimeout(deadline);
    await client?.end({ timeout: 0 });
    for (const socket of sockets) socket.destroy();
    await new Promise((resolve) => server.close(resolve));
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
