import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { findRegisteredDevice } from "@/lib/invitations";
import {
  DEVICE_COOKIE,
  deviceCanReadPage,
  invitationScreen,
} from "@/lib/invitation-policy";
import { isPublicPage } from "@/lib/public-urls";
import { isPublicRead, publicPagePath } from "@/lib/public-url-policy";
import { isAdmin } from "@/lib/admin-access";

// Request-scoped only: authorization is never shared between visitors.
export const getRegisteredDevice = cache(async () => {
  return findRegisteredDevice((await cookies()).get(DEVICE_COOKIE)?.value);
});

export const hasAppAccess = cache(async (): Promise<boolean> => {
  return (
    (await isAdmin()) || (await getRegisteredDevice())?.fullAccess === true
  );
});

/** Pages and actions verify access independently of Proxy. */
export async function requireAppAccess(): Promise<void> {
  if (await hasAppAccess()) return;
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

/** Page/metadata reads can be public; editing requires admin access.
 * Reactions use the independent target and voter checks in votes.ts.
 */
export async function requirePageAccess(
  expectedDestination?: string,
): Promise<void> {
  if (await hasAppAccess()) return;
  const requestHeaders = await headers();
  const device = await getRegisteredDevice();
  const destination =
    expectedDestination ?? requestHeaders.get("x-app-destination") ?? "/";
  if (
    device &&
    isPublicRead(requestHeaders.get("x-app-method") ?? "", requestHeaders) &&
    deviceCanReadPage(device, destination)
  )
    return;
  const publicPage = await getPublicPage();
  if (
    publicPage &&
    (!expectedDestination || publicPage === expectedDestination)
  )
    return;
  redirect(invitationScreen(destination));
}

/** Null means all lineups; an empty array grants no private lineup data. */
export async function accessibleLineupIds(): Promise<number[] | null> {
  if (await hasAppAccess()) return null;
  const device = await getRegisteredDevice();
  if (device) return device.lineupIds;
  if ((await getPublicPage()) === "/lineups") return null;
  return [];
}
