import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { findRegisteredDevice } from "@/lib/invitations";
import { DEVICE_COOKIE, invitationScreen } from "@/lib/invitation-policy";
import { isPublicPage } from "@/lib/public-urls";
import { isPublicRead, publicPagePath } from "@/lib/public-url-policy";

// Request-scoped only: authorization is never shared between visitors.
export const getRegisteredDevice = cache(async () => {
  return findRegisteredDevice((await cookies()).get(DEVICE_COOKIE)?.value);
});

/** Pages and actions verify access independently of Proxy. */
export async function requireAppAccess(): Promise<void> {
  if (await getRegisteredDevice()) return;
  const destination = (await headers()).get("x-app-destination") ?? "/";
  redirect(invitationScreen(destination));
}

export const getPublicPage = cache(async (): Promise<string | null> => {
  const requestHeaders = await headers();
  if (!isPublicRead(requestHeaders.get("x-app-method") ?? "", requestHeaders))
    return null;
  const path = publicPagePath(requestHeaders.get("x-app-destination"));
  return path && (await isPublicPage(path)) ? path : null;
});

/** Page/metadata reads can be public; mutation guards still require registration. */
export async function requirePageAccess(): Promise<void> {
  if (await getRegisteredDevice()) return;
  if (await getPublicPage()) return;
  await requireAppAccess();
}
