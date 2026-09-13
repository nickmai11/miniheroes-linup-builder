type RequestHeaders = Pick<Headers, "get">;

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(?::([0-9]{1,5}))?$/i;
const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

/** The development server must also bind to loopback; headers are not identity. */
export function isLocalEditingAllowed(
  requestHeaders: RequestHeaders,
  nodeEnv: string | undefined,
): boolean {
  // Never grant write access on a deployed build, even with forged headers.
  if (nodeEnv !== "development") return false;

  const host = requestHeaders.get("host")?.toLowerCase();
  const match = host?.match(LOCAL_HOST);
  if (!host || !match) return false;
  if (match[2] && (Number(match[2]) < 1 || Number(match[2]) > 65535))
    return false;

  // Next.js supplies these for direct requests too. Reject proxy chains and
  // public forwarded hosts instead of treating their localhost backend as local.
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  if (forwardedHost !== null && forwardedHost.toLowerCase() !== host)
    return false;
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor !== null && !LOOPBACK_ADDRESSES.has(forwardedFor))
    return false;
  if (requestHeaders.get("forwarded") !== null) return false;

  const fetchSite = requestHeaders.get("sec-fetch-site");
  if (
    fetchSite !== null &&
    fetchSite !== "same-origin" &&
    fetchSite !== "none"
  ) {
    return false;
  }

  const origin = requestHeaders.get("origin");
  if (origin !== null) {
    try {
      const url = new URL(origin);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.host.toLowerCase() !== host ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      ) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}
