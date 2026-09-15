import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { loadTypeScript } from "./load-typescript.mjs";

// Exercise the component's event handlers without executing real mutations.
function harness(action) {
  const hooks = [];
  let index = 0;
  let pending = false;
  let task;
  const { ConfirmAction } = loadTypeScript(
    "src/components/confirm-action.tsx",
    {
      "@base-ui/react/alert-dialog": { AlertDialog },
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
        useTransition: () => [
          pending,
          (callback) => {
            pending = true;
            task = callback().finally(() => {
              pending = false;
            });
          },
        ],
      },
      "@/lib/i18n/client": { useI18n: () => ({ t: (text) => text }) },
    },
  );
  const render = () => {
    index = 0;
    return ConfirmAction({
      action,
      title: 'Delete lineup "Arena"?',
      description: "This cannot be undone.",
      trigger: React.createElement("button", { type: "button" }, "Delete"),
    });
  };
  return { render, settle: () => task };
}

function find(node, predicate) {
  if (!React.isValidElement(node)) return undefined;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props.children)) {
    const found = find(child, predicate);
    if (found) return found;
  }
}
const submit = (tree) =>
  find(tree, (node) => node.type === "form").props.onSubmit({
    preventDefault() {},
  });
const open = (tree, value) => tree.props.onOpenChange(value, { cancel() {} });

test("opening, cancelling, and rendering closed confirmation never invoke deletion", () => {
  let calls = 0;
  const h = harness(async () => {
    calls++;
  });
  let tree = h.render();
  submit(tree);
  assert.equal(calls, 0);
  open(tree, true);
  tree = h.render();
  assert.equal(tree.props.open, true);
  const popup = find(tree, (node) => node.type === AlertDialog.Popup);
  const cancel = find(tree, (node) => node.type === AlertDialog.Close);
  assert.equal(popup.props.initialFocus, cancel.props.render.props.ref);
  assert.equal(cancel.props.render.props.type, "button");
  open(tree, false);
  assert.equal(h.render().props.open, false);
  assert.equal(calls, 0);
});

test("confirmation submits once and prevents dismissal until the request finishes", async () => {
  let calls = 0;
  let finish;
  const h = harness(() => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  open(h.render(), true);
  const tree = h.render();
  submit(tree);
  submit(tree);
  assert.equal(calls, 1);
  const pending = h.render();
  assert.equal(
    find(pending, (node) => node.type === "form").props["aria-busy"],
    true,
  );
  let cancelled = false;
  pending.props.onOpenChange(false, {
    cancel() {
      cancelled = true;
    },
  });
  assert.equal(cancelled, true);
  assert.equal(h.render().props.open, true);
  finish();
  await h.settle();
  assert.equal(h.render().props.open, false);
});

test("failed deletions stay open for retry and Next.js redirects are rethrown", async () => {
  let result = { error: "Build not found" };
  const h = harness(async () => result);
  open(h.render(), true);
  submit(h.render());
  await h.settle();
  let tree = h.render();
  assert.equal(tree.props.open, true);
  assert.equal(
    find(tree, (node) => node.props.role === "alert").props.children,
    "Build not found",
  );
  result = undefined;
  submit(tree);
  await h.settle();
  assert.equal(h.render().props.open, false);

  const failure = harness(async () => {
    throw new Error("Network unavailable");
  });
  open(failure.render(), true);
  submit(failure.render());
  await failure.settle();
  tree = failure.render();
  assert.equal(tree.props.open, true);
  assert.match(
    find(tree, (node) => node.props.role === "alert").props.children,
    /Please try again/,
  );

  const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/lineups;307;",
  });
  const navigation = harness(async () => {
    throw redirect;
  });
  open(navigation.render(), true);
  submit(navigation.render());
  await assert.rejects(navigation.settle(), (error) => error === redirect);
});

test("closed dialogs expose a button rather than a immediately submitting form", () => {
  const i18n = loadTypeScript("src/lib/i18n/client.tsx");
  const { ConfirmAction } = loadTypeScript(
    "src/components/confirm-action.tsx",
    { "@/lib/i18n/client": i18n },
  );
  const html = renderToStaticMarkup(
    React.createElement(
      i18n.I18nProvider,
      { locale: "en" },
      React.createElement(ConfirmAction, {
        title: "Delete note?",
        description: "This cannot be undone.",
        action: async () => {
          assert.fail("Rendering must not delete");
        },
        trigger: React.createElement("button", { type: "button" }, "Delete"),
      }),
    ),
  );
  assert.match(html, /type="button"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.doesNotMatch(html, /<form/);
});
