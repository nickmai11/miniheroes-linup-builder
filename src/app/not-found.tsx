import Link from "next/link";
import { Compass, Home, ListOrdered } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center sm:px-6">
      <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-2xl">
        <Compass className="size-8" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-primary text-sm font-semibold tracking-widest">
          404
        </p>
        <h1 className="text-3xl font-semibold">{t("Page not found")}</h1>
        <p className="text-muted-foreground">
          {t("This page does not exist or is no longer available.")}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants()}>
          <Home data-icon="inline-start" />
          {t("Go home")}
        </Link>
        <Link
          href="/lineups"
          className={buttonVariants({ variant: "outline" })}
        >
          <ListOrdered data-icon="inline-start" />
          {t("Browse lineups")}
        </Link>
      </div>
    </main>
  );
}
