import { NextRequest, NextResponse } from "next/server";
import { findRegisteredDevice, newDeviceToken } from "@/lib/invitations";
import { isLocalEditingAllowed } from "@/lib/local-edit-policy";
import {
  DEVICE_COOKIE,
  INVITATION_REQUIRED,
  invitationDestination,
  invitationScreen,
  isDeviceToken,
} from "@/lib/invitation-policy";
import {
  privateInvitationResponse,
  setDeviceCookie,
} from "@/lib/invitation-cookie";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const path = url.pathname;
  const requestHeaders = new Headers(request.headers);
  // Always overwrite the client-supplied destination before forwarding it.
  requestHeaders.set(
    "x-app-destination",
    invitationDestination(`${path}${url.search}`),
  );
  const next = () =>
    NextResponse.next({ request: { headers: requestHeaders } });
  const finish = privateInvitationResponse;

  if (path === "/invitations/new" || path === "/api/invitations/generate") {
    return finish(
      isLocalEditingAllowed(request.headers, process.env.NODE_ENV)
        ? next()
        : new NextResponse("Not found", { status: 404 }),
    );
  }
  if (path === "/api/invitations/redeem") return finish(next());
  // The shared image optimizer must never cache authenticated game artwork.
  // next/image uses the original, authenticated URLs (images.unoptimized).
  if (path === "/_next/image")
    return finish(new NextResponse("Not found", { status: 404 }));

  const token = request.cookies.get(DEVICE_COOKIE)?.value;
  try {
    // Files in public/ have no page or data layer, so validate their access here
    // too. Pages, metadata, APIs, and actions also check their own entry points.
    const device = await findRegisteredDevice(token);
    if (device && isDeviceToken(token)) {
      let response: NextResponse;
      if (path === "/invite") {
        response = NextResponse.redirect(
          new URL(invitationDestination(url.searchParams.get("next")), url),
        );
      } else if (request.method === "GET" && url.searchParams.has("ic")) {
        const clean = url.clone();
        clean.searchParams.delete("ic");
        response = NextResponse.redirect(clean);
      } else response = next();
      setDeviceCookie(response, token);
      return finish(response);
    }

    if (path === "/invite") {
      const response = next();
      // Issue an unregistered token before the POST. Retries from this browser
      // reuse it; possessing a cookie alone never grants content access.
      if (!isDeviceToken(token)) setDeviceCookie(response, newDeviceToken());
      return finish(response);
    }
    if (
      path.startsWith("/api/") ||
      /\.[a-z0-9]+$/i.test(path) ||
      !["GET", "HEAD"].includes(request.method)
    ) {
      return finish(
        NextResponse.json({ error: INVITATION_REQUIRED }, { status: 401 }),
      );
    }
    const destination = `${path}${url.search}`;
    const invite = new URL(invitationScreen(destination), url);
    if (url.searchParams.has("ic"))
      invite.searchParams.set("ic", url.searchParams.get("ic")!.slice(0, 101));
    return finish(NextResponse.redirect(invite));
  } catch {
    return finish(
      NextResponse.json(
        { error: "Access is temporarily unavailable. Please try again." },
        { status: 503 },
      ),
    );
  }
}

export const config = {
  matcher: ["/((?!_next/static/|_next/webpack-hmr$|favicon\\.ico$).*)"],
};
