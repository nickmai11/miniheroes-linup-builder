"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { voteStore } from "@/lib/vote-store";

export function ContentVotes({
  kind,
  id,
  name,
  contextPage,
}: {
  kind: "lineup" | "build";
  id: number;
  name: string;
  contextPage?: string;
}) {
  const { t, formatNumber } = useI18n();
  const pathname = usePathname();
  const page = contextPage ?? pathname;
  const router = useRouter();
  const store = useMemo(() => voteStore({ kind, id, page }), [kind, id, page]);
  const { summary, pending, error } = useSyncExternalStore(
    store.subscribe,
    store.snapshot,
    store.serverSnapshot,
  );
  useEffect(() => {
    void store.load();
  }, [store]);

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        role="group"
        aria-label={t("Votes for {name}", { name })}
        aria-busy={pending}
        className="flex items-center gap-1"
      >
        {(
          [
            { value: 1, Icon: ThumbsUp, label: "Like", count: summary?.likes },
            {
              value: -1,
              Icon: ThumbsDown,
              label: "Dislike",
              count: summary?.dislikes,
            },
          ] as const
        ).map(({ value, Icon, label, count }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={summary?.vote === value ? "secondary" : "outline"}
            className={
              summary?.vote === value
                ? "border-primary text-primary border"
                : undefined
            }
            aria-label={t(label === "Like" ? "Like {name}" : "Dislike {name}", {
              name,
            })}
            aria-pressed={summary?.vote === value}
            disabled={!summary?.canVote || pending}
            onClick={async () => {
              await store.vote(summary?.vote === value ? 0 : value);
              if (
                !store.snapshot().error &&
                kind === "lineup" &&
                (pathname === "/lineups" || pathname.startsWith("/heroes/"))
              )
                router.refresh();
            }}
          >
            <Icon data-icon="inline-start" aria-hidden="true" />
            {t(label)}
            <span className="min-w-3 tabular-nums">
              {count === undefined ? "–" : formatNumber(count)}
            </span>
          </Button>
        ))}
      </div>
      {summary && !summary.canVote && (
        <p className="text-muted-foreground text-xs">
          {t("Use an invitation or sign in as admin to vote.")}
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {t(error)}{" "}
          <button
            type="button"
            className="underline"
            disabled={pending}
            onClick={() => void store.load()}
          >
            {t("Retry")}
          </button>
        </p>
      )}
      <span className="sr-only" role="status">
        {summary &&
          t("{likes} likes, {dislikes} dislikes", {
            likes: summary.likes,
            dislikes: summary.dislikes,
          })}
      </span>
    </div>
  );
}
