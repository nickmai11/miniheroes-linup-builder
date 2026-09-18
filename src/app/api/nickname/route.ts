import { saveViewerNickname } from "@/lib/viewer-profile";
import { isSameOriginInvitationRequest } from "@/lib/invitation-policy";
import { reportAccessError } from "@/lib/access-error";

const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

export async function POST(request: Request) {
  if (!isSameOriginInvitationRequest(request))
    return json({ error: "Invalid request origin." }, 403);
  let input: unknown;
  try {
    if (Number(request.headers.get("content-length")) > 4096) throw new Error();
    const raw = await request.text();
    if (raw.length > 4096) throw new Error();
    input = JSON.parse(raw);
  } catch {
    return json({ error: "Enter your nickname." }, 400);
  }
  try {
    const { status, ...result } = await saveViewerNickname(input);
    return json(result, status);
  } catch (error) {
    reportAccessError("nickname-save", error);
    return json(
      { error: "Could not save your nickname. Please try again." },
      503,
    );
  }
}
