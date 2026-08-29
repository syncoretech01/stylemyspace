/**
 * CTA block — entrances plus the magnetic primary button.
 * Eyebrow, heading, copy and the button row ([data-reveal]) fade/rise in once. On the full tier
 * with a fine pointer the [data-magnet] wrapper pulls its button toward the cursor (magnet.motion.ts);
 * touch and the mobile tier get the reveals only. Nothing pins.
 * Reduced motion never loads this module — the static markup is the final state.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { markReady, revealIn } from "@/lib/motion/reveal";
import { attachMagnets } from "./magnet.motion";

export default function mount(root: HTMLElement, ctx: { tier: "full" | "mobile"; fine: boolean }) {
  let detachMagnets: (() => void) | undefined;

  const c = gsap.context(() => {
    revealIn(root);
    markReady(root);
    if (ctx.tier === "full" && ctx.fine) detachMagnets = attachMagnets(root);
    ScrollTrigger.refresh();
  }, root);

  return () => {
    detachMagnets?.();
    c.revert();
  };
}
