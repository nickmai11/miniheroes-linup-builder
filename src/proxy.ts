import { NextRequest, NextResponse } from "next/server";
import { ASSET_VERSION } from "@/lib/asset-version";
import {
  findRegisteredDevice,
  newDeviceToken,
  rotateDeviceToken,
} from "@/lib/invitations";
import { isLocalEditingAllowed } from "@/lib/local-edit-policy";
import { openDeviceTransfer, sealDeviceTransfer } from "@/lib/device-transfer";
import { PRODUCTION_APP_URL, isLegacyAppHost } from "@/lib/site-url";
import { isPublicPage } from "@/lib/public-urls";
import { isPublicPageAsset } from "@/lib/public-url-assets";
import {
  isPublicRead,
  publicAssetReferrer,
  publicPagePath,
} from "@/lib/public-url-policy";
import {
  DEVICE_COOKIE,
  INVITATION_REQUIRED,
  TRANSFER_PARAM,
  invitationDestination,
  invitationScreen,
  isDeviceToken,
  isPageNavigation,
  requestedHost,
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
  requestHeaders.set("x-app-method", request.method);
  const next = () =>
    NextResponse.next({ request: { headers: requestHeaders } });
  const finish = (response: NextResponse) => {
    privateInvitationResponse(response);
    if (
      isPublicRead(request.method, request.headers) &&
      /\.png$/.test(path) &&
      response.headers.get("x-middleware-next") === "1"
    ) {
      // Cache authorized artwork only in this browser. Replaced images get a
      // new versioned URL; unversioned or older URLs must revalidate.
      response.headers.set(
        "Cache-Control",
        url.searchParams.get("v") === ASSET_VERSION
          ? "private, max-age=31536000, immutable"
          : "private, max-age=0, must-revalidate",
      );
      response.headers.append("Vary", "Cookie, Referer");
    }
    return response;
  };
  const unavailable = () =>
    finish(
      NextResponse.json(
        { error: "Access is temporarily unavailable. Please try again." },
        { status: 503 },
      ),
    );

  if (isLegacyAppHost(requestedHost(request.headers))) {
    // The old address keeps every path and query, including unused invitation
    // links. A registered browser also receives a sealed, short-lived copy of
    // its token. Nothing changes here, so a request that never follows the
    // redirect (a prefetch, a closed tab) costs nothing; the new address
    // exchanges the copy for its own cookie and only then retires this one.
    const target = new URL(`${path}${url.search}`, PRODUCTION_APP_URL);
    target.searchParams.delete(TRANSFER_PARAM);
    if (isPageNavigation(request, path)) {
      const token = request.cookies.get(DEVICE_COOKIE)?.value;
      try {
        if (isDeviceToken(token) && (await findRegisteredDevice(token)))
          target.searchParams.set(TRANSFER_PARAM, sealDeviceTransfer(token));
      } catch {
        return unavailable();
      }
    }
    return finish(NextResponse.redirect(target));
  }

  if (
    [
      "/invitations/new",
      "/api/invitations/generate",
      "/public-urls",
      "/api/public-urls",
    ].includes(path)
  ) {
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
      } else if (
        request.method === "GET" &&
        (url.searchParams.has("ic") || url.searchParams.has(TRANSFER_PARAM))
      ) {
        const clean = url.clone();
        clean.searchParams.delete("ic");
        clean.searchParams.delete(TRANSFER_PARAM);
        response = NextResponse.redirect(clean);
      } else response = next();
      setDeviceCookie(response, token);
      return finish(response);
    }

    if (
      url.searchParams.has(TRANSFER_PARAM) &&
      isPageNavigation(request, path)
    ) {
      // Exchange the sealed token for this host's own cookie, then drop it from
      // the address. Rotating retires the old host's cookie and the copy at
      // once; a stale or forged copy simply reaches the gate.
      const clean = url.clone();
      clean.searchParams.delete(TRANSFER_PARAM);
      const response = NextResponse.redirect(clean);
      const moved = await rotateDeviceToken(
        openDeviceTransfer(url.searchParams.get(TRANSFER_PARAM)),
      );
      if (moved) setDeviceCookie(response, moved);
      return finish(response);
    }

    if (isPublicRead(request.method, request.headers)) {
      const page = publicPagePath(`${path}${url.search}`);
      if (page && (await isPublicPage(page))) {
        const response = finish(next());
        // Images may use this same-origin page as their public access context.
        response.headers.set("Referrer-Policy", "same-origin");
        return response;
      }
      if (/\.png$/.test(path)) {
        const referringPage = publicAssetReferrer(request);
        if (
          referringPage &&
          (await isPublicPage(referringPage)) &&
          (await isPublicPageAsset(referringPage, path))
        ) {
          return finish(next());
        }
      }
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
    return unavailable();
  }
}

export const config = {
  matcher: ["/((?!_next/static/|_next/webpack-hmr$|favicon\\.ico$).*)"],
};
