import { getI18n } from "@/lib/i18n/server";
import { hasAppAccess, requirePageAccess } from "@/lib/app-access";
import Link from "next/link";
import {
  ArrowRight,
  Fish,
  Hammer,
  ListOrdered,
  Sparkles,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { canEditContent } from "@/lib/editing";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SECTIONS = [
  {
    href: "/heroes",
    icon: Users,
    title: "Heroes",
    description:
      "Explore recorded talents, artifacts, awakenings, and builds with rune, weapon, and core priorities.",
  },
  {
    href: "/divinities",
    icon: Sparkles,
    title: "Divinities",
    description:
      "Browse mythic divinities by category and find heroes with each recorded divinity.",
  },
  {
    href: "/fishes",
    icon: Fish,
    title: "Fishes",
    description:
      "Explore fish stats, rarities, fishing areas, and baits for your lineups.",
  },
  {
    href: "/lineups",
    icon: ListOrdered,
    title: "Saved lineups",
    description:
      "View team notes, assigned hero builds, pets, relics, and fishes. Share a lineup by link.",
  },
  {
    href: "/lineups/new",
    icon: Hammer,
    title: "Build a lineup",
    description:
      "Choose five heroes, assign builds, pets, and relics, then add fishes and team notes.",
  },
] as const;

export default async function Home() {
  const { t } = await getI18n();

  await requirePageAccess();
  const canEdit = (await canEditContent()) && (await hasAppAccess());
  const sections = SECTIONS.filter(
    ({ href }) => canEdit || href !== "/lineups/new",
  );
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6">
      <section className="flex flex-col gap-4">
        <p className="text-primary text-sm font-medium">
          Mini Heroes: Magic Throne
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold">
          {t("Heroes, builds, and lineups in one place.")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {t(
            "Explore hero details and saved builds, look up mythic divinities, and browse five-hero teams with their pets, relics, and fishes.",
          )}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={canEdit ? "/lineups/new" : "/lineups"}
            className={buttonVariants({ size: "lg" })}
          >
            {canEdit ? t("Build a lineup") : t("Browse lineups")}{" "}
            <ArrowRight data-icon="inline-end" />
          </Link>
          <Link
            href="/heroes"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {t("Explore heroes")}
          </Link>
        </div>
      </section>
      <section
        aria-label={t("Explore the library")}
        className={`grid gap-4 sm:grid-cols-2 ${canEdit ? "lg:grid-cols-3 xl:grid-cols-5" : "lg:grid-cols-4"}`}
      >
        {sections.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group focus-visible:outline-ring rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Card className="group-hover:ring-primary/60 h-full transition-shadow">
              <CardHeader>
                <Icon className="text-primary mb-2 size-5" aria-hidden />
                <CardTitle>
                  <h2>{t(title)}</h2>
                </CardTitle>
                <CardDescription>{t(description)}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
      <p className="text-muted-foreground max-w-2xl text-sm">
        {t(
          "Game details and artwork are recorded from in-game screenshots. Coverage varies by hero as more details are added.",
        )}
      </p>
    </main>
  );
}
