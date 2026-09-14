"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  Crown,
  Hammer,
  Info,
  Link2,
  Menu,
  Sparkles,
  Swords,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/heroes", label: "Heroes", icon: Users },
  { href: "/divinities", label: "Divinities", icon: Sparkles },
  { href: "/lineups", label: "Lineups", icon: Swords },
  { href: "/lineups/new", label: "Build", icon: Hammer },
  { href: "/invitations/new", label: "Invitations", icon: Ticket },
  { href: "/public-urls", label: "Public URLs", icon: Link2 },
  { href: "/about", label: "About", icon: Info },
] as const;

type NavigationProps = {
  canEdit: boolean;
};

function NavigationItems({
  canEdit,
  mobile = false,
  onSelect,
}: NavigationProps & {
  mobile?: boolean;
  onSelect?: () => void;
}) {
  const pathname = usePathname();
  return LINKS.map(({ href, label, icon: Icon }) => {
    const adminRoute = href === "/invitations/new" || href === "/public-urls";
    if ((href === "/lineups/new" || adminRoute) && !canEdit) return null;
    const active =
      href === "/lineups"
        ? pathname === "/lineups" || /^\/lineups\/\d+/.test(pathname)
        : pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        onClick={onSelect}
        aria-current={active ? "page" : undefined}
        className={cn(
          "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex items-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset",
          mobile ? "min-h-11 px-3 py-3" : "px-2.5 py-1.5",
          active && "bg-accent text-accent-foreground",
        )}
      >
        <Icon
          className={cn("shrink-0", mobile ? "size-5" : "size-4")}
          aria-hidden
        />
        {label}
      </Link>
    );
  });
}

export function NavLinks(props: NavigationProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 hidden border-b backdrop-blur md:block"
    >
      <div className="mx-auto flex min-h-12 w-full max-w-6xl min-w-0 items-center gap-1 overflow-x-auto px-6 py-2 text-sm">
        <NavigationItems {...props} />
      </div>
    </nav>
  );
}

export function MobileNavigation(props: NavigationProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 48rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={<Button variant="ghost" size="icon" />}
        aria-label="Open navigation"
        className="size-11 md:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex">
          <Dialog.Popup className="bg-background flex h-dvh w-80 max-w-[85vw] flex-col overflow-y-auto overscroll-contain border-r p-4 shadow-2xl transition-transform duration-200 outline-none data-ending-style:-translate-x-full data-starting-style:-translate-x-full motion-reduce:transition-none">
            <div className="flex items-center justify-between gap-3 border-b pb-3">
              <Dialog.Title className="font-heading flex min-w-0 items-center gap-2 text-base leading-tight font-semibold">
                <Crown className="text-primary size-5 shrink-0" aria-hidden />
                <span>Mini Heroes Library</span>
              </Dialog.Title>
              <Dialog.Close
                render={<Button variant="ghost" size="icon" />}
                aria-label="Close navigation"
                className="size-11"
              >
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Browse Mini Heroes Library.
            </Dialog.Description>
            <nav
              aria-label="Main navigation"
              className="mt-4 flex flex-col gap-1 text-sm"
            >
              <NavigationItems
                {...props}
                mobile
                onSelect={() => setOpen(false)}
              />
            </nav>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
