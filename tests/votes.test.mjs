import assert from "node:assert/strict";
import test from "node:test";
import { NextResponse } from "next/server.js";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";

test("vote buttons expose selected state, totals, pending state, and Vietnamese labels", () => {
  const i18n = loadTypeScript("src/lib/i18n/client.tsx");
  let state = {
    summary: { likes: 12, dislikes: 3, vote: 1, canVote: true },
    pending: false,
    error: null,
  };
  const { ContentVotes } = loadTypeScript("src/components/content-votes.tsx", {
    "next/navigation": {
      usePathname: () => "/lineups/1",
      useRouter: () => ({ refresh() {} }),
    },
    "@/lib/i18n/client": i18n,
    "@/lib/vote-store": {
      voteStore: () => ({
        subscribe: () => () => {},
        snapshot: () => state,
        serverSnapshot: () => state,
      }),
    },
  });
  const render = (locale = "en") =>
    renderToStaticMarkup(
      createElement(
        i18n.I18nProvider,
        { locale },
        createElement(ContentVotes, { kind: "lineup", id: 1, name: "Arena" }),
      ),
    );
  const html = render();
  assert.match(html, /aria-label="Like Arena" aria-pressed="true"/);
  assert.match(html, /aria-label="Dislike Arena" aria-pressed="false"/);
  assert.match(html, /12 likes, 3 dislikes/);
  assert.match(render("vi"), /aria-label="Không thích Arena"/);
  state = { ...state, pending: true };
  assert.match(render(), /aria-busy="true"/);
  assert.equal((render().match(/ disabled=""/g) ?? []).length, 2);
  state = {
    ...state,
    pending: false,
    summary: { ...state.summary, canVote: false, vote: 0 },
  };
  assert.match(render(), /Use an invitation or sign in as admin to vote/);
});

test("vote routes reject cross-origin and malformed writes before authorization", async () => {
  let accesses = 0;
  const route = loadTypeScript("src/app/api/votes/route.ts", {
    "next/server": { NextResponse },
    "@/lib/votes": {
      getVoteAccess: async () => {
        accesses++;
        throw new Error("Unexpected access");
      },
    },
  });
  const request = (body, origin = "https://example.test") =>
    new Request("https://example.test/api/votes", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body,
    });
  assert.equal(
    (await route.POST(request("{}", "https://evil.test"))).status,
    403,
  );
  for (const body of [
    "null",
    "{",
    "[]",
    "x".repeat(4097),
    JSON.stringify({ kind: "lineup", id: -1, page: "/lineups", value: 1 }),
    JSON.stringify({ kind: "build", id: 1, page: "/heroes/a", value: "1" }),
  ]) {
    assert.equal((await route.POST(request(body))).status, 400);
  }
  assert.equal(accesses, 0);
});

test("shared vote controls deduplicate requests, send desired states, and recover after failure", async () => {
  const { voteStore } = loadTypeScript("src/lib/vote-store.ts");
  const target = { kind: "build", id: 1, page: "/heroes/a" };
  const first = voteStore(target);
  const second = voteStore(target);
  const originalFetch = globalThis.fetch;
  const requests = [];
  let resolve;
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Promise((done) => {
      resolve = done;
    });
  };
  let notifications = 0;
  const unsubscribe = second.subscribe(() => notifications++);
  try {
    const load = first.load();
    const otherLoad = second.load();
    assert.equal(requests.length, 1);
    assert.equal(second.snapshot().pending, true);
    resolve(Response.json({ likes: 0, dislikes: 0, vote: 0, canVote: true }));
    await Promise.all([load, otherLoad]);
    assert.equal(second.snapshot().summary.vote, 0);
    const save = first.vote(1);
    assert.deepEqual(JSON.parse(requests[1].options.body), {
      ...target,
      value: 1,
    });
    resolve(Response.json({ likes: 1, dislikes: 0, vote: 1, canVote: true }));
    await save;
    assert.equal(second.snapshot().summary.likes, 1);
    const failure = second.vote(-1);
    resolve(Response.json({ error: "Unavailable" }, { status: 503 }));
    await failure;
    assert.equal(first.snapshot().summary.vote, 1);
    assert.equal(first.snapshot().pending, false);
    assert.match(first.snapshot().error, /Could not save/);
    const retry = second.vote(0);
    resolve(Response.json({ likes: 0, dislikes: 0, vote: 0, canVote: true }));
    await retry;
    assert.equal(first.snapshot().summary.vote, 0);
    assert.equal(first.snapshot().error, null);
    assert.ok(notifications >= 8);
  } finally {
    unsubscribe();
    globalThis.fetch = originalFetch;
  }
});
