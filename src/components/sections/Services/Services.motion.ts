/**
 * Services — entrances only. Headings, paragraphs, discipline rows and list items marked
 * [data-reveal] fade/rise in once. Nothing pins. Reduced motion never loads this module.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { markReady, revealIn } from "@/lib/motion/reveal";

export default function mount(root: HTMLElement) {
  const ctx = gsap.context(() => {
    revealIn(root);
    markReady(root);
    ScrollTrigger.refresh();
  }, root);

  return () => {
    ctx.revert();
  };
}
