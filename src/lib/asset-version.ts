/**
 * Bump whenever any image under /public is replaced in place (portraits,
 * badges, divinity / talent / artifact icons). next/image and browsers cache by
 * URL, so a new query string forces a fresh fetch. next.config.ts allows exactly
 * this query string for every local image.
 */
export const ASSET_VERSION = "5";

/** Append the cache-busting version to a /public image path. */
export function versioned(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}v=${ASSET_VERSION}`;
}
