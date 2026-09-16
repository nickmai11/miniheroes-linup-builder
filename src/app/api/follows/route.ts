import { followInputSchema, followTargetSchema } from "@/lib/follow-types";
import { getFollowAccess, getFollowSummary, setFollow } from "@/lib/follows";
import { isSameOriginInvitationRequest } from "@/lib/invitation-policy";
import { reportAccessError } from "@/lib/access-error";

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = followTargetSchema.safeParse({
    kind: params.get("kind"),
    id: Number(params.get("id")),
  });
  if (!parsed.success) return json({ error: "Invalid follow request." }, 400);
  try {
    const access = await getFollowAccess(parsed.data);
    const summary = await getFollowSummary(
      parsed.data,
      access.key,
      access.allowed,
    );
    if (!access.allowed && !summary.following)
      return json({ error: "Not found." }, 404);
    return json(summary);
  } catch (error) {
    reportAccessError("follow-read", error);
    return json(
      { error: "Could not load follow status. Please try again." },
      503,
    );
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
    parsed = followInputSchema.safeParse(JSON.parse(raw));
  } catch {
    return json({ error: "Invalid follow request." }, 400);
  }
  if (!parsed.success) return json({ error: "Invalid follow request." }, 400);
  try {
    const access = await getFollowAccess(parsed.data);
    if (!access.key)
      return json(
        { error: "Use an invitation or sign in as admin to follow." },
        401,
      );
    // Removing a personal follow remains possible after deletion or access revocation.
    if (parsed.data.following && !access.allowed)
      return json({ error: "Not found." }, 404);
    await setFollow(parsed.data, access.key, parsed.data.following);
    return json(
      await getFollowSummary(parsed.data, access.key, access.allowed),
    );
  } catch (error) {
    reportAccessError("follow-save", error);
    return json(
      { error: "Could not save your follow. Please try again." },
      503,
    );
  }
}
