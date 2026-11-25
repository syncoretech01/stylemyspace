"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SITE } from "@/lib/site";
import { cn } from "@/components/ui/cn";
import { Wordmark } from "@/components/ui/Wordmark";

/** Matches the Tailwind `md` breakpoint, where the inline navigation replaces the menu. */
const DESKTOP = "(min-width: 48rem)";

export function SiteHeader() {
  const pathname = usePathname();
  // The menu is "open for a pathname": navigating closes it without an effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // The hairline appears only once content is passing beneath the bar.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // While the menu covers the page: the page does not scroll, cannot be tabbed into, and Escape
  // returns the reader to the control they opened it with.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const behind = Array.from(document.querySelectorAll<HTMLElement>("main, footer[data-site-footer], .skip-link"));
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    behind.forEach((el) => el.setAttribute("inert", ""));

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenFor(null);
      toggleRef.current?.focus();
    };
    const desktop = window.matchMedia(DESKTOP);
    const onDesktop = () => desktop.matches && setOpenFor(null);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    return () => {
      root.style.overflow = previousOverflow;
      behind.forEach((el) => el.removeAttribute("inert"));
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);

  return (
    <>
      <span ref={sentinelRef} aria-hidden className="pointer-events-none absolute top-0 left-0 size-px" />
      <header
        className={cn(
          "sticky top-0 z-40 h-(--header-h) w-full border-b bg-bone transition-colors duration-(--dur-micro)",
          scrolled || open ? "border-taupe/60" : "border-transparent",
        )}
      >
        <div className="mx-auto flex h-full w-full max-w-content items-center justify-between px-3 md:px-6 lg:px-10">
          <Link href="/" className="inline-flex min-h-6 items-center rounded-xs">
            <Wordmark />
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-2.5 lg:gap-5">
              {SITE.nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group eyebrow inline-flex min-h-6 items-center rounded-xs transition-colors duration-(--dur-micro) hover:text-olive",
                        active ? "text-olive" : "text-ink",
                      )}
                    >
                      <span className={cn("nav-rule", active && "nav-rule-active")}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            ref={toggleRef}
            type="button"
            className="eyebrow -mr-1 inline-flex min-h-6 min-w-6 items-center justify-end gap-1.5 rounded-xs px-1 text-ink md:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpenFor(open ? null : pathname)}
          >
            {/* The word gives way to the bars alone on the narrowest phones, but stays the accessible name. */}
            <span className="max-[359.98px]:visually-hidden">{open ? "Close" : "Menu"}</span>
            <span aria-hidden className="relative block h-[9px] w-[22px]">
              <span
                className={cn(
                  "absolute inset-x-0 top-0 h-px bg-current transition-transform duration-(--dur-micro) ease-(--ease-out-expo)",
                  open && "translate-y-[4px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-(--dur-micro) ease-(--ease-out-expo)",
                  open && "-translate-y-[4px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>

        {/* Absolutely placed (not fixed): the header is sticky at the top, so top-full IS the fold. */}
        <div
          id={menuId}
          inert={!open}
          className={cn(
            "absolute inset-x-0 top-full flex h-[calc(100dvh-var(--header-h)+1px)] flex-col justify-between overflow-y-auto overscroll-contain bg-bone px-3 pt-3 pb-4 md:hidden",
            "transition-[opacity,visibility,translate] duration-(--dur-micro) ease-(--ease-out-expo)",
            open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
          )}
        >
          <nav aria-label="Primary (mobile)">
            <ul className="flex flex-col">
              {SITE.nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href} className="border-b border-taupe/50">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      // Italic only while open: a closed menu is still laid out, and would fetch the italic
                      // face on routes that use it nowhere else.
                      className={cn("block rounded-xs py-2 font-display text-h1", active ? "text-olive" : "text-ink", active && open && "italic")}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <ul className="mt-5 flex flex-col text-body text-olive" role="list">
            <li>
              <a href={SITE.phoneHref} className="inline-flex min-h-6 items-center rounded-xs">
                {SITE.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="inline-flex min-h-6 items-center rounded-xs">
                {SITE.email}
              </a>
            </li>
          </ul>
        </div>
      </header>
    </>
  );
}
