import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";

test("lineup previews preserve navigation and have an accessible touch trigger without rendering closed content", () => {
  const i18n = loadTypeScript("src/lib/i18n/client.tsx");
  const { LineupPopover, LineupPreviewContent } = loadTypeScript(
    "src/components/lineup-popover.tsx",
    {
      "@/lib/i18n/client": i18n,
    },
  );
  const render = (component, props, locale = "en") =>
    renderToStaticMarkup(
      createElement(
        i18n.I18nProvider,
        { locale },
        createElement(component, props),
      ),
    );
  const lineup = {
    id: 7,
    name: "Arena",
    createdAt: new Date("2026-09-15"),
    description: "Private preview notes",
  };
  const closed = render(LineupPopover, { lineup, heroSlug: "sea-captain" });
  assert.match(closed, /href="\/lineups\/7"/);
  assert.match(closed, /role="link"/);
  assert.match(closed, /<button[^>]*aria-label="Preview Arena lineup"/);
  assert.doesNotMatch(closed, /Private preview notes|Loading lineup preview/);
  assert.match(
    render(LineupPopover, { lineup, heroSlug: "sea-captain" }, "vi"),
    /Xem trước đội hình Arena/,
  );
  const hero = {
    id: 1,
    slug: "sea-captain",
    name: "Sea Captain",
    role: "warrior",
    rarity: "mythic",
    imageUrl: "/heroes/sea-captain.png",
    pets: [{ id: 1, name: "Pet", iconUrl: "/pets/test.png" }],
    relics: [],
    build: null,
  };
  const preview = render(LineupPreviewContent, {
    lineup: {
      ...lineup,
      contextPage: "/lineups/7",
      slots: [hero, null, null, null, null],
      fishes: [],
    },
  });
  assert.match(preview, /Private preview notes/);
  assert.match(preview, /Slot 5/);
  assert.match(preview, /heroes(?:\/|%2F)sea-captain.png/);
  assert.match(preview, /pets(?:\/|%2F)test.png/);
  assert.doesNotMatch(preview, /divinities\//);
});

test("preview endpoint checks hero visibility and lineup access before loading formation data", async () => {
  let fullAccess = false;
  let device = null;
  let readable = [];
  let available = true;
  let loads = 0;
  const publicPages = new Set();
  const { GET } = loadTypeScript("src/app/api/lineups/preview/route.ts", {
    "@/lib/app-access": {
      hasAppAccess: async () => fullAccess,
      getRegisteredDevice: async () => device,
    },
    "@/lib/public-urls": {
      isPublicPage: async (page) => publicPages.has(page),
    },
    "@/lib/lineup-preview-access": {
      heroLineupPreviewIds: async (hero, ids, full) => {
        assert.equal(hero, "sea-captain");
        assert.equal(full, fullAccess);
        assert.deepEqual(ids, device?.lineupIds);
        return readable;
      },
    },
    "@/lib/lineups": {
      getLineup: async (id) => {
        loads++;
        return available
          ? {
              id,
              name: "Arena",
              description: "Saved notes",
              slots: [],
              fishes: [],
            }
          : undefined;
      },
    },
  });
  const get = (query = "id=7&hero=sea-captain") =>
    GET(new Request(`https://example.test/api/lineups/preview?${query}`));
  assert.equal((await get()).status, 403);
  publicPages.add("/heroes/sea-captain");
  assert.equal((await get()).status, 403);
  assert.equal(loads, 0);
  for (const query of [
    "id=0&hero=sea-captain",
    "id=2147483648&hero=sea-captain",
    "id=7&hero=../lineups",
    "id=7",
  ])
    assert.equal((await get(query)).status, 400);
  readable = [7];
  let response = await get();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).contextPage, "/lineups/7");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  publicPages.add("/lineups");
  response = await get();
  assert.equal((await response.json()).contextPage, "/lineups");
  device = { id: 1, fullAccess: false, lineupIds: [7] };
  assert.equal((await get()).status, 200);
  device = null;
  publicPages.clear();
  fullAccess = true;
  assert.equal((await get()).status, 200);
  available = false;
  assert.equal((await get()).status, 404);
});
