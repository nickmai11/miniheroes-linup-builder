import { getI18n } from "@/lib/i18n/server";
import { requirePageAccess } from "@/lib/app-access";
import type { Metadata } from "next";
import Link from "next/link";
import { DivinityIcon } from "@/components/divinity-icon";
import { PageShell } from "@/components/page-shell";
import type { Divinity } from "@/db/schema";
import { getAllDivinities } from "@/lib/divinities";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return { title: t("Divinities") };
}

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
  const { t } = await getI18n();

  await requirePageAccess();
  const divinities = await getAllDivinities();
  const groups = groupByKind(divinities);

  return (
    <PageShell
      title={t("Divinities")}
      description={t(
        "Stat badges from the divine weapon screen, grouped by category.",
      )}
    >
      {groups.length === 0 ? (
        <p className="text-muted-foreground">
          {t("No divinities recorded yet.")}
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(([kind, members]) => (
            <section key={t(kind)} className="flex flex-col gap-3">
              <h2 className="text-primary text-xs font-medium tracking-wide uppercase">
                {t(kind)}
              </h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {members.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/divinities/${d.slug}`}
                      title={d.name}
                      className="bg-card hover:border-primary/60 flex h-12 items-center gap-2 rounded-lg border px-3 py-1 shadow-xs transition-colors"
                    >
                      <DivinityIcon divinity={d} size={32} />
                      <span className="line-clamp-2 min-w-0 text-sm leading-4 font-medium break-words">
                        {d.name}
                      </span>
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
