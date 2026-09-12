"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/heroes", label: "Heroes" },
  { href: "/divinities", label: "Divinities" },
  { href: "/lineups", label: "Lineups" },
  { href: "/lineups/new", label: "Build" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex min-w-0 items-center gap-0.5 text-sm sm:gap-1">
      {LINKS.map(({ href, label }) => {
        const active =
          href === "/lineups"
            ? pathname === "/lineups" || /^\/lineups\/\d+/.test(pathname)
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-2 py-1.5 font-medium whitespace-nowrap transition-colors sm:px-2.5",
              active && "bg-accent text-accent-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
