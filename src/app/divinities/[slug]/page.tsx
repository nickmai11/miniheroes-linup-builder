import { getI18n } from "@/lib/i18n/server";
import { requirePageAccess } from "@/lib/app-access";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DivinityIcon } from "@/components/divinity-icon";
import { HeroName, HeroPortrait } from "@/components/hero-portrait";
import {
  getDivinityBySlug,
  getHeroesWithDivinity,
} from "@/lib/divinity-heroes";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/divinities/[slug]">,
): Promise<Metadata> {
  const { gameLabel, t } = await getI18n();
  await requirePageAccess();
  const { slug } = await props.params;
  const divinity = await getDivinityBySlug(slug);
  return { title: divinity ? gameLabel("divinity", divinity) : t("Divinity") };
}

export default async function DivinityPage(
  props: PageProps<"/divinities/[slug]">,
) {
  const { gameLabel, t } = await getI18n();

  await requirePageAccess();
  const { slug } = await props.params;
  const divinity = await getDivinityBySlug(slug);
  if (!divinity) notFound();
  const heroes = await getHeroesWithDivinity(divinity.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href="/divinities"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> {t("Divinities")}
      </Link>

      <header className="flex items-center gap-4">
        <DivinityIcon divinity={divinity} size={72} />
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">
            {gameLabel("divinity", divinity)}
          </h1>
          <p className="text-muted-foreground">{t(divinity.kind)}</p>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-primary text-xs font-medium tracking-wide uppercase">
          {t("Heroes")}
        </h2>
        {heroes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("No recorded hero has {name} yet.", {
              name: gameLabel("divinity", divinity),
            })}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {heroes.map((hero, i) => (
              <li key={hero.id}>
                <Link
                  href={`/heroes/${hero.slug}`}
                  title={hero.notes || gameLabel("hero", hero)}
                  className="bg-card hover:border-primary/60 flex flex-col gap-1.5 rounded-lg border p-1.5 shadow-xs transition-colors"
                >
                  <HeroPortrait
                    hero={hero}
                    divinities={hero.divinities}
                    sizes="(max-width: 640px) 50vw, 200px"
                    priority={i < 6}
                  />
                  <HeroName
                    hero={hero}
                    className="flex min-h-10 w-full items-center justify-center px-0.5 text-center text-sm font-medium"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
