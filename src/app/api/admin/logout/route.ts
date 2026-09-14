import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { privateInvitationResponse } from "@/lib/invitation-cookie";
import { isSameOriginInvitationRequest } from "@/lib/invitation-policy";

export async function POST(request: Request) {
  if (!isSameOriginInvitationRequest(request)) {
    return privateInvitationResponse(
      NextResponse.json({ error: "Invalid request origin." }, { status: 403 }),
    );
  }
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
    return privateInvitationResponse(NextResponse.json({ success: true }));
  } catch {
    return privateInvitationResponse(
      NextResponse.json(
        { error: "Could not sign out. Please try again." },
        { status: 503 },
      ),
    );
  }
}
