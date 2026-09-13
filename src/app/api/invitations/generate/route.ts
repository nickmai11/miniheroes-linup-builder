import { NextResponse } from "next/server";
import { canEditLocally } from "@/lib/local-editing";
import { generateInvitationCode } from "@/lib/invitations";
import { isSameOriginInvitationRequest } from "@/lib/invitation-policy";
import { privateInvitationResponse } from "@/lib/invitation-cookie";

export async function POST(request: Request) {
  if (!(await canEditLocally()))
    return new NextResponse("Not found", { status: 404 });
  if (!isSameOriginInvitationRequest(request)) {
    return privateInvitationResponse(
      NextResponse.json({ error: "Invalid request origin." }, { status: 403 }),
    );
  }
  try {
    const code = await generateInvitationCode();
    return privateInvitationResponse(
      NextResponse.json({ code }, { status: 201 }),
    );
  } catch {
    return privateInvitationResponse(
      NextResponse.json(
        { error: "Could not generate a code. Please try again." },
        { status: 503 },
      ),
    );
  }
}
