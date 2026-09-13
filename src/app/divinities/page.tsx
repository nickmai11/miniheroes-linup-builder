import type { Metadata } from "next";
import Link from "next/link";
import { DivinityIcon } from "@/components/divinity-icon";
import { PageShell } from "@/components/page-shell";
import type { Divinity } from "@/db/schema";
import { getAllDivinities } from "@/lib/divinities";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Divinities" };

/** Group by kind, keeping the catalog order for both kinds and members. */
function groupByKind(list: Divinity[]): [string, Divinity[]][] {
  const groups = new Map<string, Divinity[]>();
  for (const d of list) {
    const bucket = groups.get(d.kind);
    if (bucket) bucket.push(d);
    else groups.set(d.kind, [d]);
  }
  return [...groups.entries()];
}

export default async function DivinitiesPage() {
  const divinities = await getAllDivinities();
  const groups = groupByKind(divinities);

  return (
    <PageShell
      title="Divinities"
      description="Stat badges from the divine weapon screen, grouped by the in-game popup title."
    >
      {groups.length === 0 ? (
        <p className="text-muted-foreground">No divinities recorded yet.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(([kind, members]) => (
            <section key={kind} className="flex flex-col gap-3">
              <h2 className="text-primary text-xs font-medium tracking-wide uppercase">
                {kind}
              </h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {members.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/divinities/${d.slug}`}
                      className="bg-card hover:border-primary/60 flex items-center gap-3 rounded-lg border p-3 shadow-xs transition-colors"
                    >
                      <DivinityIcon divinity={d} size={48} />
                      <span className="font-medium">{d.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
