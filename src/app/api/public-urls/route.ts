import { NextResponse } from "next/server";
import { canEditContent } from "@/lib/editing";
import { isSameOriginInvitationRequest } from "@/lib/invitation-policy";
import { privateInvitationResponse } from "@/lib/invitation-cookie";
import { normalizePublicUrl } from "@/lib/public-url-policy";
import { addPublicUrl, removePublicUrl } from "@/lib/public-urls";

async function update(request: Request, remove: boolean) {
  if (!(await canEditContent()))
    return new NextResponse("Not found", { status: 404 });
  const reply = (body: object, status = 200) =>
    privateInvitationResponse(NextResponse.json(body, { status }));
  if (!isSameOriginInvitationRequest(request))
    return reply({ error: "Invalid request origin." }, 403);
  let path: string | null;
  try {
    const body = await request.json();
    path = normalizePublicUrl(body?.url);
  } catch {
    return reply({ error: "Enter a valid page URL." }, 400);
  }
  if (!path)
    return reply(
      {
        error:
          "Enter an app page URL, such as /heroes or /lineups/123. Editing pages and APIs cannot be made public.",
      },
      400,
    );
  try {
    if (remove) await removePublicUrl(path);
    else if (!(await addPublicUrl(path)))
      return reply({ error: "This page is already public." }, 409);
    return reply({ path }, remove ? 200 : 201);
  } catch {
    return reply(
      { error: "Could not update public URLs. Please try again." },
      503,
    );
  }
}

export async function POST(request: Request) {
  return update(request, false);
}
export async function DELETE(request: Request) {
  return update(request, true);
}
