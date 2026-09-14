import Link from "next/link";
import { Crown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNavigation, NavLinks } from "@/components/nav-links";
import { canEditContent } from "@/lib/editing";
import { getPublicPage, hasAppAccess } from "@/lib/app-access";
import { isAdmin } from "@/lib/admin-access";
import { AdminLogin } from "@/components/admin-login";

export async function SiteHeader() {
  const canEdit = await canEditContent();
  const signedIn = await isAdmin();
  const access = await hasAppAccess();
  const publicPage = access ? null : await getPublicPage();
  return (
    <>
      <header className="bg-background sticky top-0 z-40 border-b md:static">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-3 sm:gap-6 sm:px-6">
          <MobileNavigation canEdit={canEdit} />
          <Link
            href={access ? "/" : (publicPage ?? "/invite")}
            className="font-heading flex min-w-0 items-center gap-2 text-sm leading-tight font-semibold sm:text-base"
          >
            <Crown className="text-primary size-5 shrink-0" aria-hidden />
            <span>Mini Heroes Library</span>
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <AdminLogin signedIn={signedIn} compact />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <NavLinks canEdit={canEdit} />
    </>
  );
}
