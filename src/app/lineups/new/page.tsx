import Link from "next/link";
import { getAllHeroes } from "@/lib/heroes";
import { LineupBuilder } from "./lineup-builder";

export const dynamic = "force-dynamic";

export default async function NewLineupPage() {
  const heroes = await getAllHeroes();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Build a lineup</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/heroes" className="underline">
            Hero pool
          </Link>
          <Link href="/lineups" className="underline">
            Saved lineups
          </Link>
        </nav>
      </header>
      <LineupBuilder heroes={heroes} />
    </main>
  );
}
