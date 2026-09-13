import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);

/** Load app TypeScript and aliases for isolated tests without starting Next.js. */
export function loadTypeScript(path, overrides = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const loaded = { exports: {} };
  const resolve = (name) => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name.startsWith("@/"))
      return loadTypeScript(`src/${name.slice(2)}.ts`, overrides);
    return require(name);
  };
  new Function("require", "module", "exports", outputText)(
    resolve,
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
