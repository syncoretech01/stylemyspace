/**
 * Case-study gallery motion. PLACEHOLDER written by the lead to unblock the build after the
 * motion phase was interrupted: it only reveals the gallery. Owner ⑤ replaces this with the
 * perspective slider (Observer drag, prev/next, arrow keys, roving tabindex, live region).
 */
import { gsap } from "@/lib/gsap";
import { markReady, revealIn } from "@/lib/motion/reveal";
import type { MotionMount } from "@/components/motion/useMotionModule";

const mount: MotionMount = (root) => {
  const ctx = gsap.context(() => {
    revealIn(root);
  }, root);
  markReady(root);
  return () => ctx.revert();
};

export default mount;
