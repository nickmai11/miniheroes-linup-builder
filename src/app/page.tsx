import { getRegisteredDevice, requirePageAccess } from "@/lib/app-access";
import Link from "next/link";
import { ArrowRight, Hammer, ListOrdered, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { canEditLocally } from "@/lib/local-editing";
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
    title: "Hero pool",
    description: "Explore heroes with recorded talents, artifacts, and builds.",
  },
  {
    href: "/lineups/new",
    icon: Hammer,
    title: "Build a lineup",
    description: "Pick five heroes and write up why the team works.",
  },
  {
    href: "/lineups",
    icon: ListOrdered,
    title: "Saved lineups",
    description: "Browse and share the lineups you have recorded.",
  },
] as const;

export default async function Home() {
  await requirePageAccess();
  const canEdit =
    (await canEditLocally()) && Boolean(await getRegisteredDevice());
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
          Lineup knowledge, straight from the Archive.
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          A place to record which five heroes go together, why, and what they
          counter. Portraits and class badges come from the game itself.
        </p>
        <div>
          <Link
            href={canEdit ? "/lineups/new" : "/lineups"}
            className={buttonVariants({ size: "lg" })}
          >
            {canEdit ? "Build a lineup" : "Browse lineups"}{" "}
            <ArrowRight data-icon="inline-end" />
          </Link>
        </div>
      </section>
      <section
        className={`grid gap-4 ${canEdit ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        {sections.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="group">
            <Card className="group-hover:border-primary/60 h-full transition-colors">
              <CardHeader>
                <Icon className="text-primary mb-2 size-5" aria-hidden />
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </main>
  );
}
