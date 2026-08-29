/**
 * Manifesto — pinned scroll-storytelling (brief §5).
 * The outer root reserves the pin distance in CSS (220svh full / 170svh mobile, see index.tsx), so
 * pinning the 100svh inner with pinSpacing:false never shifts layout. One scrubbed timeline:
 * words opacity .2 → 1 (finishing at 85 % of the pin) and the background layer scaling 1 → 1.08
 * (1.04 on mobile). Reduced motion never loads this file — the static section is the final state.
 */
import { gsap } from "@/lib/gsap";
import { dist, ease, scrub } from "@/lib/motion/tokens";
import { markReady, revealIn } from "@/lib/motion/reveal";

const WORDS_END = 0.85; // fraction of the pin at which the last word is fully opaque
const WORD_START_OPACITY = 0.2;

type Ctx = { tier: "full" | "mobile"; fine: boolean };

export default function mount(root: HTMLElement, ctx: Ctx) {
  const inner = root.querySelector<HTMLElement>("[data-manifesto-pin]");
  const bg = root.querySelector<HTMLElement>("[data-manifesto-bg]");
  const words = Array.from(root.querySelectorAll<HTMLElement>("[data-manifesto-words] .word"));

  const c = gsap.context(() => {
    // Initial states first, then hand over from the CSS pre-hide in the same tick (no flash).
    if (words.length) gsap.set(words, { opacity: WORD_START_OPACITY });
    if (bg) gsap.set(bg, { scale: 1, transformOrigin: "50% 50%" });
    revealIn(root);
    markReady(root);

    if (!inner) return;

    const tl = gsap.timeline({
      defaults: { ease: ease.none },
      scrollTrigger: {
        trigger: root,
        pin: inner,
        start: "top top",
        end: "bottom bottom",
        scrub: scrub.soft,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onToggle: (self) => {
          if (bg) gsap.set(bg, { willChange: self.isActive ? "transform" : "auto" });
        },
      },
    });

    if (words.length) {
      // Each word takes `each` of the timeline; the stagger spreads the starts so the last word
      // finishes exactly at WORDS_END.
      const each = Math.min(0.25, WORDS_END / 2);
      const stagger = words.length > 1 ? (WORDS_END - each) / (words.length - 1) : 0;
      tl.to(words, { opacity: 1, duration: each, stagger }, 0);
    }
    if (bg) {
      const endScale = ctx.tier === "mobile" ? 1.04 : dist.bgScale;
      tl.fromTo(bg, { scale: 1 }, { scale: endScale, duration: 1 }, 0);
    }
    // Pad the timeline to a full unit so the word tween maps to 85 % of the pin distance.
    if (tl.duration() < 1) tl.to({}, { duration: 1 - tl.duration() }, tl.duration());
  }, root);

  return () => c.revert();
}
