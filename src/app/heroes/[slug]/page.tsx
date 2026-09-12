import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Hammer } from "lucide-react";
import { HeroPortrait, RoleBadge } from "@/components/hero-portrait";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getHeroDetail } from "@/lib/heroes";
import { ROLE_LABELS, SKILL_KIND_LABELS } from "@/lib/hero-labels";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/heroes/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const hero = await getHeroDetail(slug);
  return { title: hero?.name ?? "Hero" };
}

export default async function HeroPage(props: PageProps<"/heroes/[slug]">) {
  const { slug } = await props.params;
  const hero = await getHeroDetail(slug);
  if (!hero) notFound();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href="/heroes"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Hero pool
      </Link>

      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-4">
          <HeroPortrait hero={hero} sizes="260px" priority />
          <Link
            href={`/lineups/new?hero=${hero.slug}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Hammer data-icon="inline-start" /> Start a lineup with {hero.name}
          </Link>
        </div>

        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="flex items-center gap-2 text-3xl font-semibold">
              <RoleBadge role={hero.role} size={32} />
              {hero.name}
            </h1>
            <p className="text-muted-foreground">{ROLE_LABELS[hero.role]}</p>
          </header>

          {hero.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{hero.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>
                The six skill slots from the in-game hero card.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hero.skills.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No skills recorded for {hero.name} yet.
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {hero.skills.map((skill) => (
                    <li
                      key={skill.id}
                      className="bg-background flex flex-col gap-1 rounded-lg border p-3"
                    >
                      <span className="text-primary text-xs font-medium tracking-wide uppercase">
                        {SKILL_KIND_LABELS[skill.kind]}
                      </span>
                      <span className="font-medium">{skill.name}</span>
                      {skill.description && (
                        <p className="text-muted-foreground text-sm">
                          {skill.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lineups</CardTitle>
              <CardDescription>
                Saved lineups that use {hero.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hero.lineups.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Not in any saved lineup yet.
                </p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {hero.lineups.map((lineup) => (
                    <li key={lineup.id}>
                      <Link
                        href={`/lineups/${lineup.id}`}
                        className="hover:text-primary flex items-baseline justify-between gap-4 py-2"
                      >
                        <span className="font-medium">{lineup.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {lineup.createdAt.toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
