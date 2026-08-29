"use client";

import type { MouseEvent } from "react";

/**
 * Footer "back to top" control.
 *
 * It is a real anchor to #main, so with JavaScript disabled (and for middle/modifier clicks) the
 * browser's own jump still works and focus still lands at the top of the content. With JavaScript
 * it upgrades to a smooth scroll — through Lenis when the smooth-scroll runtime is mounted, and
 * through the platform otherwise. Under prefers-reduced-motion it jumps instantly, and focus is
 * moved to <main> either way so a keyboard user is not left at the bottom of the document.
 */
export function BackToTop() {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = window.__lenis;
    if (lenis && !reduced) lenis.scrollTo(0, { duration: 1.1 });
    else window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });

    // Send the caret back to the top with the page, without fighting the scroll we just started.
    document.getElementById("main")?.focus({ preventScroll: true });
  };

  return (
    <a
      href="#main"
      onClick={onClick}
      data-cursor="Top"
      className="group inline-flex min-h-[2.75rem] items-center gap-2 rounded-xs text-sand transition-colors duration-(--dur-micro) hover:text-bone focus-visible:text-bone"
    >
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-full border border-bone/30 transition-[border-color,transform] duration-(--dur-short) ease-(--ease-out-expo) group-hover:border-bone motion-on:group-hover:-translate-y-1 motion-on:group-focus-visible:-translate-y-1"
      >
        {/* Simple stroked chevron: no icon dependency, inherits currentColor. */}
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M12 19V5M12 5l-6 6M12 5l6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="eyebrow">Back to top</span>
    </a>
  );
}
