import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { loadTypeScript } from "./load-typescript.mjs";

function find(node, predicate) {
  if (!React.isValidElement(node)) return undefined;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props.children)) {
    const found = find(child, predicate);
    if (found) return found;
  }
}
function all(node, predicate) {
  if (!React.isValidElement(node)) return [];
  return [
    ...(predicate(node) ? [node] : []),
    ...React.Children.toArray(node.props.children).flatMap((n) =>
      all(n, predicate),
    ),
  ];
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
function harness(kind) {
  const hooks = [];
  let index = 0;
  const { ContentShare } = loadTypeScript("src/components/content-share.tsx", {
    react: {
      ...React,
      useState(initial) {
        const slot = index++;
        if (!(slot in hooks)) hooks[slot] = initial;
        return [
          hooks[slot],
          (value) => {
            hooks[slot] =
              typeof value === "function" ? value(hooks[slot]) : value;
          },
        ];
      },
      useRef(initial) {
        const slot = index++;
        if (!(slot in hooks)) hooks[slot] = { current: initial };
        return hooks[slot];
      },
    },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "@/lib/i18n/client": { useI18n: () => ({ t: (x) => x }) },
  });
  return () => {
    index = 0;
    return ContentShare({ kind, id: 42 });
  };
}
const root = (tree) =>
  find(tree, (n) => typeof n.props.onOpenChange === "function");
const submit = (tree) =>
  find(tree, (n) => n.type === "form").props.onSubmit({ preventDefault() {} });

for (const kind of ["lineup", "build"])
  test(`${kind} Share loads checked nicknames and saves the selected stable IDs`, async (t) => {
    const render = harness(kind);
    let requestBody;
    t.mock.method(globalThis, "fetch", async (url, options) => {
      if (options.method === "POST") {
        requestBody = JSON.parse(options.body);
        return Response.json({ saved: true });
      }
      assert.equal(url, `/api/shares?kind=${kind}&id=42`);
      return Response.json({
        recipients: [
          { id: 3, nickname: "Same", selected: true },
          { id: 4, nickname: "Same", selected: false },
        ],
      });
    });
    root(render()).props.onOpenChange(true, { cancel() {} });
    await flush();
    let tree = render();
    const checkboxes = all(
      tree,
      (n) => n.type === "input" && n.props.type === "checkbox",
    );
    assert.equal(checkboxes.length, 2);
    assert.deepEqual(
      checkboxes.map((n) => n.props.checked),
      [true, false],
    );
    checkboxes[0].props.onChange({ target: { checked: false } });
    checkboxes[1].props.onChange({ target: { checked: true } });
    tree = render();
    submit(tree);
    await flush();
    assert.deepEqual(requestBody, { kind, id: 42, recipientIds: [4] });
    assert.equal(root(render()).props.open, false);
  });

test("failed nickname loading cannot save a cleared list and failed saving leaves the dialog open", async (t) => {
  const render = harness("lineup");
  let failLoad = true,
    posts = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (options.method === "POST") {
      posts++;
      return Response.json({ error: "Please retry" }, { status: 503 });
    }
    return failLoad
      ? Response.json({ error: "Unavailable" }, { status: 503 })
      : Response.json({ recipients: [] });
  });
  root(render()).props.onOpenChange(true, { cancel() {} });
  await flush();
  submit(render());
  await flush();
  assert.equal(posts, 0);
  assert.equal(root(render()).props.open, true);
  failLoad = false;
  find(render(), (n) => n.props.children === "Retry").props.onClick();
  await flush();
  submit(render());
  await flush();
  assert.equal(posts, 1);
  assert.equal(root(render()).props.open, true);
  assert.equal(
    find(render(), (n) => n.props.role === "alert").props.children,
    "Please retry",
  );
});

test("sharing rejects foreign origins and malformed writes before changing grants", async () => {
  let calls = 0;
  const { POST } = loadTypeScript("src/app/api/shares/route.ts", {
    "@/lib/content-sharing": {
      saveShareRecipients: async () => {
        calls++;
        return { saved: true, status: 200 };
      },
    },
    "next/cache": { revalidatePath() {} },
  });
  const request = (origin, body) =>
    new Request("https://app.test/api/shares", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body,
    });
  assert.equal((await POST(request("https://other.test", "{}"))).status, 403);
  assert.equal(
    (await POST(request("https://app.test", "invalid"))).status,
    400,
  );
  assert.equal(calls, 0);
  const response = await POST(
    request(
      "https://app.test",
      JSON.stringify({ kind: "lineup", id: 1, recipientIds: [] }),
    ),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});
