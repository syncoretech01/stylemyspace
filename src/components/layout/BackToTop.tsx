"use client";

import type { MouseEvent } from "react";

/**
 * Footer "back to top" control.
 *
 * It is a real anchor to #main, so with JavaScript disabled (and for middle/modifier clicks) the
 * browser's own jump still works and focus still lands at the top of the content. With JavaScript
 * it upgrades to a smooth scroll. The smooth-scroll runtime is a lazy chunk, so this component never
 * references it: it announces the intent with a cancelable event, which MotionRuntimeImpl claims when
 * it is mounted; unclaimed, the platform scrolls. Under prefers-reduced-motion it jumps instantly, and
 * focus moves to <main> either way so a keyboard user is not left at the bottom of the document.
 */
export function BackToTop() {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();

    const claimed = !window.dispatchEvent(new CustomEvent("site:scroll-top", { cancelable: true }));
    if (!claimed) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
    }

    // Send the caret back to the top with the page, without fighting the scroll we just started.
    document.getElementById("main")?.focus({ preventScroll: true });
  };

  return (
    <a
      href="#main"
      onClick={onClick}
      className="group inline-flex min-h-6 items-center gap-1.5 rounded-xs text-sand transition-colors duration-(--dur-micro) hover:text-bone focus-visible:text-bone"
    >
      <span className="eyebrow">Back to top</span>
      <span
        aria-hidden="true"
        className="inline-block transition-transform duration-(--dur-short) ease-(--ease-out-expo) motion-on:group-hover:-translate-y-0.5"
      >
        ↑
      </span>
    </a>
  );
}
