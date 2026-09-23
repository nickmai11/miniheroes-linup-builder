import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";

const admin = "12345678-1234-4234-8234-123456789012";

const fixtureUsers = [
  {
    viewerKey: `admin:${admin}`,
    nickname: "Owner",
    kind: "admin",
    isYou: true,
    createdAt: null,
    fullAccess: true,
    invitedLineups: 0,
    sharedItems: 0,
  },
  {
    viewerKey: "device:1",
    nickname: "Player",
    kind: "invited",
    isYou: false,
    createdAt: "2026-09-20T00:00:00Z",
    fullAccess: false,
    invitedLineups: 2,
    sharedItems: 1,
  },
];

test("user directory renders localized controls and only offers invited-user revocation", () => {
  const { createI18n } = loadTypeScript("src/lib/i18n/messages.ts");
  for (const locale of ["en", "vi"]) {
    const i18n = createI18n(locale);
    const { UserManager } = loadTypeScript("src/app/users/user-manager.tsx", {
      "@/lib/i18n/client": { useI18n: () => i18n },
      "next/navigation": { useRouter: () => ({ refresh() {} }) },
    });
    const markup = renderToStaticMarkup(
      React.createElement(UserManager, { initialUsers: fixtureUsers }),
    );
    assert.ok(markup.includes(i18n.t("Search users")));
    assert.ok(markup.includes(i18n.t("{count} invited lineups", { count: 2 })));
    assert.ok(markup.includes(i18n.t("{count} shared items", { count: 1 })));
    assert.equal(markup.split(i18n.t("Revoke access")).length - 1, 1);
    assert.ok(markup.includes('value="Owner"'));
    assert.ok(markup.includes('value="Player"'));
  }
});

function find(node, predicate) {
  if (!React.isValidElement(node)) return undefined;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props.children)) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

test("nickname form deduplicates requests and keeps failures editable; search filters by name and number", async (t) => {
  let hooks = [],
    index = 0,
    refreshes = 0;
  const { createI18n } = loadTypeScript("src/lib/i18n/messages.ts");
  const { UserManager } = loadTypeScript("src/app/users/user-manager.tsx", {
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
    "@/lib/i18n/client": { useI18n: () => createI18n("en") },
    "next/navigation": {
      useRouter: () => ({
        refresh() {
          refreshes++;
        },
      }),
    },
  });
  const renderManager = () => {
    index = 0;
    return UserManager({ initialUsers: fixtureUsers });
  };
  const tree = renderManager();
  const row = find(tree, (node) => node.props.user?.viewerKey === "device:1");
  for (const query of ["pLaYeR", "1"]) {
    find(
      renderManager(),
      (node) => node.props.id === "user-search",
    ).props.onChange({ target: { value: query } });
    assert.ok(
      find(
        renderManager(),
        (node) => node.props.user?.viewerKey === "device:1",
      ),
    );
    assert.equal(
      find(renderManager(), (node) => node.props.user?.kind === "admin"),
      undefined,
    );
  }
  hooks = [];
  const renderRow = () => {
    index = 0;
    return row.type(row.props);
  };
  let calls = 0,
    resolve;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls++;
    assert.equal(url, "/api/users");
    assert.equal(options.method, "PATCH");
    assert.deepEqual(JSON.parse(options.body), {
      viewerKey: "device:1",
      nickname: "New name",
    });
    return new Promise((done) => {
      resolve = done;
    });
  });
  find(renderRow(), (node) => node.props.name === "nickname").props.onChange({
    target: { value: "  New name  " },
  });
  const submit = () =>
    find(renderRow(), (node) => node.type === "form").props.onSubmit({
      preventDefault() {},
    });
  submit();
  submit();
  assert.equal(calls, 1);
  assert.equal(
    find(renderRow(), (node) => node.type === "form").props["aria-busy"],
    true,
  );
  resolve(Response.json({ error: "Please retry" }, { status: 503 }));
  await new Promise(setImmediate);
  assert.equal(
    find(renderRow(), (node) => node.props.role === "alert").props.children,
    "Please retry",
  );
  assert.equal(refreshes, 0);
  submit();
  resolve(Response.json({ nickname: "New name" }));
  await new Promise(setImmediate);
  assert.equal(refreshes, 1);
  assert.equal(
    find(renderRow(), (node) => node.props.name === "nickname").props.value,
    "New name",
  );
});
const { managedNicknameSchema, revokeUserSchema } = loadTypeScript(
  "src/lib/user-management-input.ts",
);

