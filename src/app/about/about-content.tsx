"use client";

import { useI18n } from "@/lib/i18n/client";
import Link from "next/link";
import { Crown, ExternalLink, Heart } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Static copy shared by the page and its prefetched navigation fallback. */
export function AboutContent() {
  const { t } = useI18n();

  return (
    <PageShell
      title={t("About Mini Heroes Library")}
      description={t("Made for fellow Mini Heroes: Magic Throne players.")}
      width="max-w-3xl"
    >
      <p className="text-muted-foreground leading-relaxed">
        {t(
          "Explore heroes and divinities, put together a team, and share the thinking behind your lineup. Mini Heroes Library brings game references and team ideas together in one place.",
        )}
      </p>

      <Card>
        <CardHeader>
          <Crown className="text-primary mb-2 size-6" aria-hidden />
          <CardTitle>
            <h2 className="text-xl">{t("Created by ✨Cmajor✨")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {t(
              "Built and maintained by ✨Cmajor✨, with in-game screenshots and knowledge gathered from playing Mini Heroes: Magic Throne.",
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Heart className="text-primary mb-2 size-6" aria-hidden />
          <CardTitle>
            <h2 className="text-xl">{t("Support the creator")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground leading-relaxed">
            {t(
              "Enjoying Mini Heroes Library? You can sponsor ✨Cmajor✨ with an in-game top-up. Thank you for your support!",
            )}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              {t("Player ID:")}{" "}
              <span className="text-foreground font-mono">15298308</span>
            </p>
            <a
              href="https://pay.maxngame.com/miniheroes_global/#/?role_id=15298308&lang=en"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants()}
            >
              {t("Sponsor via top-up")}{" "}
              <ExternalLink data-icon="inline-end" aria-hidden />
              <span className="sr-only"> {t("(opens in a new tab)")}</span>
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/lineups" className={buttonVariants()}>
          {t("Browse lineups")}
        </Link>
        <Link href="/heroes" className={buttonVariants({ variant: "outline" })}>
          {t("Explore heroes")}
        </Link>
      </div>
    </PageShell>
  );
}
