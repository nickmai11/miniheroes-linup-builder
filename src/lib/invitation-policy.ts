export const DEVICE_COOKIE = "mh_device";
/** One-time query parameter that moves a registered browser between hosts. */
export const TRANSFER_PARAM = "mt";
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const INVITATION_REQUIRED = "Enter an invitation code to continue.";
export const INVALID_INVITATION =
  "This invitation code is invalid or has already been used.";

export type DeviceAccess = {
  id: number;
  fullAccess: boolean;
  lineupIds: number[];
  invitedLineupIds?: number[];
  sharedHeroSlugs?: string[];
};

/** Scoped invitations permit the collection and exactly the invited detail pages. */
export function deviceCanReadPage(
  device: DeviceAccess,
  destination: string,
): boolean {
  if (device.fullAccess) return true;
  const path = invitationDestination(destination).split(/[?#]/)[0];
  if (path === "/lineups" || path === "/shared") return true;
  const hero = path.match(/^\/heroes\/([a-z0-9-]+)$/);
  if (hero && device.sharedHeroSlugs?.includes(hero[1])) return true;
  const match = path.match(/^\/lineups\/([1-9][0-9]*)$/);
  return Boolean(match && device.lineupIds.includes(Number(match[1])));
}

export function deviceInvitationDestination(
  device: DeviceAccess,
  value: unknown,
): string {
  const destination = invitationDestination(value);
  if (deviceCanReadPage(device, destination)) return destination;
  return device.lineupIds.length === 1
    ? `/lineups/${device.lineupIds[0]}`
    : "/lineups";
}

export function normalizeInvitationCode(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 100) return null;
  const code = value.replace(/[\s-]/g, "").toUpperCase();
  return /^[A-F0-9]{24}$/.test(code) ? code : null;
}

export function isDeviceToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

/** Only return to an app page on this origin, and never carry a code forward. */
export function invitationDestination(value: unknown): string {
  if (typeof value !== "string" || value.length > 4096) return "/";
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\x00-\x20]/.test(value)
  )
    return "/";
  try {
    const url = new URL(value, "https://app.invalid");
    const path = decodeURIComponent(url.pathname);
    if (
      url.origin !== "https://app.invalid" ||
      /[\\\x00-\x20]/.test(path) ||
      path.startsWith("//") ||
      /^\/(invite|invitations|api|_next)(\/|$)/.test(path)
    )
      return "/";
    url.searchParams.delete("ic");
    url.searchParams.delete(TRANSFER_PARAM);
    url.searchParams.delete("_rsc");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

/** Host the browser actually requested, behind Vercel's proxy or directly. */
export function requestedHost(headers: Headers): string | null {
  return headers.get("x-forwarded-host") ?? headers.get("host");
}

/** A top-level page request, as opposed to an API, asset, RSC, or action call. */
export function isPageNavigation(request: Request, path: string): boolean {
  return (
    ["GET", "HEAD"].includes(request.method) &&
    !request.headers.has("rsc") &&
    !request.headers.has("next-action") &&
    !path.startsWith("/api/") &&
    !/\.[a-z0-9]+$/i.test(path)
  );
}

export function invitationScreen(destination: string): string {
  return `/invite?next=${encodeURIComponent(invitationDestination(destination))}`;
}

/** JSON mutation endpoints only accept a same-origin browser POST. */
export function isSameOriginInvitationRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin || (fetchSite && fetchSite !== "same-origin")) return false;
  try {
    // Next.js can normalize request.url to localhost even when the browser
    // uses 127.0.0.1. Host preserves the address actually requested by it.
    const url = new URL(request.url);
    const host = request.headers.get("host") ?? url.host;
    const protocol =
      request.headers.get("x-forwarded-proto") ?? url.protocol.slice(0, -1);
    return (
      ["http", "https"].includes(protocol) &&
      origin === `${protocol}://${host}` &&
      request.headers.get("content-type")?.split(";")[0].trim() ===
        "application/json"
    );
  } catch {
    return false;
  }
}
