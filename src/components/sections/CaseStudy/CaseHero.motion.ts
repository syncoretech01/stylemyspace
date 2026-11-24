/**
 * Case-study hero motion (lazy chunk, framework-free). Mounted by <CaseHeroMotionRoot> on the
 * full / mobile tiers; never loaded under reduced motion (the static markup is the final state).
 *
 * The title is painted with the page, before this chunk can possibly arrive, so it only ever rises into
 * place (data-reveal-lcp). Splitting it into masked lines here meant hiding a headline the reader was
 * already looking at, on every visit, for half a second.
 */
import { gsap } from "@/lib/gsap";
import { markReady, revealIn } from "@/lib/motion/reveal";

export default function mount(root: HTMLElement) {
  const ctx = gsap.context(() => {
    revealIn(root);
    markReady(root);
  }, root);
  return () => ctx.revert();
}
