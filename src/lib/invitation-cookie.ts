import type { NextResponse } from "next/server";
import { DEVICE_COOKIE, DEVICE_COOKIE_MAX_AGE } from "@/lib/invitation-policy";

export function setDeviceCookie(response: NextResponse, token: string) {
  response.cookies.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
}

export function privateInvitationResponse(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
