/**
 * Process — the layer-transformation stack.
 * The <li> cards are position: sticky (CSS, motion tiers only) at header + i × offset. Here each
 * covered card scales down (origin top centre) and its content dims to .85 while the NEXT card
 * travels from the viewport bottom to its own sticky offset; the last card never animates.
 * The dim is on the inner body, not the card, so the opaque bone background never lets the card
 * underneath bleed through. No pin, no snap: the scrub is 1:1 with native scroll and every value
 * is function-based so resizes stay exact.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ease } from "@/lib/motion/tokens";
import { markReady, revealIn } from "@/lib/motion/reveal";

const SCALE_STEP = 0.03;
const COVERED_OPACITY = 0.85;

/** Resolved sticky offset (px) of a card: header height + i × stack offset, straight from CSS. */
function stickyTop(card: HTMLElement, index: number, stack: HTMLElement): number {
  const resolved = parseFloat(getComputedStyle(card).top);
  if (Number.isFinite(resolved)) return resolved;
  // Fallback if the browser reports the unresolved calc(): measure the header + the CSS variable.
  const header = document.querySelector<HTMLElement>("header")?.offsetHeight ?? 72;
  const offset = parseFloat(getComputedStyle(stack).getPropertyValue("--stack-offset")) || 14;
  return header + index * offset;
}

export default function mount(root: HTMLElement) {
  const ctx = gsap.context(() => {
    const stack = root.querySelector<HTMLElement>("[data-process-stack]");
    const cards = stack ? Array.from(stack.querySelectorAll<HTMLElement>("[data-process-card]")) : [];
    const n = cards.length;

    if (stack && n > 1) {
      // Initial state first (same tick as markReady) so there is never a flash.
      gsap.set(cards, { transformOrigin: "50% 0%", scale: 1 });

      cards.forEach((card, i) => {
        if (i === n - 1) return; // the last card is the resting layer
        const next = cards[i + 1];
        if (!next) return;
        const body = card.querySelector<HTMLElement>("[data-process-card-body]");
        const tl = gsap.timeline({
          defaults: { ease: ease.none },
          scrollTrigger: {
            trigger: next,
            start: "top bottom",
            end: () => `top top+=${stickyTop(next, i + 1, stack)}`,
            scrub: true,
            invalidateOnRefresh: true,
            onToggle: (self) => gsap.set(card, { willChange: self.isActive ? "transform" : "auto" }),
          },
        });
        tl.to(card, { scale: 1 - (n - 1 - i) * SCALE_STEP }, 0);
        if (body) tl.to(body, { opacity: COVERED_OPACITY }, 0);
      });
    }

    // Heading, lede and the card contents fade/rise in once. The cards themselves are not
    // [data-reveal]: their opacity belongs to the scrubbed stack above.
    revealIn(root);
    markReady(root);
    ScrollTrigger.refresh();
  }, root);

  return () => {
    ctx.revert();
  };
}
