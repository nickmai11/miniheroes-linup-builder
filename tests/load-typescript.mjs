import { readFileSync } from "node:fs";
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
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    });
    const loaded = { exports: {} };
    modules.set(url.href, loaded);
    const resolve = (name) => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name.startsWith("@/"))
        return load(new URL(`../src/${name.slice(2)}.ts`, import.meta.url));
      if (name.startsWith(".")) return load(new URL(`${name}.ts`, url));
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
