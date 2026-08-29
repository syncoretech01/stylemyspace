/**
 * Contact — entrances only, plus the magnetic submit button.
 * The intro, the form's field rows and the studio detail columns are marked [data-reveal] and
 * fade/rise in once on intersection (ScrollTrigger.batch, stagger.items — the field rows batch
 * together so they arrive as a short cascade). The floating labels, live validation, error
 * summary and the focused success state are existing React/CSS and are untouched here.
 * On the full tier with a fine pointer the [data-magnet] submit wrapper gets the magnetic pull.
 * Reduced motion never loads this module — the static markup is the final state.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { markReady, revealIn } from "@/lib/motion/reveal";
import { attachMagnets } from "@/components/sections/CtaBlock/magnet.motion";

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
