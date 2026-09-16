import { z } from "zod";
import { getNotifications, markNotificationsRead } from "@/lib/notifications";
import { notificationReadSchema } from "@/lib/notification-types";
import { isSameOriginInvitationRequest } from "@/lib/invitation-policy";
import { reportAccessError } from "@/lib/access-error";

const query = z
  .object({ before: z.coerce.number().int().min(1).max(2147483647).optional() })
  .strict();
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

export async function GET(request: Request) {
  const parsed = query.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success)
    return json({ error: "Invalid notification request." }, 400);
  try {
    const page = await getNotifications(parsed.data.before);
    return page
      ? json(page)
      : json(
          { error: "Sign in or use an invitation to see notifications." },
          401,
        );
  } catch (error) {
    reportAccessError("notifications-read", error);
    return json(
      { error: "Could not load notifications. Please try again." },
      503,
    );
  }
}

export async function POST(request: Request) {
  if (!isSameOriginInvitationRequest(request))
    return json({ error: "Invalid request origin." }, 403);
  let parsed;
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new Error();
    if (Number(request.headers.get("content-length")) > 1024) throw new Error();
    const raw = await request.text();
    if (raw.length > 1024) throw new Error();
    parsed = notificationReadSchema.safeParse(JSON.parse(raw));
  } catch {
    return json({ error: "Invalid notification request." }, 400);
  }
  if (!parsed.success)
    return json({ error: "Invalid notification request." }, 400);
  try {
    if (!(await markNotificationsRead(parsed.data)))
      return json(
        { error: "Sign in or use an invitation to see notifications." },
        401,
      );
    return json({ ok: true });
  } catch (error) {
    reportAccessError("notifications-read-state", error);
    return json(
      { error: "Could not mark notifications as read. Please try again." },
      503,
    );
  }
}
