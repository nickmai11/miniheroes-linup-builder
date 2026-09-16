import { getI18n } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import Link from "next/link";
import { Crown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNavigation, NavLinks } from "@/components/nav-links";
import { canEditContent } from "@/lib/editing";
import {
  getPublicPage,
  getRegisteredDevice,
  hasAppAccess,
} from "@/lib/app-access";
import { getAdminId } from "@/lib/admin-access";
import { AdminLogin } from "@/components/admin-login";
import { NotificationsButton } from "@/components/notifications-button";

export async function SiteHeader() {
  const { t } = await getI18n();

  const canEdit = await canEditContent();
  const adminId = await getAdminId();
  const signedIn = adminId !== null;
  const access = await hasAppAccess();
  const device = await getRegisteredDevice();
  const lineupOnly = !access && Boolean(device);
  const publicPage = access ? null : await getPublicPage();
  return (
    <>
      <header className="bg-background sticky top-0 z-40 border-b md:static">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-3 sm:gap-6 sm:px-6">
          <MobileNavigation canEdit={canEdit} />
          <Link
            href={
              access ? "/" : lineupOnly ? "/lineups" : (publicPage ?? "/invite")
            }
            className="font-heading flex min-w-0 items-center gap-2 text-sm leading-tight font-semibold sm:text-base"
          >
            <Crown
              className="text-primary hidden size-5 shrink-0 sm:block"
              aria-hidden
            />
            <span>{t("Mini Heroes Library")}</span>
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {(signedIn || device) && (
              <NotificationsButton key={adminId ?? `device:${device!.id}`} />
            )}
            <AdminLogin signedIn={signedIn} compact />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <NavLinks canEdit={canEdit} />
    </>
  );
}
