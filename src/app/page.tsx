import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">Mini Heroes lineup builder</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Lineup knowledge base for Mini Heroes: Magic Throne. Pick heroes from
        the pool, save the formation with your notes, and share it.
      </p>
      <ul className="list-inside list-disc space-y-1">
        <li>
          <Link href="/heroes" className="underline">
            /heroes
          </Link>{" "}
          — hero pool with in-game portraits and role badges
        </li>
        <li>
          <Link href="/lineups/new" className="underline">
            /lineups/new
          </Link>{" "}
          — build a 5-hero lineup and write up why it works
        </li>
        <li>
          <Link href="/lineups" className="underline">
            /lineups
          </Link>{" "}
          — saved lineups
        </li>
      </ul>
      <p className="text-xs text-neutral-500">
        Starter routes still available:{" "}
        <Link href="/notes" className="underline">
          /notes
        </Link>
        ,{" "}
        <Link href="/api/health" className="underline">
          /api/health
        </Link>
      </p>
    </main>
  );
}
