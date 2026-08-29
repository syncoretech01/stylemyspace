/**
 * Disciplines motion (lazy chunk, motion tiers only).
 * - Header copy fades/rises in via the shared reveal helper.
 * - The four columns enter as one staggered batch on intersection (once).
 * - The hover expand / dim / image scale and the mobile accordion panel are pure CSS; this module only
 *   tells ScrollTrigger to re-measure after an accordion panel finishes changing height.
 * Nothing pins here.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { markReady, revealIn } from "@/lib/motion/reveal";

export default function mount(root: HTMLElement) {
  const ctx = gsap.context(() => {
    revealIn(root, "[data-reveal]:not([data-reveal='col'])");
    revealIn(root, "[data-reveal='col']");
  }, root);
  markReady(root);

  // The accordion panels (mobile / touch) animate `grid-template-rows` in CSS; once a panel settles the
  // section height has changed, so every trigger below it must be re-measured.
  const onTransitionEnd = (e: TransitionEvent) => {
    if (e.propertyName === "grid-template-rows") ScrollTrigger.refresh();
  };
  root.addEventListener("transitionend", onTransitionEnd);

  return () => {
    root.removeEventListener("transitionend", onTransitionEnd);
    ctx.revert();
  };
}
