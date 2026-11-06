"use client";

import { useI18n } from "@/lib/i18n/client";
import Image from "next/image";
import { Tabs } from "@base-ui/react/tabs";
import { Fragment, type ReactNode } from "react";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  chestRecipes,
  expandToBase,
  mythicGroups,
  relicBySlug,
  relics,
  type Ingredient,
} from "@/data/relic-fusion";
import { versioned } from "@/lib/asset-version";

const MYTHIC_CHEST = "mythic-chest";

/** A relic icon; the name shows on hover (and is the accessible label). */
function RelicIcon({
  slug,
  count,
  size = 48,
}: {
  slug: string;
  count?: number;
  size?: number;
}) {
  const { gameLabel, t } = useI18n();
  const relic = relicBySlug.get(slug);
  const name = relic ? gameLabel("relic", relic) : t("Mythic chest");
  const label = count ? `${name} ×${count}` : name;
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        aria-label={label}
        className="relative inline-flex shrink-0"
      >
        <Image
          src={versioned(`/relics/${slug}.png`)}
          alt={name}
          width={size}
          height={size}
          className="rounded-md"
        />
        {count && (
          <span className="bg-background/90 absolute -right-1 -bottom-1 min-w-5 rounded border px-1 text-center text-xs leading-4 font-bold tabular-nums">
            {count}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent className="flex-col items-start">
        <span className="font-medium">{label}</span>
        {relic?.recipe && <DirectRecipe recipe={relic.recipe} />}
      </TooltipContent>
    </Tooltip>
  );
}

/** A relic's own one-step recipe, for its tooltip: = icon + icon ×2 … */
function DirectRecipe({ recipe }: { recipe: Ingredient[] }) {
  const { gameLabel } = useI18n();
  return (
    <span className="flex items-center gap-1">
      <span className="opacity-70">=</span>
      {recipe.map((part, index) => {
        const relic = relicBySlug.get(part.slug)!;
        return (
          <span key={part.slug} className="flex items-center gap-1">
            {index > 0 && <span className="opacity-70">+</span>}
            <Image
              src={versioned(`/relics/${part.slug}.png`)}
              alt={gameLabel("relic", relic)}
              width={28}
              height={28}
              className="rounded"
            />
            {part.count > 1 && (
              <span className="font-bold tabular-nums">×{part.count}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

const SLOT = 40;
const catalogOrder = new Map(relics.map((relic, i) => [relic.slug, i]));

/** One fusion, one row per tier: result = parts, = their parts, … down to base relics. */
function Formula({
  result,
  parts,
}: {
  result: ReactNode;
  parts: Ingredient[];
}) {
  const rows = expandToBase(parts);
  return (
    <div className="bg-muted/50 grid grid-cols-[auto_auto_1fr] items-center gap-x-1.5 gap-y-1.5 rounded-lg border p-3">
      <div style={{ gridRow: `span ${rows.length}` }}>{result}</div>
      {rows.map((row, i) => (
        <Fragment key={i}>
          <span className="text-muted-foreground">=</span>
          <div className="flex flex-wrap gap-1.5">
            {[...row]
              .sort(
                (x, y) => catalogOrder.get(x.slug)! - catalogOrder.get(y.slug)!,
              )
              .map((part) => (
                <RelicIcon
                  key={part.slug}
                  slug={part.slug}
                  size={SLOT}
                  count={part.count > 1 ? part.count : undefined}
                />
              ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/** Formula rows for the given relics under a label. */
function FormulaList({ label, slugs }: { label: string; slugs: string[] }) {
  return (
    <div className="flex flex-col gap-3 border-t pt-3">
      <span className="text-sm font-medium">{label}</span>
      {slugs.map((slug) => (
        <Formula
          key={slug}
          result={<RelicIcon slug={slug} />}
          parts={relicBySlug.get(slug)!.recipe!}
        />
      ))}
    </div>
  );
}

/** The two Mythic groups: their chest formulas and the Legend formulas behind them. */
export function RelicGroups() {
  const { t } = useI18n();
  return (
    <PageShell
      title={t("Relics")}
      description={t(
        "Fusion formulas for the two Mythic relic groups, and the Rare and Common relics both groups share.",
      )}
      width="max-w-3xl"
    >
      <Tabs.Root defaultValue={0} className="flex flex-col gap-4">
        <Tabs.List className="bg-muted flex w-fit gap-1 rounded-lg p-1">
          {mythicGroups.map((_, index) => (
            <Tabs.Tab
              key={index}
              value={index}
              className="text-muted-foreground hover:text-foreground data-active:bg-background data-active:text-foreground focus-visible:ring-ring rounded-md px-4 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 data-active:shadow-sm"
            >
              {t("Mythic group {n}", { n: index + 1 })}
            </Tabs.Tab>
          ))}
          <Tabs.Tab
            value="common"
            className="text-muted-foreground hover:text-foreground data-active:bg-background data-active:text-foreground focus-visible:ring-ring rounded-md px-4 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 data-active:shadow-sm"
          >
            {t("Common")}
          </Tabs.Tab>
        </Tabs.List>
        {mythicGroups.map((group, index) => {
          return (
            <Tabs.Panel key={index} value={index}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {group.mythics.map((slug) => (
                        <RelicIcon key={slug} slug={slug} />
                      ))}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-medium">
                      {t("Mythic chest: any 3 different Legends of the group")}
                    </span>
                    {chestRecipes(group.legends).map((recipe, i) => (
                      <Formula
                        key={i}
                        result={<RelicIcon slug={MYTHIC_CHEST} />}
                        parts={recipe}
                      />
                    ))}
                  </div>
                  <FormulaList
                    label={t("Legend formulas")}
                    slugs={group.legends}
                  />
                </CardContent>
              </Card>
            </Tabs.Panel>
          );
        })}
        <Tabs.Panel value="common">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {t("Rare and Common relics")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormulaList
                label={t("Rare formulas")}
                slugs={relics
                  .filter((r) => r.tier === "rare")
                  .map((r) => r.slug)}
              />
              <FormulaList
                label={t("Common formulas")}
                slugs={relics
                  .filter((r) => r.tier === "common")
                  .map((r) => r.slug)}
              />
            </CardContent>
          </Card>
        </Tabs.Panel>
      </Tabs.Root>
    </PageShell>
  );
}
