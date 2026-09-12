/**
 * Bump when portrait files change under the same path. next/image and browsers
 * cache by URL, so a new query string forces a fresh fetch. Also referenced by
 * next.config.ts so the image optimizer accepts exactly this query string.
 */
export const PORTRAIT_VERSION = "3";
