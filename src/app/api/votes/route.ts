import { NextResponse } from "next/server";
import { getVoteAccess, getVoteSummary, setVote } from "@/lib/votes";
import { voteInputSchema, voteTargetSchema } from "@/lib/vote-types";
import { isSameOriginInvitationRequest } from "@/lib/invitation-policy";
import { privateInvitationResponse } from "@/lib/invitation-cookie";
import { reportAccessError } from "@/lib/access-error";

function json(body: unknown, status = 200) {
  return privateInvitationResponse(NextResponse.json(body, { status }));
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = voteTargetSchema.safeParse({
    kind: params.get("kind"),
    id: Number(params.get("id")),
    page: params.get("page"),
  });
  if (!parsed.success) return json({ error: "Invalid vote request." }, 400);
  try {
    const access = await getVoteAccess(parsed.data);
    if (!access.allowed) return json({ error: "Not found." }, 404);
    return json(await getVoteSummary(parsed.data, access.voterKey));
  } catch (error) {
    reportAccessError("vote-read", error);
    return json({ error: "Could not load votes. Please try again." }, 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginInvitationRequest(request))
    return json({ error: "Invalid request origin." }, 403);
  let parsed;
  try {
    if (Number(request.headers.get("content-length")) > 4096) throw new Error();
    const raw = await request.text();
    if (raw.length > 4096) throw new Error();
    parsed = voteInputSchema.safeParse(JSON.parse(raw));
  } catch {
    return json({ error: "Invalid vote request." }, 400);
  }
  if (!parsed.success) return json({ error: "Invalid vote request." }, 400);
  try {
    const access = await getVoteAccess(parsed.data);
    if (!access.allowed) return json({ error: "Not found." }, 404);
    if (!access.voterKey)
      return json(
        { error: "Use an invitation or sign in as admin to vote." },
        401,
      );
    return json(await setVote(parsed.data, access.voterKey, parsed.data.value));
  } catch (error) {
    reportAccessError("vote-save", error);
    return json({ error: "Could not save your vote. Please try again." }, 503);
  }
}
