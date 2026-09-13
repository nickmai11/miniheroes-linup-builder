import assert from "node:assert/strict";
import test from "node:test";
import { onceAsync } from "../src/lib/once-async.ts";

test("catalog initialization is shared by concurrent and later requests", async () => {
  let calls = 0;
  let finish;
  const initialize = onceAsync(() => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const first = initialize();
  const concurrent = initialize();
  assert.equal(first, concurrent);
  await Promise.resolve();
  finish("seeded");
  assert.equal(await first, "seeded");
  assert.equal(await initialize(), "seeded");
  assert.equal(calls, 1);
});

test("failed initialization is shared, then retried on the next request", async () => {
  let calls = 0;
  const initialize = onceAsync(async () => {
    if (++calls === 1) throw new Error("temporary database failure");
    return "seeded";
  });
  const first = initialize();
  const concurrent = initialize();
  await assert.rejects(first, /temporary database failure/);
  await assert.rejects(concurrent, /temporary database failure/);
  assert.equal(await initialize(), "seeded");
  assert.equal(calls, 2);
});

test("synchronous initializer errors also allow retry", async () => {
  let calls = 0;
  const initialize = onceAsync(() => {
    if (++calls === 1) throw new Error("setup failure");
    return Promise.resolve();
  });
  await assert.rejects(initialize(), /setup failure/);
  await initialize();
  assert.equal(calls, 2);
});
