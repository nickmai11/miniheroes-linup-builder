import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = fileURLToPath(new URL("../src/app", import.meta.url));

function pagesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return pagesIn(path);
    return entry.name === "page.tsx" ? [path] : [];
  });
}

const pages = pagesIn(app);
const routeOf = (page) =>
  "/" +
  relative(app, dirname(page))
    .split("/")
    .filter((segment) => segment && !segment.startsWith("("))
    .join("/");

test("loading boundaries preserve every public page URL", () => {
  assert.deepEqual(pages.map(routeOf).sort(), [
    "/",
    "/about",
    "/divinities",
    "/divinities/[slug]",
    "/fishes",
    "/heroes",
    "/heroes/[slug]",
    "/invitations/new",
    "/invite",
    "/lineups",
    "/lineups/[id]",
    "/lineups/[id]/edit",
    "/lineups/new",
    "/notes",
    "/public-urls",
  ]);
});

for (const page of pages) {
  test(`${routeOf(page)} has only its own page loading boundary`, () => {
    const boundaries = [];
    for (let directory = dirname(page); ; directory = dirname(directory)) {
      const loading = join(directory, "loading.tsx");
      if (existsSync(loading)) boundaries.push(relative(app, loading));
      if (directory === app) break;
    }
    // Next.js prefetching stops at the first loading boundary. An ancestor
    // fallback can otherwise appear before the destination's own skeleton.
    assert.deepEqual(boundaries, [
      relative(app, join(dirname(page), "loading.tsx")),
    ]);
  });
}
