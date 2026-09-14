import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";
import { resolveLocale, isLocale } from "../src/lib/i18n/config.ts";

const { createI18n } = loadTypeScript("src/lib/i18n/messages.ts");
const client = loadTypeScript("src/lib/i18n/client.tsx");
const vietnamese = JSON.parse(
  readFileSync(new URL("../src/lib/i18n/vi.json", import.meta.url), "utf8"),
);

function render(Component, props, locale) {
  return renderToStaticMarkup(
    createElement(
      client.I18nProvider,
      { locale },
      createElement(Component, props),
    ),
  );
}

test("explicit language takes precedence over regional browser preferences", () => {
  assert.equal(resolveLocale("en", "vi-VN,vi;q=0.9,en;q=0.8"), "en");
  assert.equal(resolveLocale("vi", "en-US"), "vi");
  assert.equal(resolveLocale(undefined, "fr,vi-VN;q=0.8,en-US;q=0.6"), "vi");
  assert.equal(resolveLocale(undefined, "vi;q=0.3,en-GB;q=0.9"), "en");
  assert.equal(resolveLocale(undefined, "VI-vn;q=0.8,en;q=0.8"), "vi");
});

test("invalid preferences, unsupported languages and disabled choices fall back safely", () => {
  for (const value of [undefined, "", "fr", "constructor", "../../vi", "VI"])
    assert.equal(isLocale(value), false);
  for (const header of [
    null,
    "",
    "fr-FR,de;q=0.8",
    "vi;q=0",
    "vi;q=nope",
    "vi;q=2",
    "vi;q=-1",
    "*",
  ]) {
    assert.equal(resolveLocale("bad-cookie", header), "en");
  }
  assert.equal(resolveLocale("bad-cookie", "vi-VN"), "vi");
});

test("translations interpolate entire messages without altering recorded or user text", () => {
  const en = createI18n("en"),
    vi = createI18n("vi");
  assert.equal(
    en.t("View {name}", { name: "Sea Captain" }),
    "View Sea Captain",
  );
  assert.equal(vi.t("View {name}", { name: "Sea Captain" }), "Xem Sea Captain");
  assert.equal(
    vi.t("{name} Core", { name: "Cavalier Helm" }),
    "Lõi Cavalier Helm",
  );
  assert.equal(
    vi.t("Unknown {name}", { name: "$& {name}" }),
    "Unknown $& {name}",
  );
  assert.equal(vi.t("View {name}"), "Xem {name}");
  assert.equal(vi.t("constructor"), "constructor");
  assert.equal(vi.t("My custom team notes"), "My custom team notes");
});

test("Vietnamese translations retain all interpolation parameters", () => {
  const placeholders = (text) =>
    [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  for (const [english, translated] of Object.entries(vietnamese)) {
    assert.ok(translated.trim(), english);
    assert.deepEqual(placeholders(translated), placeholders(english), english);
  }
});

test("every literal translation call has a Vietnamese message", () => {
  const walk = (directory) =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    });
  for (const file of [...walk("src/app"), ...walk("src/components")].filter(
    (file) => file.endsWith(".tsx"),
  )) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(source) === "t" &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        assert.ok(
          Object.hasOwn(vietnamese, node.arguments[0].text),
          `${file}: ${node.arguments[0].text}`,
        );
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
});

test("dates and numbers use the selected locale and a consistent date timezone", () => {
  const date = new Date("2026-09-13T18:30:00Z");
  assert.equal(createI18n("en").formatDate(date), "Sep 14, 2026");
  assert.equal(createI18n("vi").formatDate(date), "14 thg 9, 2026");
  assert.equal(createI18n("en").formatNumber(1234.5), "1,234.5");
  assert.equal(createI18n("vi").formatNumber(1234.5), "1.234,5");
});

test("navigation translates labels while preserving URLs and active state", () => {
  const { NavLinks } = loadTypeScript("src/components/nav-links.tsx", {
    "@/lib/i18n/client": client,
    "next/navigation": { usePathname: () => "/heroes" },
  });
  for (const locale of ["en", "vi"]) {
    const html = render(NavLinks, { canEdit: false }, locale);
    assert.match(html, /href="\/heroes"/);
    assert.match(html, /aria-current="page"/);
    assert.doesNotMatch(html, /href="\/lineups\/new"/);
    assert.match(html, locale === "vi" ? /Anh hùng/ : /Heroes/);
  }
});

test("build priorities and empty states render in both languages", () => {
  const { BuildStats, PriorityLegend } = loadTypeScript(
    "src/components/build-stats.tsx",
    { "@/lib/i18n/client": client },
  );
  const props = { build: { runes: [], weapons: [], cores: [] } };
  const vi = render(BuildStats, props, "vi");
  assert.match(vi, /Phù văn/);
  assert.match(vi, /Tấn công/);
  assert.match(vi, /Chưa chọn lõi/);
  assert.doesNotMatch(vi, />Runes<|>Attack<|No cores selected/);
  assert.match(render(BuildStats, props, "en"), /No cores selected/);
  assert.match(render(PriorityLegend, {}, "vi"), /Quan trọng/);
});

test("server locale resolution agrees with the client provider", async () => {
  const { getI18n } = loadTypeScript("src/lib/i18n/server.ts", {
    "next/headers": {
      cookies: async () => ({ get: () => ({ value: "vi" }) }),
      headers: async () => new Headers({ "accept-language": "en-US" }),
    },
  });
  assert.equal((await getI18n()).locale, "vi");
  assert.equal((await getI18n()).t("Invitation code"), "Mã mời");
});
