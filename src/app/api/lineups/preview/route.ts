import { z } from "zod";
import { getRegisteredDevice, hasAppAccess } from "@/lib/app-access";
import { isPublicPage } from "@/lib/public-urls";
import { heroLineupPreviewIds } from "@/lib/lineup-preview-access";
import { getLineup } from "@/lib/lineups";
import { reportAccessError } from "@/lib/access-error";

const inputSchema = z.object({
  id: z.coerce.number().int().min(1).max(2147483647),
  hero: z
    .string()
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: Request) {
  const parsed = inputSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success)
    return json({ error: "Invalid lineup preview request." }, 400);
  try {
    const { id, hero } = parsed.data;
    const fullAccess = await hasAppAccess();
    const device = fullAccess ? null : await getRegisteredDevice();
    if (
      !fullAccess &&
      !device?.sharedHeroSlugs?.includes(hero) &&
      !(await isPublicPage(`/heroes/${hero}`))
    )
      return json(
        { error: "Open the lineup with an invitation to view it." },
        403,
      );
    const ids = await heroLineupPreviewIds(hero, device?.lineupIds, fullAccess);
    if (!ids.includes(id))
      return json(
        { error: "Open the lineup with an invitation to view it." },
        403,
      );
    const lineup = await getLineup(id);
    if (!lineup)
      return json({ error: "This lineup is no longer available." }, 404);
    return json({
      id: lineup.id,
      name: lineup.name,
      description: lineup.description,
      slots: lineup.slots,
      fishes: lineup.fishes,
      // Nested build voting uses the lineup whose contents are being previewed.
      contextPage:
        !fullAccess && (await isPublicPage("/lineups"))
          ? "/lineups"
          : `/lineups/${id}`,
    });
  } catch (error) {
    reportAccessError("lineup-preview", error);
    return json(
      { error: "Could not load the lineup preview. Please try again." },
      503,
    );
  }
}
