"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invitationDestination } from "@/lib/invitation-policy";

export function InvitationForm({
  initialCode,
  destination,
}: {
  initialCode: string;
  destination: string;
}) {
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
        if (pending) return;
        setError("");
        setPending(true);
        void redeem(code);
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="invitation-code">Invitation code</Label>
        <Input
          id="invitation-code"
          name="code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Paste your invitation code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={100}
          required
          disabled={pending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "invitation-error" : undefined}
          className="h-11 font-mono"
        />
      </div>
      {error && (
        <p
          id="invitation-error"
          role="alert"
          className="text-destructive text-sm"
        >
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={pending || !code.trim()}
        className="w-full"
      >
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden />
            Checking invitation…
          </>
        ) : (
          <>
            Continue
            <ArrowRight aria-hidden />
          </>
        )}
      </Button>
      <p className="text-muted-foreground text-xs">
        Each code can be used once. Ask the person who invited you for a new
        code if yours has already been used.
      </p>
      <noscript>
        <p>Enable JavaScript to use your invitation code.</p>
      </noscript>
    </form>
  );
}
