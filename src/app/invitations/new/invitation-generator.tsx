"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCTION_APP_URL } from "@/lib/site-url";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function InvitationGenerator() {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const invitationUrl = new URL(PRODUCTION_APP_URL);
  invitationUrl.searchParams.set("ic", code);
  const link = code ? invitationUrl.toString() : "";

  async function generate() {
    if (pending) return;
    setPending(true);
    setError("");
    setCopied("");
    try {
      const response = await fetch("/api/invitations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "Could not generate a code. Please try again.",
        );
      setCode(result.code);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not connect. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setError("");
    } catch {
      setError(
        "Could not copy automatically. Select the code or link and copy it.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite someone</CardTitle>
        <CardDescription>
          Each code unlocks access for one browser. Unused codes do not expire.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Button
          onClick={() => void generate()}
          disabled={pending}
          size="lg"
          className="self-start"
        >
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : (
            <KeyRound aria-hidden />
          )}
          {pending ? "Generating…" : "Generate"}
        </Button>
        {code && (
          <div className="flex flex-col gap-5" aria-live="polite">
            <div className="flex flex-col gap-2">
              <Label htmlFor="generated-code">Your invitation code</Label>
              <Input
                id="generated-code"
                value={code}
                readOnly
                className="h-12 font-mono text-sm sm:text-base"
                onFocus={(event) => event.target.select()}
              />
              <Button
                variant="outline"
                className="self-start"
                onClick={() => void copy(code, "code")}
              >
                {copied === "code" ? (
                  <Check aria-hidden />
                ) : (
                  <Copy aria-hidden />
                )}
                {copied === "code" ? "Copied code" : "Copy code"}
              </Button>
            </div>
            <div className="flex flex-col gap-2 border-t pt-5">
              <Label htmlFor="invitation-link">Invitation link</Label>
              <p className="text-muted-foreground text-xs">
                This link opens the app and enters the code automatically.
              </p>
              {link && (
                <>
                  <Input
                    id="invitation-link"
                    aria-label="Invitation link"
                    value={link}
                    readOnly
                    onFocus={(event) => event.target.select()}
                  />
                  <Button
                    variant="outline"
                    className="self-start"
                    onClick={() => void copy(link, "link")}
                  >
                    {copied === "link" ? (
                      <Check aria-hidden />
                    ) : (
                      <Copy aria-hidden />
                    )}
                    {copied === "link" ? "Copied link" : "Copy invitation link"}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
