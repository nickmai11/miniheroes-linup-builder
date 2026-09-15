"use client";

import { useI18n } from "@/lib/i18n/client";
import { ConfirmAction } from "@/components/confirm-action";
import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PublicUrlManager({ initialPaths }: { initialPaths: string[] }) {
  const { t } = useI18n();

  const [paths, setPaths] = useState(initialPaths);
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");

  async function update(value: string, remove = false) {
    if (pending)
      return { error: "Please wait for the current update to finish." };
    setPending(remove ? value : "add");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/public-urls", {
        method: remove ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not update public URLs.");
      setPaths((current) =>
        remove
          ? current.filter((path) => path !== result.path)
          : [...current, result.path].sort(),
      );
      if (!remove) setUrl("");
      setMessage(
        remove
          ? t("{path} now requires an invitation.", { path: result.path })
          : t("{path} is now public.", { path: result.path }),
      );
      return {};
    } catch (reason) {
      const error =
        reason instanceof Error
          ? reason.message
          : "Could not connect. Please try again.";
      if (!remove) setError(error);
      return { error };
    } finally {
      setPending(null);
    }
  }

  async function copy(path: string) {
    try {
      await navigator.clipboard.writeText(
        new URL(path, window.location.origin).toString(),
      );
      setCopied(path);
      setError("");
    } catch {
      setError("Could not copy automatically. Copy the page link below.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Make a page public")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void update(url);
            }}
          >
            <Label htmlFor="public-url">{t("Page URL")}</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                id="public-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder={t("/lineups/123 or paste a page link")}
                required
                maxLength={4096}
                autoComplete="off"
                aria-describedby="public-url-help"
              />
              <Button type="submit" disabled={pending !== null || !url.trim()}>
                {pending === "add" ? (
                  <LoaderCircle className="animate-spin" aria-hidden />
                ) : (
                  <Globe aria-hidden />
                )}
                {t("Add public URL")}
              </Button>
            </div>
            <p id="public-url-help" className="text-muted-foreground text-sm">
              {t(
                "Only this page becomes public, including its query variations and images. Linked pages keep their own access settings. Changes apply immediately.",
              )}
            </p>
          </form>
        </CardContent>
      </Card>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {t(error)}
        </p>
      )}
      <p role="status" className="text-muted-foreground text-sm empty:hidden">
        {message}
      </p>
      <Card>
        <CardHeader>
          <CardTitle>
            {t("Public pages")}{" "}
            <span className="text-muted-foreground font-normal">
              ({paths.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paths.length === 0 ? (
            <p className="text-muted-foreground py-4 text-sm">
              {t(
                "No public URLs yet. Add a page above to share it without an invitation.",
              )}
            </p>
          ) : (
            <ul className="divide-y">
              {paths.map((path) => (
                <li
                  key={path}
                  className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="font-medium break-all">{path}</p>
                    <a
                      className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1 text-xs break-all"
                      href={path}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {path}
                      <ExternalLink className="size-3 shrink-0" aria-hidden />
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copy(path)}
                    aria-label={t("Copy public link for {path}", { path })}
                  >
                    {copied === path ? (
                      <Check aria-hidden />
                    ) : (
                      <Copy aria-hidden />
                    )}
                    {copied === path ? t("Copied") : t("Copy link")}
                  </Button>
                  <ConfirmAction
                    title={t('Remove public access to "{path}"?', { path })}
                    description="Visitors will need an invitation or admin login to open this page. You can make it public again later."
                    confirmLabel="Remove"
                    pendingLabel="Removing…"
                    disabled={pending !== null}
                    action={() => update(path, true)}
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={t("Remove public access to {path}", {
                          path,
                        })}
                      >
                        <Trash2 aria-hidden />
                        {t("Remove")}
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
