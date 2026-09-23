"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  Search,
  Shield,
  UserRound,
  UserRoundX,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { nicknameInputSchema, NICKNAME_MAX_LENGTH } from "@/lib/nickname-input";
import type { ManagedUser } from "@/lib/user-management-input";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function UserRow({
  user,
  onRemove,
}: {
  user: ManagedUser;
  onRemove: (key: string) => void;
}) {
  const { t, formatDate } = useI18n();
  const router = useRouter();
  const [nickname, setNickname] = useState(user.nickname ?? "");
  const [savedNickname, setSavedNickname] = useState(user.nickname);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);
  const inputId = `nickname-${user.viewerKey}`;
  const displayName = savedNickname ?? t("Nickname not set");

  async function update(revoke: boolean) {
    if (inFlight.current)
      return { error: "Please wait for the current update to finish." };
    const parsed = nicknameInputSchema.safeParse({ nickname });
    if (!revoke && !parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter your nickname.");
      return;
    }
    inFlight.current = true;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/users", {
        method: revoke ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewerKey: user.viewerKey,
          ...(!revoke && parsed.success
            ? { nickname: parsed.data.nickname }
            : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "Could not update this user. Please try again.",
        );
      if (revoke) onRemove(user.viewerKey);
      else {
        setNickname(result.nickname);
        setSavedNickname(result.nickname);
        setMessage(t("Nickname saved."));
      }
      router.refresh();
      return {};
    } catch (reason) {
      const error =
        reason instanceof Error
          ? reason.message
          : "Could not update this user. Please try again.";
      if (!revoke) setError(error);
      return { error };
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <li className="bg-card flex flex-col gap-4 rounded-xl border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {user.kind === "admin" ? (
              <Shield className="text-primary size-4" aria-hidden />
            ) : (
              <UserRound className="text-muted-foreground size-4" aria-hidden />
            )}
            <h2 className="font-semibold wrap-anywhere">{displayName}</h2>
            <Badge variant="secondary">
              {t(user.kind === "admin" ? "Admin profile" : "Invited user")}
            </Badge>
            {user.isYou && <Badge variant="outline">{t("You")}</Badge>}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {user.kind === "invited" &&
              t("User #{id}", { id: user.viewerKey.slice(7) })}
            {user.createdAt && (
              <> · {t("Joined {date}", { date: formatDate(user.createdAt) })}</>
            )}
          </p>
        </div>
        {user.kind === "invited" && (
          <ConfirmAction
            title={t('Revoke access for "{name}"?', { name: displayName })}
            description="This removes this browser registration, nickname, shares, follows, and votes. The user will need a new invitation to return. Public pages remain accessible."
            confirmLabel="Revoke access"
            pendingLabel="Revoking…"
            disabled={pending}
            action={() => update(true)}
            trigger={
              <Button type="button" size="sm" variant="outline">
                <UserRoundX aria-hidden />
                {t("Revoke access")}
              </Button>
            }
          />
        )}
      </div>
      {user.kind === "invited" && (
        <p className="text-muted-foreground text-sm">
          {user.fullAccess
            ? t("Full library access")
            : t("{count} invited lineups", { count: user.invitedLineups })}
          {" · "}
          {t("{count} shared items", { count: user.sharedItems })}
        </p>
      )}
      <form
        aria-busy={pending}
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void update(false);
        }}
      >
        <Label htmlFor={inputId}>{t("Nickname")}</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={inputId}
            name="nickname"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            required
            maxLength={NICKNAME_MAX_LENGTH}
            disabled={pending}
            autoComplete="off"
            className="sm:max-w-sm"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={
              pending || !nickname.trim() || nickname.trim() === savedNickname
            }
          >
            {pending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("Save nickname")}
          </Button>
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-destructive text-sm"
          >
            {t(error)}
          </p>
        )}
        <p role="status" className="text-muted-foreground text-sm empty:hidden">
          {message}
        </p>
      </form>
    </li>
  );
}

export function UserManager({ initialUsers }: { initialUsers: ManagedUser[] }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [removed, setRemoved] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const users = initialUsers.filter(
    (user) => !removed.includes(user.viewerKey),
  );
  const search = query.trim().toLocaleLowerCase();
  const visible = users.filter((user) =>
    `${user.nickname ?? ""} ${user.kind === "admin" ? t("Admin profile") : `${t("Invited user")} ${user.viewerKey.slice(7)}`}`
      .toLocaleLowerCase()
      .includes(search),
  );
  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground text-sm">
        {t(
          "Each invited user represents one registered browser. Admin profiles appear after they use the app.",
        )}
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex w-full flex-col gap-2 sm:max-w-sm">
          <Label htmlFor="user-search">{t("Search users")}</Label>
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-2 left-3 size-4"
              aria-hidden
            />
            <Input
              id="user-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("Nickname or user number")}
              className="pl-9"
            />
          </div>
        </div>
        <p role="status" className="text-muted-foreground text-sm">
          {t("{shown} of {total} users", {
            shown: visible.length,
            total: users.length,
          })}
        </p>
      </div>
      <p role="status" className="text-muted-foreground text-sm empty:hidden">
        {message}
      </p>
      {visible.length ? (
        <ul className="flex flex-col gap-3">
          {visible.map((user) => (
            <UserRow
              key={`${user.viewerKey}:${user.nickname}`}
              user={user}
              onRemove={(key) => {
                setRemoved((current) => [...current, key]);
                setMessage(t("User access revoked."));
              }}
            />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
          {t("No users match your search.")}
        </p>
      )}
    </div>
  );
}
