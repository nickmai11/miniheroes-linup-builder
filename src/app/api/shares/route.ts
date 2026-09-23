import { getShareRecipients, saveShareRecipients } from "@/lib/content-sharing";
import { shareTargetSchema } from "@/lib/share-input";
import { isSameOriginInvitationRequest } from "@/lib/invitation-policy";
import { reportAccessError } from "@/lib/access-error";
import { revalidatePath } from "next/cache";
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = shareTargetSchema.safeParse({
    kind: params.get("kind"),
    id: Number(params.get("id")),
  });
  if (!parsed.success) return json({ error: "Invalid sharing request." }, 400);
  try {
    const recipients = await getShareRecipients(parsed.data);
    return recipients
      ? json({ recipients })
      : json({ error: "Not found." }, 404);
  } catch (error) {
    reportAccessError("share-read", error);
    return json({ error: "Could not load nicknames. Please try again." }, 503);
  }
}
export async function POST(request: Request) {
  if (!isSameOriginInvitationRequest(request))
    return json({ error: "Invalid request origin." }, 403);
  let input: unknown;
  try {
    if (Number(request.headers.get("content-length")) > 32768)
      throw new Error();
    const raw = await request.text();
    if (raw.length > 32768) throw new Error();
    input = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid sharing request." }, 400);
  }
  try {
    const { status, ...result } = await saveShareRecipients(input);
    if (status === 200) revalidatePath("/", "layout");
    return json(result, status);
  } catch (error) {
    reportAccessError("share-save", error);
    return json({ error: "Could not save sharing. Please try again." }, 503);
  }
}
