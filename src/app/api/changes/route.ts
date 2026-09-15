import { z } from "zod";
import { getChangeHistory } from "@/lib/changes";
import { reportAccessError } from "@/lib/access-error";

const id = z.coerce.number().int().min(1).max(2147483647);
const input = z.object({
  kind: z.enum(["lineup", "build"]),
  id,
  before: id.optional(),
});
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

export async function GET(request: Request) {
  const parsed = input.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) return json({ error: "Invalid history request." }, 400);
  try {
    const { kind, id, before } = parsed.data;
    const history = await getChangeHistory(kind, id, before);
    return history
      ? json(history)
      : json({ error: "This history is not available." }, 403);
  } catch (error) {
    reportAccessError("changes", error);
    return json({ error: "Could not load changes. Please try again." }, 503);
  }
}
