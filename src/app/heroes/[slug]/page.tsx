import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Hammer } from "lucide-react";
import Image from "next/image";
import { DivinityIcon } from "@/components/divinity-icon";
import { HeroPortrait, RoleBadge } from "@/components/hero-portrait";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArtifactTier } from "@/db/schema";
import { HERO_AWAKENING_STAGES } from "@/data/hero-details";
import { versioned } from "@/lib/asset-version";
import { getHeroBuilds } from "@/lib/builds";
import { getHeroDetail } from "@/lib/heroes";
import { canEditLocally } from "@/lib/local-editing";
import { getAllRuneAttributes } from "@/lib/runes";
import { getAllWeaponAttributes } from "@/lib/weapons";
import { HeroBuilds } from "./hero-builds";
import {
  ARTIFACT_TIER_LABELS,
  ROLE_LABELS,
  SKILL_KIND_LABELS,
} from "@/lib/hero-labels";

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
  const canEdit = await canEditLocally();
  const [builds, runeAttributes, weaponAttributes] = await Promise.all([
    getHeroBuilds(hero.id),
    canEdit ? getAllRuneAttributes() : [],
    canEdit ? getAllWeaponAttributes() : [],
  ]);

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
          <HeroPortrait
            hero={hero}
            divinities={hero.divinities}
            divinitySize={56}
            sizes="260px"
            priority
          />
          {canEdit && (
            <Link
              href={`/lineups/new?hero=${hero.slug}`}
              className={buttonVariants({ variant: "outline" })}
            >
              <Hammer data-icon="inline-start" /> Start a lineup with{" "}
              {hero.name}
            </Link>
          )}
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
              <CardTitle>Talents</CardTitle>
            </CardHeader>
            <CardContent>
              {hero.skills.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No talents recorded for {hero.name} yet.
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {hero.skills.map((skill) => {
                    const bonuses = hero.artifactBonuses.filter(
                      (b) => b.skillId === skill.id,
                    );
                    const cores = hero.cores.filter(
                      (c) => c.skillId === skill.id,
                    );
                    return (
                      <li
                        key={skill.id}
                        className="bg-background flex flex-col gap-2 rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          {skill.iconUrl ? (
                            <Image
                              src={versioned(skill.iconUrl)}
                              alt=""
                              width={48}
                              height={48}
                              className="size-12 shrink-0"
                            />
                          ) : (
                            <span
                              aria-hidden
                              className="bg-muted size-12 shrink-0 rounded-full"
                            />
                          )}
                          <div className="flex min-w-0 flex-col">
                            <span className="text-primary text-xs font-medium tracking-wide uppercase">
                              {SKILL_KIND_LABELS[skill.kind]}
                              {skill.unlockStars
                                ? ` · ${skill.unlockStars}★`
                                : ""}
                            </span>
                            <span className="font-medium">{skill.name}</span>
                          </div>
                        </div>
                        {skill.description && (
                          <p className="text-muted-foreground text-sm">
                            {skill.description}
                          </p>
                        )}
                        {bonuses.map((bonus) => (
                          <p
                            key={bonus.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <TierIcon tier={bonus.tier} />
                            <span>
                              <span className="font-medium">
                                Artifact Bonus:{" "}
                              </span>
                              <span className="text-muted-foreground">
                                {bonus.description}
                              </span>
                            </span>
                          </p>
                        ))}
                        {cores.map((core) => (
                          <p
                            key={core.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Image
                              src={versioned("/icons/core.png")}
                              alt="core"
                              width={22}
                              height={22}
                              className="mt-0.5 size-5.5 shrink-0"
                            />
                            <span>
                              <span className="font-medium">
                                {core.name} Core:{" "}
                              </span>
                              <span className="text-muted-foreground">
                                {core.description}
                              </span>
                            </span>
                          </p>
                        ))}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Awakening skills</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2">
                {HERO_AWAKENING_STAGES.map(({ stage, unlockStars }) => {
                  const skill = hero.awakeningSkills.find(
                    (awakening) => awakening.stage === stage,
                  );
                  return (
                    <li
                      key={stage}
                      className="bg-background flex flex-col gap-2 rounded-lg border p-3"
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="text-primary text-xs font-medium tracking-wide uppercase">
                          Awakening {stage} · {unlockStars}★
                        </span>
                        {skill && (
                          <span className="font-medium">{skill.name}</span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {skill?.description ??
                          `Awakening ${stage} has not been recorded for ${hero.name} yet.`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Artifacts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!hero.artifactName ? (
                <p className="text-muted-foreground text-sm">
                  No artifact recorded for {hero.name} yet.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {hero.artifactIconUrl && (
                      <Image
                        src={versioned(hero.artifactIconUrl)}
                        alt=""
                        width={64}
                        height={64}
                        className="size-16 shrink-0"
                      />
                    )}
                    <span className="text-lg font-medium">
                      {hero.artifactName}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {hero.artifactBonuses.map((bonus) => {
                      const skill = hero.skills.find(
                        (sk) => sk.id === bonus.skillId,
                      );
                      return (
                        <li
                          key={bonus.id}
                          className="bg-background flex items-start gap-3 rounded-lg border p-3"
                        >
                          <TierIcon tier={bonus.tier} size={28} />
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-primary text-xs font-medium tracking-wide uppercase">
                              {ARTIFACT_TIER_LABELS[bonus.tier]}
                              {skill
                                ? " · Artifact Bonus"
                                : " · Artifact Skill"}
                            </span>
                            <span className="font-medium">
                              {skill?.name ?? bonus.name}
                            </span>
                            <p className="text-muted-foreground text-sm">
                              {bonus.description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Divinities</CardTitle>
            </CardHeader>
            <CardContent>
              {hero.divinities.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No divinities recorded for {hero.name} yet.
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {hero.divinities.map((d, i) => (
                    <li key={`${d.id}-${i}`}>
                      <Link
                        href={`/divinities/${d.slug}`}
                        title={d.name}
                        className="flex h-12 items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 transition-colors hover:border-red-500"
                      >
                        <DivinityIcon divinity={d} size={40} />
                        <span className="line-clamp-3 min-w-0 text-sm leading-5 font-medium break-words">
                          {d.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Builds</CardTitle>
            </CardHeader>
            <CardContent>
              <HeroBuilds
                canEdit={canEdit}
                heroId={hero.id}
                heroName={hero.name}
                builds={builds}
                runeAttributes={runeAttributes}
                weaponAttributes={weaponAttributes}
                cores={canEdit ? hero.cores : []}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lineups</CardTitle>
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

function TierIcon({ tier, size = 22 }: { tier: ArtifactTier; size?: number }) {
  return (
    <Image
      src={versioned(`/icons/artifact-${tier}.png`)}
      alt={`${ARTIFACT_TIER_LABELS[tier]} tier`}
      width={size}
      height={size}
      className="mt-0.5 shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