test("user updates validate identity and nickname; revocation never accepts admin accounts", () => {
  assert.deepEqual(
    managedNicknameSchema.parse({
      viewerKey: "device:1",
      nickname: "  Người chơi  ",
    }),
    { viewerKey: "device:1", nickname: "Người chơi" },
  );
  assert.ok(
    managedNicknameSchema.safeParse({
      viewerKey: `admin:${admin}`,
      nickname: "Admin",
    }).success,
  );
  for (const viewerKey of [
    "device:0",
    "device:-1",
    "device:1.5",
    "device:2147483648",
    "device:01",
    "admin:fake",
    "other:1",
  ]) {
    assert.equal(
      managedNicknameSchema.safeParse({ viewerKey, nickname: "Nick" }).success,
      false,
    );
    assert.equal(revokeUserSchema.safeParse({ viewerKey }).success, false);
  }
  assert.equal(
    revokeUserSchema.safeParse({ viewerKey: `admin:${admin}` }).success,
    false,
  );
  for (const nickname of ["", "   ", "a\nb", "x".repeat(41)])
    assert.equal(
      managedNicknameSchema.safeParse({ viewerKey: "device:1", nickname })
        .success,
      false,
    );
  assert.equal(
    managedNicknameSchema.safeParse({
      viewerKey: "device:1",
      nickname: "Nick",
      role: "admin",
    }).success,
    false,
  );
});

test("management services deny visitors before touching the database", async () => {
  const service = loadTypeScript("src/lib/user-management.ts", {
    "@/lib/admin-access": { getAdminId: async () => null },
    "@/db": {
      db: new Proxy(
        {},
        {
          get() {
            throw new Error("Database must not be accessed");
          },
        },
      ),
      schema: {},
    },
  });
  await assert.rejects(service.getManagedUsers(), /Sign in as admin/);
  assert.equal(
    (
      await service.updateManagedNickname({
        viewerKey: "device:1",
        nickname: "Nick",
      })
    ).status,
    403,
  );
  assert.equal(
    (await service.revokeManagedUser({ viewerKey: "device:1" })).status,
    403,
  );
});

test("user endpoints enforce admin access, same origin, bounded JSON, no-store, and failure handling", async () => {
  let adminId = null;
  let calls = 0;
  let result = { status: 200, nickname: "Nick" };
  const run = async () => {
    calls++;
    if (result instanceof Error) throw result;
    return result;
  };
  const { PATCH, DELETE } = loadTypeScript("src/app/api/users/route.ts", {
    "@/lib/admin-access": { getAdminId: async () => adminId },
    "@/lib/user-management": {
      updateManagedNickname: run,
      revokeManagedUser: run,
    },
    "@/lib/access-error": { reportAccessError() {} },
  });
  const origin = "https://example.com";
  const request = (method, body = {}, headers = {}) =>
    new Request(`${origin}/api/users`, {
      method,
      headers: { origin, "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  for (const [method, handler] of [
    ["PATCH", PATCH],
    ["DELETE", DELETE],
  ]) {
    adminId = null;
    assert.equal((await handler(request(method))).status, 403);
    adminId = admin;
    assert.equal(
      (await handler(request(method, {}, { origin: "https://evil.test" })))
        .status,
      403,
    );
    assert.equal((await handler(request(method, "not json"))).status, 400);
    assert.equal(
      (await handler(request(method, "x".repeat(4097)))).status,
      400,
    );
  }
  assert.equal(calls, 0);
  const response = await PATCH(
    request("PATCH", { viewerKey: "device:1", nickname: "Nick" }),
  );
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { nickname: "Nick" });
  result = { status: 404, error: "Missing" };
  assert.equal((await DELETE(request("DELETE"))).status, 404);
  result = new Error("private database information");
  const failed = await PATCH(request("PATCH"));
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /private database/);
});

test("users page authorizes before loading the user directory and cannot be published", async () => {
  const { publicPagePath } = loadTypeScript("src/lib/public-url-policy.ts");
  assert.equal(publicPagePath("/users"), null);
  const { default: Page } = loadTypeScript("src/app/users/page.tsx", {
    "@/lib/admin-access": { getAdminId: async () => null },
    "next/navigation": {
      notFound() {
        throw new Error("Not found");
      },
    },
    "@/lib/user-management": {
      getManagedUsers() {
        throw new Error("Leaked directory");
      },
    },
    "@/lib/i18n/server": {
      getI18n() {
        throw new Error("Should authorize first");
      },
    },
    "./user-manager": { UserManager() {} },
  });
  await assert.rejects(Page(), /^Error: Not found$/);
});
