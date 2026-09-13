import { NextRequest, NextResponse } from "next/server";
import { redeemInvitationCode } from "@/lib/invitations";
import {
  DEVICE_COOKIE,
  INVALID_INVITATION,
  invitationDestination,
  isDeviceToken,
  isSameOriginInvitationRequest,
} from "@/lib/invitation-policy";
import {
  privateInvitationResponse,
  setDeviceCookie,
} from "@/lib/invitation-cookie";

export async function POST(request: NextRequest) {
  const reply = (error: string, status: number) =>
    privateInvitationResponse(NextResponse.json({ error }, { status }));
  if (!isSameOriginInvitationRequest(request))
    return reply("Invalid request origin.", 403);
  const token = request.cookies.get(DEVICE_COOKIE)?.value;
  if (!isDeviceToken(token))
    return reply("Allow cookies and reload this page to continue.", 400);
  // Bound the credential request before attempting to parse or query it.
  if (Number(request.headers.get("content-length")) > 8192)
    return reply("Invalid request.", 400);
  let body: { code?: unknown; next?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > 8192) return reply("Invalid request.", 400);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body))
      return reply("Invalid request.", 400);
  } catch {
    return reply("Invalid request.", 400);
  }
  try {
    if (!(await redeemInvitationCode(body.code, token)))
      return reply(INVALID_INVITATION, 400);
    const response = NextResponse.json({
      destination: invitationDestination(body.next),
    });
    setDeviceCookie(response, token);
    return privateInvitationResponse(response);
  } catch {
    return reply("Could not check your invitation. Please try again.", 503);
  }
}
