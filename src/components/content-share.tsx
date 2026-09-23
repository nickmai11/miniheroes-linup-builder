"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { LoaderCircle, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/client";
import type { ShareRecipient, ShareTarget } from "@/lib/share-input";

export function ContentShare({ kind, id }: ShareTarget) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState<ShareRecipient[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const requestVersion = useRef(0);
  const saving = useRef(false);
  async function load() {
    const version = ++requestVersion.current;
    setLoading(true);
    setLoaded(false);
    setError("");
    setRecipients([]);
    try {
      const response = await fetch(`/api/shares?kind=${kind}&id=${id}`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (version !== requestVersion.current) return;
      setRecipients(result.recipients);
      setSelected(
        new Set(
          result.recipients
            .filter((r: ShareRecipient) => r.selected)
            .map((r: ShareRecipient) => r.id),
        ),
      );
      setLoaded(true);
    } catch {
      if (version === requestVersion.current)
        setError("Could not load nicknames. Please try again.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }
  async function save() {
    if (!loaded || saving.current) return;
    saving.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, recipientIds: [...selected] }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Could not save sharing. Please try again.");
        return;
      }
      setOpen(false);
      setNotice("Sharing saved.");
      router.refresh();
    } catch {
      setError("Could not save sharing. Please try again.");
    } finally {
      saving.current = false;
      setPending(false);
    }
  }
  const visible = recipients.filter((r) =>
    r.nickname.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <div className="flex flex-col gap-1">
      <Dialog.Root
        open={open}
        onOpenChange={(next, event) => {
          if (saving.current) {
            event.cancel();
            return;
          }
          setOpen(next);
          if (next) {
            setQuery("");
            setNotice("");
            void load();
          } else {
            requestVersion.current++;
            setLoading(false);
          }
        }}
      >
        <Dialog.Trigger render={<Button type="button" variant="outline" />}>
          <Share2 aria-hidden />
          {t("Share")}
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[80] bg-black/50" />
          <Dialog.Viewport className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4">
            <Dialog.Popup className="bg-background text-foreground flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-4 rounded-2xl border p-5 shadow-2xl outline-none">
              <div className="flex items-start justify-between gap-3">
                <Dialog.Title className="text-lg font-semibold">
                  {t(kind === "lineup" ? "Share lineup" : "Share build")}
                </Dialog.Title>
                <Dialog.Close
                  render={<Button variant="ghost" size="icon-sm" />}
                  aria-label={t("Close")}
                  disabled={pending}
                >
                  <X aria-hidden />
                </Dialog.Close>
              </div>
              <Dialog.Description className="text-muted-foreground text-sm">
                {t(
                  "Choose who can view this item. Uncheck a nickname to remove shared access.",
                )}
              </Dialog.Description>
              <Input
                aria-label={t("Search nicknames")}
                placeholder={t("Search nicknames")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading || pending}
              />
              <form
                className="flex min-h-0 flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void save();
                }}
              >
                <div
                  className="min-h-24 overflow-y-auto overscroll-contain"
                  aria-busy={loading}
                >
                  {loading ? (
                    <p
                      role="status"
                      className="text-muted-foreground flex items-center gap-2 text-sm"
                    >
                      <LoaderCircle
                        className="size-4 animate-spin"
                        aria-hidden
                      />
                      {t("Loading nicknames…")}
                    </p>
                  ) : !loaded ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void load()}
                    >
                      {t("Retry")}
                    </Button>
                  ) : recipients.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      {t(
                        "No other nicknames yet. Users will appear here after choosing a nickname.",
                      )}
                    </p>
                  ) : visible.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      {t("No matching nicknames.")}
                    </p>
                  ) : (
                    visible.map((recipient) => (
                      <label
                        key={recipient.id}
                        className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md px-2 py-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="accent-primary size-4 shrink-0"
                          checked={selected.has(recipient.id)}
                          disabled={pending}
                          onChange={(e) =>
                            setSelected((previous) => {
                              const next = new Set(previous);
                              if (e.target.checked) next.add(recipient.id);
                              else next.delete(recipient.id);
                              return next;
                            })
                          }
                        />
                        <span className="min-w-0 break-words">
                          {recipient.nickname}
                          {recipients.some(
                            (other) =>
                              other.id !== recipient.id &&
                              other.nickname === recipient.nickname,
                          ) && (
                            <span className="text-muted-foreground">
                              {" "}
                              · #{recipient.id}
                            </span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {error && (
                  <p role="alert" className="text-destructive text-sm">
                    {t(error)}
                  </p>
                )}
                <div className="flex justify-end gap-2 border-t pt-4">
                  <Dialog.Close
                    render={<Button type="button" variant="outline" />}
                    disabled={pending}
                  >
                    {t("Cancel")}
                  </Dialog.Close>
                  <Button type="submit" disabled={!loaded || pending}>
                    {pending && (
                      <LoaderCircle className="animate-spin" aria-hidden />
                    )}
                    {t(pending ? "Saving…" : "Save sharing")}
                  </Button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
      <span className="sr-only" role="status">
        {t(notice)}
      </span>
    </div>
  );
}
