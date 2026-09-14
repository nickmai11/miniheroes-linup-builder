"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invitationDestination } from "@/lib/invitation-policy";

export function AdminLogin({
  signedIn,
  compact = false,
}: {
  signedIn: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) passwordRef.current?.focus();
  }, [error]);

  async function authenticate(form: HTMLFormElement | null) {
    if (pending) return;
    const data = form ? new FormData(form) : null;
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/${signedIn ? "logout" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            data
              ? {
                  email: data.get("email"),
                  password: data.get("password"),
                }
              : {},
          ),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          result?.error ||
            `Could not ${signedIn ? "sign out" : "sign in"}. Please try again.`,
        );
      if (passwordRef.current) passwordRef.current.value = "";
      // A fresh document also clears previously cached admin navigation on logout.
      if (signedIn) window.location.reload();
      else {
        const url = new URL(window.location.href);
        const destination =
          url.pathname === "/invite"
            ? invitationDestination(url.searchParams.get("next"))
            : `${url.pathname}${url.search}${url.hash}`;
        window.location.replace(destination);
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not connect. Please try again.",
      );
      setPending(false);
      if (passwordRef.current) {
        passwordRef.current.value = "";
      }
    }
  }

  if (signedIn) {
    return (
      <div className="relative flex items-center gap-2">
        <span className="text-primary hidden items-center gap-1 text-xs font-medium lg:flex">
          <ShieldCheck className="size-3.5" aria-hidden /> Admin
        </span>
        <Button
          variant="ghost"
          size="sm"
          className={
            compact ? "size-9 p-0 sm:h-7 sm:w-auto sm:px-2.5" : undefined
          }
          disabled={pending}
          onClick={() => void authenticate(null)}
        >
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : (
            <LogOut aria-hidden />
          )}
          <span className={compact ? "sr-only sm:not-sr-only" : undefined}>
            Sign out
          </span>
        </Button>
        {error && (
          <p
            role="alert"
            className="bg-popover text-destructive absolute top-full right-0 mt-2 w-64 rounded-lg border p-3 text-sm shadow-lg"
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return;
        setOpen(nextOpen);
        setError("");
        setShowPassword(false);
      }}
    >
      <Dialog.Trigger
        render={<Button variant="ghost" size="sm" />}
        className={
          compact ? "size-9 p-0 sm:h-7 sm:w-auto sm:px-2.5" : undefined
        }
      >
        <ShieldCheck aria-hidden />
        <span className={compact ? "sr-only sm:not-sr-only" : undefined}>
          Admin access
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <Dialog.Popup
            initialFocus={emailRef}
            className="bg-background relative my-auto w-full max-w-sm rounded-2xl border p-6 shadow-2xl outline-none"
          >
            <Dialog.Close
              render={<Button variant="ghost" size="icon" />}
              disabled={pending}
              aria-label="Close admin access"
              className="absolute top-3 right-3"
            >
              <X aria-hidden />
            </Dialog.Close>
            <div className="bg-primary/10 text-primary mb-4 flex size-11 items-center justify-center rounded-xl">
              <ShieldCheck className="size-5" aria-hidden />
            </div>
            <Dialog.Title className="font-heading text-xl font-semibold">
              Admin access
            </Dialog.Title>
            <Dialog.Description className="text-muted-foreground mt-1 text-sm">
              Sign in to manage Mini Heroes Library.
            </Dialog.Description>
            <form
              className="mt-6 flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void authenticate(event.currentTarget);
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  ref={emailRef}
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={254}
                  required
                  disabled={pending}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "admin-login-error" : undefined}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    maxLength={1024}
                    required
                    disabled={pending}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "admin-login-error" : undefined}
                    className="h-11 pr-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1.5 right-1.5"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden />
                    ) : (
                      <Eye aria-hidden />
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <p
                  id="admin-login-error"
                  role="alert"
                  className="text-destructive text-sm"
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={pending}
                className="mt-1 h-11 w-full"
              >
                {pending && (
                  <LoaderCircle className="animate-spin" aria-hidden />
                )}
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
