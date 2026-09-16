"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { Bell, Check, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import type {
  NotificationPage,
  NotificationRead,
} from "@/lib/notification-types";

export function NotificationsButton() {
  const { t, formatDate } = useI18n();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<NotificationPage | null>(null);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const isOpen = useRef(false);
  const isSaving = useRef(false);

  const load = useCallback(async (before?: number) => {
    if (isSaving.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/notifications${before ? `?before=${before}` : ""}`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      );
      if (response.status === 401) {
        setPage(null);
        throw new Error("Sign in or use an invitation to see notifications.");
      }
      if (!response.ok)
        throw new Error("Could not load notifications. Please try again.");
      const result: NotificationPage = await response.json();
      if (!controller.signal.aborted)
        setPage((previous) => ({
          ...result,
          items:
            before && previous
              ? [
                  ...previous.items,
                  ...result.items.filter(
                    (item) => !previous.items.some((old) => old.id === item.id),
                  ),
                ]
              : result.items,
        }));
    } catch (cause) {
      if (!controller.signal.aborted) {
        // Do not keep rendering previously authorized names after a failed recheck.
        setPage(null);
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load notifications. Please try again.",
        );
      }
    } finally {
      if (!controller.signal.aborted) setPending(false);
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && !isOpen.current)
        void load();
    };
    const initial = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      request.current?.abort();
    };
  }, [load]);

  async function markRead(input: NotificationRead) {
    if (isSaving.current) return;
    isSaving.current = true;
    request.current?.abort();
    setPending(false);
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        cache: "no-store",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error();
      isSaving.current = false;
      await load();
    } catch {
      setError("Could not mark notifications as read. Please try again.");
    } finally {
      isSaving.current = false;
      setSaving(false);
    }
  }

  const unread = page?.unreadCount ?? 0;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        isOpen.current = value;
        setOpen(value);
        if (value) void load();
      }}
    >
      <Dialog.Trigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
          />
        }
        aria-label={
          unread
            ? t("Notifications ({count} unread)", { count: unread })
            : t("Notifications")
        }
      >
        <Bell aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="bg-destructive absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup
            initialFocus={closeButton}
            className="bg-background flex h-[min(36rem,calc(100dvh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-xl border shadow-2xl outline-none"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b p-4">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  {t("Notifications")}
                </Dialog.Title>
                <Dialog.Description className="text-muted-foreground mt-1 text-sm">
                  {t("Updates to lineups you follow.")}
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
                aria-label={t("Close notifications")}
              >
                <X aria-hidden="true" />
              </Dialog.Close>
            </div>
            <div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b px-4 py-2">
              <span className="text-muted-foreground text-xs" role="status">
                {t("{count} unread", { count: unread })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!unread || !page?.latestId || saving || pending}
                onClick={() => {
                  if (page?.latestId)
                    void markRead({ throughId: page.latestId });
                }}
              >
                {t("Mark all as read")}
              </Button>
            </div>
            <div
              className="min-h-0 flex-1 [scrollbar-gutter:stable] space-y-3 overflow-y-auto overscroll-contain p-4"
              aria-busy={pending || saving}
            >
              {page?.items.length === 0 && (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  {t(
                    "No notifications yet. New updates to followed lineups will appear here.",
                  )}
                </p>
              )}
              {page && (
                <ul className="space-y-2">
                  {page.items.map((item) => (
                    <li
                      key={item.id}
                      className={`flex items-start gap-2 rounded-lg border p-3 ${item.read ? "" : "bg-primary/5 border-primary/30"}`}
                    >
                      <Link
                        href={item.href}
                        className="hover:text-primary min-w-0 flex-1 rounded-sm text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                        onClick={() => {
                          if (!item.read) void markRead({ id: item.id });
                          isOpen.current = false;
                          setOpen(false);
                        }}
                      >
                        <span
                          className={`block wrap-break-word ${item.read ? "font-medium" : "font-semibold"}`}
                        >
                          {t("{name} was updated", { name: item.name })}
                        </span>
                        <span className="text-muted-foreground mt-1 block text-xs">
                          {item.fields.map((field) => t(field)).join(" · ")}
                        </span>
                        <time
                          className="text-muted-foreground mt-1 block text-xs"
                          dateTime={new Date(item.createdAt).toISOString()}
                        >
                          {formatDate(item.createdAt, true)}
                        </time>
                      </Link>
                      {!item.read && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={saving || pending}
                          aria-label={t("Mark update to {name} as read", {
                            name: item.name,
                          })}
                          onClick={() => void markRead({ id: item.id })}
                        >
                          <Check aria-hidden="true" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {error && (
                <div
                  role="alert"
                  className="text-destructive space-y-2 text-sm"
                >
                  <p>{t(error)}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={saving || pending}
                    onClick={() => void load()}
                  >
                    {t("Retry")}
                  </Button>
                </div>
              )}
              {pending && (
                <p
                  className="text-muted-foreground flex items-center gap-2 text-sm"
                  role="status"
                >
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  {t("Loading notifications…")}
                </p>
              )}
              {page?.nextCursor && !error && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending || saving}
                  onClick={() => void load(page.nextCursor!)}
                >
                  {t("Older notifications")}
                </Button>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
