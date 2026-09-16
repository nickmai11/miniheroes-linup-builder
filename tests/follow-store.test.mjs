import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

test("follow controls share state, deduplicate requests, and recover from failures", async () => {
  const { followStore } = loadTypeScript("src/lib/follow-store.ts");
  const original = globalThis.fetch;
  let following = false;
  let calls = 0;
  let fail = false;
  globalThis.fetch = async (url, options) => {
    calls++;
    if (fail) throw new Error("offline");
    if (options.method === "POST")
      following = JSON.parse(options.body).following;
    return Response.json({ following, canFollow: true });
  };
  try {
    const a = followStore({ kind: "lineup", id: 1 });
    const b = followStore({ kind: "lineup", id: 1 });
    await Promise.all([a.load(), b.load()]);
    assert.equal(calls, 1);
    await Promise.all([a.follow(true), b.follow(true)]);
    assert.equal(calls, 2);
    assert.equal(b.snapshot().summary.following, true);
    fail = true;
    await a.follow(false);
    assert.equal(a.snapshot().pending, false);
    assert.equal(b.snapshot().summary.following, true);
    assert.ok(b.snapshot().error);
    fail = false;
    await b.follow(false);
    assert.equal(a.snapshot().summary.following, false);
    assert.equal(a.snapshot().error, null);
  } finally {
    globalThis.fetch = original;
  }
});
