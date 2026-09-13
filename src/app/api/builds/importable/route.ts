import { z } from "zod";
import { getOtherHeroBuilds } from "@/lib/builds";

const searchSchema = z.object({
  heroId: z.coerce.number().int().positive().max(2147483647),
  q: z.string().trim().max(200).default(""),
  page: z.coerce.number().int().min(0).max(1000000).default(0),
});

export async function GET(request: Request) {
  const parsed = searchSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return Response.json({ error: "Invalid build search" }, { status: 400 });
  }

  try {
    const { heroId, q, page } = parsed.data;
    const results = await getOtherHeroBuilds(heroId, q, page);
    return Response.json(results, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Could not load builds. Please try again." },
      { status: 500 },
    );
  }
}
