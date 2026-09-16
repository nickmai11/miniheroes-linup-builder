"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { followStore } from "@/lib/follow-store";
import type { FollowTarget } from "@/lib/follow-types";

export function FollowButton({
  kind,
  id,
  name,
}: FollowTarget & { name: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const store = useMemo(() => followStore({ kind, id }), [kind, id]);
  const { summary, pending, error } = useSyncExternalStore(
    store.subscribe,
    store.snapshot,
    store.serverSnapshot,
  );
  useEffect(() => {
    void store.load();
  }, [store]);
  const Icon = summary?.following ? BookmarkCheck : Bookmark;
  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={summary?.following ? "secondary" : "outline"}
        size="sm"
        className="min-w-36"
        aria-pressed={summary?.following ?? false}
        aria-busy={pending}
        aria-label={t(
          summary?.following ? "Unfollow {name}" : "Follow {name}",
          { name },
        )}
        disabled={
          pending || !summary || (!summary.canFollow && !summary.following)
        }
        onClick={async () => {
          await store.follow(!summary?.following);
          if (!store.snapshot().error) router.refresh();
        }}
      >
        <Icon aria-hidden="true" />
        {t(summary?.following ? "Following" : "Follow")}
      </Button>
      {summary && !summary.canFollow && !summary.following && (
        <p className="text-muted-foreground max-w-xs text-xs">
          {t("Use an invitation or sign in as admin to follow.")}
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive max-w-xs text-xs">
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
    </div>
  );
}
