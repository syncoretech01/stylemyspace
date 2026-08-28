"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { SITE } from "@/lib/site";
import { cn } from "@/components/ui/cn";
import { Wordmark } from "@/components/ui/Wordmark";

export function SiteHeader() {
  const pathname = usePathname();
  // The menu is "open for a pathname": navigating closes it without an effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const setOpen = (next: boolean) => setOpenFor(next ? pathname : null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 h-(--header-h) w-full border-b border-taupe/40 bg-bone/85 backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-content items-center justify-between px-3 md:px-6 lg:px-10">
        <Link href="/" aria-label={`${SITE.name} — home`} className="rounded-xs" data-cursor="Home">
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-4">
            {SITE.nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "eyebrow rounded-xs py-1 text-ink transition-colors duration-(--dur-micro) hover:text-olive",
                      active && "text-olive underline decoration-1 underline-offset-8",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          className="eyebrow -mr-1 rounded-xs px-1 py-1 text-ink md:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <nav
        id={menuId}
        aria-label="Primary (mobile)"
        hidden={!open}
        className="border-t border-taupe/40 bg-bone md:hidden"
      >
        <ul className="flex flex-col px-3 py-2">
          {SITE.nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className="block py-1.5 font-display text-h3 text-ink"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
