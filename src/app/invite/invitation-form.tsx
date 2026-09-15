"use client";

import { useI18n } from "@/lib/i18n/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INVALID_INVITATION,
  invitationDestination,
} from "@/lib/invitation-policy";

export function InvitationForm({
  initialCode,
  destination,
}: {
  initialCode: string;
  destination: string;
}) {
  const { t } = useI18n();

  const [code, setCode] = useState(initialCode);
  const [pending, setPending] = useState(Boolean(initialCode));
  const [error, setError] = useState("");
  const started = useRef(false);

  const redeem = useCallback(
    async (value: string) => {
      try {
        const response = await fetch("/api/invitations/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: value, next: destination }),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            result.error ||
              "Could not check your invitation. Please try again.",
          );
        const target = invitationDestination(result.destination);
        window.location.replace(
          target + (target.includes("#") ? "" : window.location.hash),
        );
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not connect. Please try again.",
        );
        setPending(false);
      }
    },
    [destination],
  );

  useEffect(() => {
    if (!initialCode || started.current) return;
    started.current = true;
    const clean = new URL(window.location.href);
    clean.searchParams.delete("ic");
    window.history.replaceState(
      window.history.state,
      "",
      `${clean.pathname}${clean.search}${clean.hash}`,
    );
    void redeem(initialCode);
  }, [initialCode, redeem]);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (pending || !code.trim()) return;
        setError("");
        setPending(true);
        void redeem(code);
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="invitation-code">{t("Invitation code")}</Label>
        <Input
          id="invitation-code"
          name="code"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError("");
          }}
          placeholder={t("Paste your invitation code")}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={100}
          required
          disabled={pending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "invitation-error" : undefined}
          className="h-12 font-mono text-sm placeholder:font-sans"
        />
      </div>
      {error && (
        <div
          id="invitation-error"
          role="alert"
          className="border-destructive/20 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm leading-relaxed"
        >
          <p>{t(error)}</p>
          {error === INVALID_INVITATION && (
            <p className="mt-1">
              {t(
                "Check that you copied the whole code, or ask for a new invitation.",
              )}
            </p>
          )}
        </div>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={pending || !code.trim()}
        className="h-12 w-full"
      >
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden />
            {t("Checking invitation…")}
          </>
        ) : (
          <>
            {t("Open invitation")} <ArrowRight aria-hidden />
          </>
        )}
      </Button>
      <p
        role="status"
        className="text-muted-foreground text-sm leading-relaxed"
      >
        {pending
          ? t("You’ll continue automatically once your code is checked.")
          : t(
              "Have an invitation link? Open it directly — the code is filled in for you.",
            )}
      </p>
      <noscript>
        <p>{t("Enable JavaScript to use your invitation code.")}</p>
      </noscript>
    </form>
  );
}
