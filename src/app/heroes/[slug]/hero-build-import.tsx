"use client";

import { useI18n } from "@/lib/i18n/client";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ImportableBuildPage } from "@/lib/build-types";
import { cn } from "@/lib/utils";

type Props = {
  heroId: number;
  pending: boolean;
  error: string | null;
  onImport: (sourceBuildId: number) => void;
  onCancel: () => void;
};

export function HeroBuildImport({
  heroId,
  pending,
  error,
  onImport,
  onCancel,
}: Props) {
  const { gameLabel, t } = useI18n();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [result, setResult] = useState<{
    key: string;
    data?: ImportableBuildPage;
    error?: string;
  } | null>(null);
  const search = query.trim();
  const key = JSON.stringify([heroId, search, page, retry]);
  const current = result?.key === key ? result : null;
  const loading = current === null;
  const selected = current?.data?.builds.find((b) => b.id === selectedId);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        try {
          const params = new URLSearchParams({
            heroId: String(heroId),
            q: search,
            page: String(page),
          });
          const response = await fetch(`/api/builds/importable?${params}`, {
            signal: controller.signal,
            cache: "no-store",
          });
          if (!response.ok) throw new Error("Build search failed");
          const data: ImportableBuildPage = await response.json();
          if (!controller.signal.aborted) setResult({ key, data });
        } catch {
          if (!controller.signal.aborted) {
            setResult({
              key,
              error: "Could not load builds. Please try again.",
            });
          }
        }
      },
      search ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [heroId, search, page, key]);

  function changePage(next: number) {
    setSelectedId(null);
    setPage(next);
  }

  return (
    <form
      id="hero-build-import"
      aria-label={t("Import a build from another hero")}
      className="bg-background flex min-w-0 flex-col gap-4 rounded-lg border p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (selected && !pending) onImport(selected.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) {
          event.preventDefault();
          onCancel();
        }
      }}
    >
      <p className="text-muted-foreground text-sm">
        {t(
          "Copy a build from another hero. Matching cores use this hero's own bonuses; cores not recorded for this hero are skipped. You can edit your copy after importing.",
        )}
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="import-build-search">{t("Search builds")}</Label>
        <div className="relative">
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          />
          <Input
            id="import-build-search"
            type="search"
            placeholder={t("Search by hero or build name…")}
            className="pl-8"
            autoFocus
            maxLength={200}
            disabled={pending}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
              setSelectedId(null);
            }}
          />
        </div>
      </div>

      <div
        aria-busy={loading}
        className="h-64 overflow-y-auto overscroll-contain rounded-lg border"
      >
        {loading ? (
          <p role="status" className="text-muted-foreground p-4 text-sm">
            {t("Loading builds…")}
          </p>
        ) : current.error ? (
          <div className="flex flex-col items-start gap-3 p-4">
            <p role="alert" className="text-destructive text-sm">
              {t(current.error)}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRetry((v) => v + 1)}
            >
              {t("Try again")}
            </Button>
          </div>
        ) : current.data?.builds.length === 0 ? (
          <p role="status" className="text-muted-foreground p-4 text-sm">
            {search
              ? t("No builds match your search.")
              : page > 0
                ? t("No more builds. Go back to the previous page.")
                : t("No builds from other heroes yet.")}
          </p>
        ) : (
          <fieldset disabled={pending} className="min-w-0 disabled:opacity-60">
            <legend className="sr-only">{t("Choose a build to import")}</legend>
            {current.data?.builds.map((build) => (
              <label
                key={build.id}
                className={cn(
                  "hover:bg-muted/50 focus-within:bg-muted flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0",
                  selectedId === build.id && "bg-primary/10",
                  pending && "cursor-default",
                )}
              >
                <input
                  type="radio"
                  name="source-build"
                  value={build.id}
                  checked={selectedId === build.id}
                  onChange={() => setSelectedId(build.id)}
                  className="accent-primary focus-visible:ring-ring/50 size-4 shrink-0 focus-visible:ring-3"
                />
                <span className="flex min-w-0 flex-col gap-0.5 [overflow-wrap:anywhere]">
                  <span className="text-sm font-medium">{build.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {gameLabel("hero", {
                      name: build.heroName,
                      slug: build.heroSlug,
                    })}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        )}
      </div>

      {(page > 0 || current?.data?.hasNextPage) && (
        <nav
          aria-label={t("Build search pages")}
          className="flex items-center justify-between gap-2"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || loading || page === 0}
            onClick={() => changePage(page - 1)}
          >
            <ChevronLeft data-icon="inline-start" /> {t("Previous")}
          </Button>
          <span className="text-muted-foreground text-xs">
            {t("Page {page}", { page: page + 1 })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || loading || !current?.data?.hasNextPage}
            onClick={() => changePage(page + 1)}
          >
            {t("Next")} <ChevronRight data-icon="inline-end" />
          </Button>
        </nav>
      )}

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {t(error)}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending || !selected}>
          {pending ? t("Importing…") : t("Import build")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={onCancel}
        >
          {t("Cancel")}
        </Button>
      </div>
    </form>
  );
}
