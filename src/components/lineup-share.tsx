"use client";

import { useRef, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import {
  Check,
  ChevronDown,
  KeyRound,
  Link2,
  LoaderCircle,
  Share2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRODUCTION_APP_URL } from "@/lib/site-url";

const itemClassName =
  "data-highlighted:bg-accent data-highlighted:text-accent-foreground flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-none select-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

export function LineupShare({
  lineupId,
  canInvite,
}: {
  lineupId: number;
  canInvite: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [fallbackLink, setFallbackLink] = useState("");
  const busy = useRef(false);
  // If copying is blocked, another attempt should copy the code just created.
  const retryInvitation = useRef<string | null>(null);

  async function invitationLink(link: string): Promise<string> {
    if (retryInvitation.current) return retryInvitation.current;
    const response = await fetch("/api/invitations/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok)
      throw new Error("Could not generate an invitation. Please try again.");
    const { code } = await response.json();
    if (typeof code !== "string" || !code)
      throw new Error("Could not generate an invitation. Please try again.");
    const url = new URL(link);
    url.searchParams.set("ic", code);
    retryInvitation.current = url.toString();
    return retryInvitation.current;
  }

  async function copy(withInvitation: boolean) {
    if (busy.current || (withInvitation && !canInvite)) return;
    busy.current = true;
    setPending(true);
    setCopied(false);
    setError("");
    setFallbackLink("");
    setOpen(false);

    const plainLink = new URL(
      `/lineups/${lineupId}`,
      PRODUCTION_APP_URL,
    ).toString();
    const link = withInvitation
      ? invitationLink(plainLink)
      : Promise.resolve(plainLink);
    // Handle the generation promise even if clipboard access is refused first.
    void link.catch(() => {});
    try {
      if (
        withInvitation &&
        navigator.clipboard?.write &&
        typeof ClipboardItem !== "undefined"
      ) {
        // Start the clipboard operation during the click, before the network
        // response, to retain Safari's transient user activation.
        const content = link.then(
          (value) => new Blob([value], { type: "text/plain" }),
        );
        void content.catch(() => {});
        await navigator.clipboard.write([
          new ClipboardItem({ "text/plain": content }),
        ]);
      } else {
        if (!navigator.clipboard?.writeText)
          throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(
          withInvitation ? await link : plainLink,
        );
      }
      if (withInvitation) retryInvitation.current = null;
      setCopied(true);
    } catch {
      try {
        setFallbackLink(await link);
        setError(
          "Could not copy automatically. Select and copy the link below.",
        );
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not create a share link. Please try again.",
        );
      }
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col items-end gap-2">
      <Menu.Root
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (value) setCopied(false);
        }}
      >
        <Menu.Trigger
          className={buttonVariants({ variant: "outline" })}
          disabled={pending}
        >
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : copied ? (
            <Check aria-hidden />
          ) : (
            <Share2 aria-hidden />
          )}
          {pending ? "Preparing link…" : copied ? "Copied!" : "Share"}
          <ChevronDown aria-hidden />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={6} className="z-50">
            <Menu.Popup className="bg-popover text-popover-foreground w-60 rounded-lg border p-1 shadow-lg outline-none">
              <Menu.Item
                className={itemClassName}
                onClick={() => void copy(false)}
              >
                <Link2 aria-hidden /> Copy link
              </Menu.Item>
              <Menu.Item
                className={itemClassName}
                disabled={!canInvite}
                onClick={() => void copy(true)}
              >
                <KeyRound aria-hidden /> Copy link with IC
              </Menu.Item>
              {!canInvite && (
                <p className="text-muted-foreground px-3 py-2 text-xs">
                  Sign in as admin to generate invitation codes.
                </p>
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <span role="status" className="sr-only">
        {copied
          ? "Link copied to clipboard."
          : pending
            ? "Preparing share link."
            : ""}
      </span>
      {error && (
        <div className="flex w-full max-w-xs flex-col gap-2">
          <p role="alert" className="text-destructive text-xs">
            {error}
          </p>
          {fallbackLink && (
            <Input
              aria-label="Share link"
              value={fallbackLink}
              readOnly
              onFocus={(event) => event.target.select()}
              className="text-xs"
            />
          )}
        </div>
      )}
    </div>
  );
}
