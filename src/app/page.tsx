import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">nextjs-fullstack</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Next.js App Router, TypeScript, Tailwind, Drizzle ORM on SQLite.
      </p>
      <ul className="list-inside list-disc space-y-1">
        <li>
          <Link href="/notes" className="underline">
            /notes
          </Link>{" "}
          — server components + server actions writing to the DB
        </li>
        <li>
          <Link href="/api/notes" className="underline">
            /api/notes
          </Link>{" "}
          — REST route handler (GET, POST)
        </li>
        <li>
          <Link href="/api/health" className="underline">
            /api/health
          </Link>{" "}
          — DB health check
        </li>
      </ul>
    </main>
  );
}
