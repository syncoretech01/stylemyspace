/**
 * Service areas motion (lazy chunk, motion tiers only).
 * Heading copy and the four rows fade/rise in with a stagger on intersection — nothing more.
 * The underline draw and hint slide on hover / focus are CSS.
 */
import { gsap } from "@/lib/gsap";
import { markReady, revealIn } from "@/lib/motion/reveal";

export default function mount(root: HTMLElement) {
  const ctx = gsap.context(() => {
    revealIn(root);
  }, root);
  markReady(root);
  return () => ctx.revert();
}
