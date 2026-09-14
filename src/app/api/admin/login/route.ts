import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-policy";
import { privateInvitationResponse } from "@/lib/invitation-cookie";
import { isSameOriginInvitationRequest } from "@/lib/invitation-policy";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(1024),
});

export async function POST(request: Request) {
  const fail = (error: string, status: number) =>
    privateInvitationResponse(NextResponse.json({ error }, { status }));
  if (!isSameOriginInvitationRequest(request))
    return fail("Invalid request origin.", 403);
  let input: unknown;
  try {
    // Bound the body before parsing, including requests without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return fail("Enter your email and password.", 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) {
        await reader.cancel();
        return fail("Login request is too large.", 413);
      }
      chunks.push(value);
    }
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return fail("Enter your email and password.", 400);
  }
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return fail("Enter your email and password.", 400);
  try {
    const supabase = await createClient();
    if (!supabase)
      return fail(
        "Admin login is not configured. Contact the site owner.",
        503,
      );
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      if (error.status === 429)
        return fail("Too many login attempts. Please try again later.", 429);
      if (!error.status || error.status >= 500)
        return fail("Could not sign in. Please try again.", 503);
      return fail("Incorrect email or password.", 401);
    }
    if (!isAdminUser(data.user)) {
      await supabase.auth.signOut({ scope: "local" });
      return fail("This account does not have admin access.", 403);
    }
    return privateInvitationResponse(NextResponse.json({ success: true }));
  } catch {
    return fail("Could not sign in. Please try again.", 503);
  }
}
