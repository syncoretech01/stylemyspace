/**
 * Shared reveal helper for motion modules.
 * Elements marked [data-reveal] inside `root` fade/rise in when they enter the viewport.
 * Call inside a gsap.context(). Hidden state is applied inline BEFORE the root is marked ready,
 * so the CSS pre-hide (globals.css) hands off without a flash.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { dist, dur, ease, stagger } from "@/lib/motion/tokens";

export function revealIn(root: HTMLElement, selector = "[data-reveal]") {
  const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
  if (!targets.length) return;
  gsap.set(targets, { opacity: 0, y: dist.rise });
  const show = (els: Element[]) =>
    gsap.to(els, { opacity: 1, y: 0, duration: dur.enter, ease: ease.out, stagger: stagger.items, overwrite: true });
  ScrollTrigger.batch(targets, { start: "top 92%", once: true, batchMax: 6, onEnter: show });
  // Keyboard users must never land on hidden content.
  root.addEventListener(
    "focusin",
    (e) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(selector);
      if (el) gsap.to(el, { opacity: 1, y: 0, duration: dur.micro, overwrite: true });
    },
    { passive: true },
  );
}

/** Mark the root as taken over by JS motion (removes the CSS pre-hide). */
export function markReady(root: HTMLElement) {
  root.dataset.motionReady = "1";
}
