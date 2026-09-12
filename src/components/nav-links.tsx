"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/heroes", label: "Heroes" },
  { href: "/lineups", label: "Lineups" },
  { href: "/lineups/new", label: "Build" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm">
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
              "text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-2.5 py-1.5 font-medium transition-colors",
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
