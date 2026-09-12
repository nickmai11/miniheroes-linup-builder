import Link from "next/link";
import { Crown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLinks } from "@/components/nav-links";

export function SiteHeader() {
  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading flex items-center gap-2 text-base font-semibold"
        >
          <Crown className="text-primary size-5" aria-hidden />
          <span>Mini Heroes Lineups</span>
        </Link>
        <NavLinks />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
