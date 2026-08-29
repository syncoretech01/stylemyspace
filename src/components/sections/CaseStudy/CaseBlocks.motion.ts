/**
 * Alternating editorial blocks (lazy chunk, framework-free).
 *
 *  - [data-parallax-frame] > div   the image layer (scaled up here for slack) scrubs
 *                                  yPercent −8 → 8 (±4 on the mobile tier) across the block's
 *                                  journey through the viewport. Function-based values so a resize
 *                                  re-measures (invalidateOnRefresh).
 *  - [data-reveal]                 figures fade-rise in.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { dist, ease } from "@/lib/motion/tokens";
import { markReady, revealIn } from "@/lib/motion/reveal";

/** Layer scale: the slack per edge, (SCALE − 1) / 2, must exceed the travel (amplitude × SCALE). */
const LAYER_SCALE = 1.28;

export default function mount(root: HTMLElement, ctx: { tier: "full" | "mobile"; fine: boolean }) {
  const amplitude = ctx.tier === "full" ? dist.parallaxPct : dist.parallaxPct / 2;

  const c = gsap.context(() => {
    revealIn(root);
    markReady(root);

    root.querySelectorAll<HTMLElement>("[data-parallax-frame]").forEach((frame) => {
      const layer = frame.firstElementChild as HTMLElement | null;
      const block = frame.closest<HTMLElement>("[data-block]") ?? frame;
      if (!layer) return;
      // Slack for the travel. A percentage height cannot be used here: the frame's height comes from
      // aspect-ratio, against which a child's percentage height does not resolve. Scaling is
      // layout-independent and composes with the yPercent below (visual travel = amplitude × SCALE).
      gsap.set(layer, { scale: LAYER_SCALE, transformOrigin: "50% 50%" });
      gsap.fromTo(
        layer,
        { yPercent: -amplitude },
        {
          yPercent: amplitude,
          ease: ease.none,
          scrollTrigger: {
            trigger: block,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
            onToggle: (st) => {
              layer.style.willChange = st.isActive ? "transform" : "";
            },
          },
        },
      );
    });
  }, root);

  return () => {
    c.revert();
    ScrollTrigger.refresh();
  };
}
