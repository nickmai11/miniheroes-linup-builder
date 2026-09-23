import { getAdminId } from "@/lib/admin-access";
import { isSameOriginInvitationRequest } from "@/lib/invitation-policy";
import { reportAccessError } from "@/lib/access-error";
import {
  revokeManagedUser,
  updateManagedNickname,
} from "@/lib/user-management";

const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

async function update(request: Request, revoke: boolean) {
  if (!(await getAdminId()))
    return json({ error: "Sign in as admin to manage users." }, 403);
  if (!isSameOriginInvitationRequest(request))
    return json({ error: "Invalid request origin." }, 403);
  let input: unknown;
  try {
    if (Number(request.headers.get("content-length")) > 4096) throw new Error();
    const raw = await request.text();
    if (raw.length > 4096) throw new Error();
    input = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid user update." }, 400);
  }
  try {
    const { status, ...result } = await (revoke
      ? revokeManagedUser(input)
      : updateManagedNickname(input));
    return json(result, status);
  } catch (error) {
    reportAccessError("user-management", error);
    return json(
      { error: "Could not update this user. Please try again." },
      503,
    );
  }
}

export async function PATCH(request: Request) {
  return update(request, false);
}
export async function DELETE(request: Request) {
  return update(request, true);
}
