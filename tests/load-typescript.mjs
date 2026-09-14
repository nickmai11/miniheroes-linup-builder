import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);

/** Load app TypeScript and aliases for isolated tests without starting Next.js. */
export function loadTypeScript(path, overrides = {}) {
  const modules = new Map();
  function load(url) {
    if (modules.has(url.href)) return modules.get(url.href).exports;
    const source = readFileSync(url, "utf8");
    const { outputText } = ts.transpileModule(source, {
      fileName: url.pathname,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    const loaded = { exports: {} };
    modules.set(url.href, loaded);
    const resolve = (name) => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name.endsWith(".json") && name.startsWith(".")) {
        return {
          default: JSON.parse(readFileSync(new URL(name, url), "utf8")),
        };
      }
      // Server-only modules are exercised directly here, outside Next.js.
      if (name === "server-only") return {};
      if (name.startsWith("@/") || name.startsWith(".")) {
        const sourceUrl = name.startsWith("@/")
          ? new URL(`../src/${name.slice(2)}.ts`, import.meta.url)
          : new URL(`${name}.ts`, url);
        return load(
          existsSync(sourceUrl) ? sourceUrl : new URL(`${sourceUrl.href}x`),
        );
      }
      return require(name);
    };
    new Function("require", "module", "exports", outputText)(
      resolve,
      loaded,
      loaded.exports,
    );
    return loaded.exports;
  }
  return load(new URL(`../${path}`, import.meta.url));
}
