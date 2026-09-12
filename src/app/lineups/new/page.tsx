import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { getAllHeroes } from "@/lib/heroes";
import { LineupBuilder } from "./lineup-builder";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Build a lineup" };

export default async function NewLineupPage() {
  const heroes = await getAllHeroes();
  return (
    <PageShell
      title="Build a lineup"
      description="Click heroes to fill the five slots, then write up why the team works."
    >
      <LineupBuilder heroes={heroes} />
    </PageShell>
  );
}
