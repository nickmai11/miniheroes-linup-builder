import Link from "next/link";
import { Crown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLinks } from "@/components/nav-links";
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
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-3 sm:gap-6 sm:px-6">
        <Link
          href={access ? "/" : (publicPage ?? "/invite")}
          className="font-heading flex shrink-0 items-center gap-2 text-base font-semibold whitespace-nowrap"
        >
          <Crown className="text-primary size-5" aria-hidden />
          <span className="hidden sm:inline">Mini Heroes Library</span>
          <span className="sr-only sm:hidden">Mini Heroes Library</span>
        </Link>
        {(access || publicPage || canEdit) && (
          <NavLinks
            canEdit={canEdit}
            allowedPaths={access ? undefined : publicPage ? [publicPage] : []}
          />
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <AdminLogin signedIn={signedIn} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
