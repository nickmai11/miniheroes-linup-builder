"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { History, LoaderCircle, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { ChangeList } from "./change-list";
import type { ChangeKind, ChangePage } from "@/lib/change-types";

export function ChangeHistory({
  kind,
  id,
  name,
}: {
  kind: ChangeKind;
  id: number;
  name: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [page, setPage] = useState<ChangePage | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function load(before?: number) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError("");
    if (!before) setPage(null);
    try {
      const params = new URLSearchParams({ kind, id: String(id) });
      if (before) params.set("before", String(before));
      const response = await fetch(`/api/changes?${params}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error ?? "Could not load changes. Please try again.",
        );
      if (!controller.signal.aborted)
        setPage((previous) => ({
          ...result,
          entries: before
            ? [...(previous?.entries ?? []), ...result.entries]
            : result.entries,
        }));
    } catch (error) {
      if (!controller.signal.aborted)
        setError(
          error instanceof Error
            ? error.message
            : "Could not load changes. Please try again.",
        );
    } finally {
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) void load();
        else request.current?.abort();
      }}
    >
      <Dialog.Trigger
        render={<Button type="button" variant="outline" className="w-fit" />}
      >
        <History aria-hidden="true" />
        {t("Change history")}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup
            initialFocus={closeButton}
            className="bg-background flex h-[min(42rem,calc(100dvh-2rem))] w-full max-w-3xl flex-col overflow-hidden rounded-xl border shadow-2xl outline-none"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b p-4 sm:p-6">
              <div className="min-w-0">
                <Dialog.Title className="text-xl font-semibold">
                  {t("Change history")}
                </Dialog.Title>
                <Dialog.Description className="text-muted-foreground mt-1 text-sm wrap-break-word">
                  {name}
                </Dialog.Description>
              </div>
              <Dialog.Close
                render={
                  <Button
                    ref={closeButton}
                    type="button"
                    variant="ghost"
                    size="icon"
                  />
                }
                aria-label={t("Close change history")}
              >
                <X aria-hidden="true" />
              </Dialog.Close>
            </div>
            <div
              className="min-h-0 flex-1 [scrollbar-gutter:stable] space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6"
              aria-busy={pending}
            >
              {page && <ChangeList entries={page.entries} />}
              {page?.entries.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  {t("History starts with the next saved change.")}
                </p>
              )}
              {error && (
                <p role="alert" className="text-destructive text-sm">
                  {t(error)}
                </p>
              )}
              {pending ? (
                <p
                  role="status"
                  className="text-muted-foreground flex min-h-9 items-center gap-2 text-sm"
                >
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  {t("Loading changes…")}
                </p>
              ) : (
                (error || page?.nextCursor) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-9"
                    onClick={() => void load(page?.nextCursor ?? undefined)}
                  >
                    {t(error ? "Try again" : "Older changes")}
                  </Button>
                )
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
