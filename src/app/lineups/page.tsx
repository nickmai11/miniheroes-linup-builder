import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { HeroPortrait } from "@/components/hero-portrait";
import { PageShell } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllLineups } from "@/lib/lineups";
import { canEditLocally } from "@/lib/local-editing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lineups" };

export default async function LineupsPage() {
  const [lineups, canEdit] = await Promise.all([
    getAllLineups(),
    canEditLocally(),
  ]);

  return (
    <PageShell
      title="Lineups"
      width="max-w-4xl"
      actions={
        canEdit && (
          <Link href="/lineups/new" className={buttonVariants()}>
            <Plus data-icon="inline-start" /> New lineup
          </Link>
        )
      }
    >
      {lineups.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center">
            No lineups yet.
            {canEdit && (
              <>
                {" "}
                <Link href="/lineups/new" className="text-primary underline">
                  Build the first one.
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {lineups.map((lineup) => (
            <li key={lineup.id}>
              <Link href={`/lineups/${lineup.id}`} className="group block">
                <Card className="group-hover:border-primary/60 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-baseline justify-between gap-4">
                      <span>{lineup.name}</span>
                      <span className="text-muted-foreground text-xs font-normal">
                        {lineup.createdAt.toLocaleDateString()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      {lineup.slots.map((hero, i) => (
                        <div key={i} className="w-16">
                          {hero ? (
                            <HeroPortrait
                              hero={hero}
                              divinities={hero.divinities}
                              sizes="64px"
                            />
                          ) : (
                            <div className="aspect-[81/100] rounded-md border border-dashed" />
                          )}
                        </div>
                      ))}
                    </div>
                    {lineup.description && (
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {lineup.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
