export const PRODUCTION_APP_URL = "https://miniheroes-library.vercel.app/";

/** Former production hosts. Requests there move to the production URL. */
export const LEGACY_APP_HOSTS = ["miniheroes-linup-builder.vercel.app"];

export function isLegacyAppHost(host: string | null | undefined): boolean {
  return LEGACY_APP_HOSTS.includes((host ?? "").split(":")[0].toLowerCase());
}
