import Link from "next/link";
import { Crown } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Static copy shared by the page and its prefetched navigation fallback. */
export function AboutContent() {
  return (
    <PageShell
      title="About Mini Heroes Library"
      description="Made for fellow Mini Heroes: Magic Throne players."
      width="max-w-3xl"
    >
      <p className="text-muted-foreground leading-relaxed">
        Explore heroes and divinities, put together a team, and share the
        thinking behind your lineup. Mini Heroes Library brings game references
        and team ideas together in one place.
      </p>

      <Card>
        <CardHeader>
          <Crown className="text-primary mb-2 size-6" aria-hidden />
          <CardTitle>
            <h2 className="text-xl">Created by ✨Cmajor✨</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            Built and maintained by ✨Cmajor✨, with in-game screenshots and
            knowledge gathered from playing Mini Heroes: Magic Throne.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/lineups" className={buttonVariants()}>
          Browse lineups
        </Link>
        <Link href="/heroes" className={buttonVariants({ variant: "outline" })}>
          Explore heroes
        </Link>
      </div>
    </PageShell>
  );
}
