import Link from "next/link";
import { Crown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLinks } from "@/components/nav-links";

export function SiteHeader() {
  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-3 sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="font-heading flex shrink-0 items-center gap-2 text-base font-semibold whitespace-nowrap"
        >
          <Crown className="text-primary size-5" aria-hidden />
          <span className="hidden sm:inline">Mini Heroes Lineups</span>
          <span className="sr-only sm:hidden">Mini Heroes Lineups</span>
        </Link>
        <NavLinks />
        <div className="ml-auto shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
