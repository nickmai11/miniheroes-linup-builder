import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { findRegisteredDevice } from "@/lib/invitations";
import { DEVICE_COOKIE, invitationScreen } from "@/lib/invitation-policy";

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
