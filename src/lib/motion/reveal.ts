/**
 * Shared reveal helper for motion modules.
 * Elements marked [data-reveal] inside `root` fade/rise in when they enter the viewport.
 * Call inside a gsap.context(). Hidden state is applied inline BEFORE the root is marked ready,
 * so the CSS pre-hide (globals.css) hands off without a flash.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { dist, dur, ease, stagger } from "@/lib/motion/tokens";

/** True for a reveal that is (or wraps) the LCP candidate — see the matching rule in globals.css. */
const carriesLcp = (el: HTMLElement) => el.hasAttribute("data-reveal-lcp") || !!el.querySelector("[data-lcp]");

export function revealIn(root: HTMLElement, selector = "[data-reveal]") {
  const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
  if (!targets.length) return;
  // An opacity-0 paint is not an LCP candidate, so the LCP element only ever rises — never fades.
  const [lcp, rest] = [targets.filter(carriesLcp), targets.filter((el) => !carriesLcp(el))];
  if (rest.length) gsap.set(rest, { opacity: 0, y: dist.rise });
  if (lcp.length) gsap.set(lcp, { opacity: 1, y: dist.rise });
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
