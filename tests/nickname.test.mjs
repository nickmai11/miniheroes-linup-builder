import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { loadTypeScript } from "./load-typescript.mjs";

const { nicknameInputSchema } = loadTypeScript("src/lib/nickname-input.ts");

test("nicknames accept trimmed Unicode text and reject blanks, controls, long names and identity injection", () => {
  assert.equal(
    nicknameInputSchema.parse({ nickname: "  Nguyễn Anh 🐟  " }).nickname,
    "Nguyễn Anh 🐟",
  );
  for (const nickname of [
    "",
    "  ",
    "\u200B",
    "x".repeat(41),
    "hello\nworld",
    42,
    null,
  ]) {
    assert.equal(nicknameInputSchema.safeParse({ nickname }).success, false);
  }
  assert.equal(
    nicknameInputSchema.safeParse({
      nickname: "Nick",
      viewerKey: "admin:other",
    }).success,
    false,
  );
});

const origin = "https://miniheroes-library.vercel.app";
function request(body, headers = {}) {
  return new Request(`${origin}/api/nickname`, {
    method: "POST",
    headers: { origin, "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("nickname endpoint rejects cross-origin and malformed writes, preserves errors, and never caches profiles", async () => {
  let calls = 0;
  let result = { status: 200, nickname: "Nick" };
  const { POST } = loadTypeScript("src/app/api/nickname/route.ts", {
    "@/lib/viewer-profile": {
      saveViewerNickname: async () => {
        calls++;
        return result;
      },
    },
  });
  assert.equal(
    (
      await POST(
        request({ nickname: "Nick" }, { origin: "https://other.test" }),
      )
    ).status,
    403,
  );
  assert.equal((await POST(request("not json"))).status, 400);
  assert.equal(
    (await POST(request({ nickname: "x".repeat(5000) }))).status,
    400,
  );
  assert.equal(calls, 0);
  const response = await POST(request({ nickname: "Nick" }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { nickname: "Nick" });
  result = { status: 401, error: "Sign in" };
  assert.equal((await POST(request({ nickname: "Nick" }))).status, 401);
});

function find(node, predicate) {
  if (!React.isValidElement(node)) return undefined;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props.children)) {
    const found = find(child, predicate);
    if (found) return found;
  }
}
function harness() {
  const hooks = [];
  let index = 0;
  let refreshes = 0;
  const { NicknamePrompt } = loadTypeScript(
    "src/components/nickname-prompt.tsx",
    {
      react: {
        ...React,
        useState(initial) {
          const slot = index++;
          if (!(slot in hooks)) hooks[slot] = initial;
          return [
            hooks[slot],
            (value) => {
              hooks[slot] = value;
            },
          ];
        },
        useRef(initial) {
          const slot = index++;
          if (!(slot in hooks)) hooks[slot] = { current: initial };
          return hooks[slot];
        },
      },
      "next/navigation": {
        useRouter: () => ({
          refresh: () => {
            refreshes++;
          },
        }),
      },
      "@/lib/i18n/client": { useI18n: () => ({ t: (text) => text }) },
    },
  );
  return {
    render: () => {
      index = 0;
      return NicknamePrompt();
    },
    refreshes: () => refreshes,
  };
}
const submit = (tree) =>
  find(tree, (n) => n.type === "form").props.onSubmit({ preventDefault() {} });
const enter = (tree, value) =>
  find(tree, (n) => n.props.name === "nickname").props.onChange({
    target: { value },
  });
const flush = () => new Promise((resolve) => setImmediate(resolve));

test("required nickname dialog cannot be dismissed and only closes after a successful save", async (t) => {
  const h = harness();
  let resolve;
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/nickname");
    assert.deepEqual(JSON.parse(options.body), { nickname: "Nick" });
    calls++;
    return new Promise((done) => {
      resolve = done;
    });
  });
  let tree = h.render();
  assert.equal(tree.props.open, true);
  assert.equal(
    find(tree, (n) => n.type === Dialog.Close),
    undefined,
  );
  let cancelled = false;
  tree.props.onOpenChange(false, {
    cancel: () => {
      cancelled = true;
    },
  });
  assert.equal(cancelled, true);
  submit(tree);
  assert.equal(calls, 0);
  assert.ok(find(h.render(), (n) => n.props.role === "alert"));
  enter(h.render(), "  Nick  ");
  tree = h.render();
  submit(tree);
  submit(tree);
  assert.equal(calls, 1);
  assert.equal(
    find(h.render(), (n) => n.type === "form").props["aria-busy"],
    true,
  );
  resolve(Response.json({ error: "Please retry" }, { status: 503 }));
  await flush();
  assert.equal(h.render().props.open, true);
  assert.equal(
    find(h.render(), (n) => n.props.role === "alert").props.children,
    "Please retry",
  );
  submit(h.render());
  resolve(Response.json({ nickname: "Nick" }));
  await flush();
  assert.equal(h.render().props.open, false);
  assert.equal(h.refreshes(), 1);
});
