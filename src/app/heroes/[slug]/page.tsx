import { ContentVotes } from "@/components/content-votes";
import { LineupPopover } from "@/components/lineup-popover";
import { getI18n } from "@/lib/i18n/server";
import { FollowButton } from "@/components/follow-button";
import { hasAppAccess, requirePageAccess } from "@/lib/app-access";
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
import { canEditContent } from "@/lib/editing";
import { getAllRuneAttributes } from "@/lib/runes";
import { getAllWeaponAttributes } from "@/lib/weapons";
import { HeroBuilds } from "./hero-builds";
import { InfoPopover } from "@/components/info-popover";
import { CoreDetails } from "@/components/core-popover";
import {
  ARTIFACT_TIER_LABELS,
  ROLE_LABELS,
  SKILL_KIND_LABELS,
} from "@/lib/hero-labels";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/heroes/[slug]">,
): Promise<Metadata> {
  const { gameLabel, t } = await getI18n();
  await requirePageAccess();
  const { slug } = await props.params;
  const hero = await getHeroDetail(slug);
  return { title: hero ? gameLabel("hero", hero) : t("Hero") };
}

export default async function HeroPage(props: PageProps<"/heroes/[slug]">) {
  const { gameLabel, t } = await getI18n();

  await requirePageAccess();
  const { slug } = await props.params;
  const hero = await getHeroDetail(slug);
  if (!hero) notFound();
  const canEdit = (await canEditContent()) && (await hasAppAccess());
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
        <ArrowLeft className="size-4" /> {t("Heroes")}
      </Link>

      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-4 md:sticky md:top-20 md:self-start">
          <HeroPortrait
            hero={hero}
            hasBuild={builds.length > 0}
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
              <Hammer data-icon="inline-start" />{" "}
              {t("Start a lineup with {name}", {
                name: gameLabel("hero", hero),
              })}
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="flex items-center gap-2 text-3xl font-semibold">
              <RoleBadge role={hero.role} size={32} />
              {gameLabel("hero", hero)}
            </h1>
            <p className="text-muted-foreground">{t(ROLE_LABELS[hero.role])}</p>
            <FollowButton
              kind="hero"
              id={hero.id}
              name={gameLabel("hero", hero)}
            />
          </header>

          {hero.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{hero.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("Talents")}</CardTitle>
            </CardHeader>
            <CardContent>
              {hero.skills.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("No talents recorded for {name} yet.", {
                    name: gameLabel("hero", hero),
                  })}
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
                              {t(SKILL_KIND_LABELS[skill.kind])}
                              {skill.unlockStars
                                ? ` · ${skill.unlockStars}★`
                                : ""}
                            </span>
                            <span className="font-medium">
                              {gameLabel("skill", skill)}
                            </span>
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
                                {t("Artifact Bonus:")}
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
                              alt={t("core")}
                              width={22}
                              height={22}
                              className="mt-0.5 size-5.5 shrink-0"
                            />
                            <span>
                              <InfoPopover
                                label={t("{name} skill", {
                                  name: gameLabel("core", core),
                                })}
                                trigger={
                                  <button
                                    type="button"
                                    className="font-medium underline decoration-dotted underline-offset-4"
                                  >
                                    {t("{name} Core", {
                                      name: gameLabel("core", core),
                                    })}
                                  </button>
                                }
                              >
                                <CoreDetails core={{ ...core, skill }} />
                              </InfoPopover>
                              {": "}
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
              <CardTitle>{t("Awakening skills")}</CardTitle>
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
                          {t("Awakening")} {stage} · {unlockStars}★
                        </span>
                        {skill && (
                          <span className="font-medium">
                            {gameLabel("skill", skill)}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {skill?.description ??
                          t(
                            "Awakening {stage} has not been recorded for {name} yet.",
                            { stage, name: gameLabel("hero", hero) },
                          )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("Artifacts")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!hero.artifactName ? (
                <p className="text-muted-foreground text-sm">
                  {t("No artifact recorded for {name} yet.", {
                    name: gameLabel("hero", hero),
                  })}
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
                      {gameLabel("artifact", hero.artifactName)}
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
                              {t(ARTIFACT_TIER_LABELS[bonus.tier])}
                              {skill
                                ? ` · ${t("Artifact Bonus")}`
                                : ` · ${t("Artifact Skill")}`}
                            </span>
                            <span className="font-medium">
                              {skill
                                ? gameLabel("skill", skill)
                                : bonus.name
                                  ? gameLabel("skill", bonus.name)
                                  : ""}
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
              <CardTitle>{t("Divinities")}</CardTitle>
            </CardHeader>
            <CardContent>
              {hero.divinities.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("No divinities recorded for {name} yet.", {
                    name: gameLabel("hero", hero),
                  })}
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {hero.divinities.map((d, i) => (
                    <li key={`${d.id}-${i}`}>
                      <Link
                        href={`/divinities/${d.slug}`}
                        title={gameLabel("divinity", d)}
                        className="flex h-12 items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1 transition-colors hover:border-red-500"
                      >
                        <DivinityIcon divinity={d} size={32} />
                        <span className="line-clamp-2 min-w-0 text-sm leading-4 font-medium break-words">
                          {gameLabel("divinity", d)}
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
              <CardTitle>{t("Builds")}</CardTitle>
            </CardHeader>
            <CardContent>
              <HeroBuilds
                canEdit={canEdit}
                heroId={hero.id}
                heroName={gameLabel("hero", hero)}
                builds={builds}
                runeAttributes={runeAttributes}
                weaponAttributes={weaponAttributes}
                cores={
                  canEdit
                    ? hero.cores.map((core) => ({
                        ...core,
                        skill:
                          hero.skills.find(
                            (skill) => skill.id === core.skillId,
                          ) ?? null,
                      }))
                    : []
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("Lineups")}</CardTitle>
            </CardHeader>
            <CardContent>
              {hero.lineups.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("Not in any saved lineup yet.")}
                </p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {hero.lineups.map((lineup) => (
                    <li key={lineup.id}>
                      <LineupPopover
                        lineup={{
                          id: lineup.id,
                          name: lineup.name,
                          createdAt: lineup.createdAt,
                        }}
                        heroSlug={hero.slug}
                      />
                      <div className="pb-2">
                        <ContentVotes
                          kind="lineup"
                          id={lineup.id}
                          name={lineup.name}
                        />
                      </div>
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

async function TierIcon({
  tier,
  size = 22,
}: {
  tier: ArtifactTier;
  size?: number;
}) {
  const { t } = await getI18n();

  return (
    <Image
      src={versioned(`/icons/artifact-${tier}.png`)}
      alt={t("{tier} tier", { tier: t(ARTIFACT_TIER_LABELS[tier]) })}
      width={size}
      height={size}
      className="mt-0.5 shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
