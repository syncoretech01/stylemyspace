/**
 * About — entrances only. Headings, paragraphs and list items marked [data-reveal] fade/rise in
 * once; the portrait's image eases from scale 1.04 to 1 as it enters (the frame clips, so nothing
 * bleeds). Nothing pins. Reduced motion never loads this module: the markup is the final state.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { dur, ease } from "@/lib/motion/tokens";
import { markReady, revealIn } from "@/lib/motion/reveal";

const PORTRAIT_SCALE = 1.04;

export default function mount(root: HTMLElement) {
  const ctx = gsap.context(() => {
    const portrait = root.querySelector<HTMLElement>("[data-portrait] img");
    if (portrait) {
      gsap.set(portrait, { scale: PORTRAIT_SCALE, transformOrigin: "50% 50%" });
      gsap.to(portrait, {
        scale: 1,
        duration: dur.long,
        ease: ease.out,
        scrollTrigger: { trigger: portrait, start: "top 92%", once: true },
      });
    }
    revealIn(root);
    markReady(root);
    ScrollTrigger.refresh();
  }, root);

  return () => {
    ctx.revert();
  };
}
