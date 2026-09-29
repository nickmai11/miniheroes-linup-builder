import { PRODUCTION_APP_URL } from "@/lib/site-url";

const PAGE_PATH =
  /^(?:\/|\/about|\/fishes|\/notes|\/heroes(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?|\/divinities(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?|\/lineups(?:\/[1-9][0-9]*)?)$/;
const PAGE_PATTERN = /^\/(?:heroes|divinities|lineups)\/\*$/;

function appPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 4096) return null;
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\x00-\x20]/.test(value)
  )
    return null;
  try {
    const url = new URL(value, "https://app.invalid");
    const path = decodeURIComponent(url.pathname).replace(/\/$/, "") || "/";
    return path;
  } catch {
    return null;
  }
}

/** Exact read-only pages; patterns are settings, never request destinations. */
export function publicPagePath(value: unknown): string | null {
  const path = appPath(value);
  return path && PAGE_PATH.test(path) ? path : null;
}

function publicRulePath(value: string): string | null {
  const path = appPath(value);
  return path && (PAGE_PATH.test(path) || PAGE_PATTERN.test(path))
    ? path
    : null;
}

/** Rules that can grant access to this concrete read-only page. */
export function publicPageRules(value: string): string[] {
  const path = publicPagePath(value);
  if (!path) return [];
  const section = path.match(/^\/(heroes|divinities|lineups)\//)?.[1];
  return section ? [path, `/${section}/*`] : [path];
}

/** Accept app links copied from localhost or production, storing only their page path. */
export function normalizePublicUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 4096) return null;
  const input = value.trim();
  if (input.startsWith("/")) return publicRulePath(input);
  if (/^(?:heroes|divinities|lineups)(?:\/|$)/.test(input))
    return publicRulePath(`/${input}`);
  try {
    const url = new URL(input);
    const production = new URL(PRODUCTION_APP_URL);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (!local && url.origin !== production.origin) return null;
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    return publicRulePath(url.pathname);
  } catch {
    return null;
  }
}

export function isPublicRead(
  method: string,
  headers: Pick<Headers, "has">,
): boolean {
  return ["GET", "HEAD"].includes(method) && !headers.has("next-action");
}

/** Artwork requests must originate from a public page on this same app origin. */
export function publicAssetReferrer(request: Request): string | null {
  const referrer = request.headers.get("referer");
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    const current = new URL(request.url);
    const host = request.headers.get("host") ?? current.host;
    if (url.host !== host || url.protocol !== current.protocol) return null;
    return publicPagePath(`${url.pathname}${url.search}`);
  } catch {
    return null;
  }
}
