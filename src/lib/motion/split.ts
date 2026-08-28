/**
 * Masked line reveal helper (SplitText 3.13+). Call inside a gsap.context() from a motion module.
 * Returns a paused timeline; call .play() when the section is ready (e.g. after the preloader).
 * Reduced motion never reaches this code — the heading renders as plain text.
 */
import { gsap } from "@/lib/gsap";
import { loadSplitText } from "@/lib/plugins";
import { dist, dur, ease, stagger } from "@/lib/motion/tokens";

export type LineReveal = { play(): void; revert(): void };

export async function splitLinesReveal(
  el: HTMLElement,
  opts: { delay?: number; autoPlay?: boolean } = {},
): Promise<LineReveal | null> {
  const SplitText = await loadSplitText();
  await document.fonts?.ready;
  let played = !!opts.autoPlay;
  let tween: gsap.core.Tween | null = null;
  const split = SplitText.create(el, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    linesClass: "split-line",
    aria: "auto",
    onSplit(self) {
      tween = gsap.from(self.lines, {
        yPercent: dist.lineRise,
        duration: dur.enter,
        ease: ease.out,
        stagger: stagger.lines,
        delay: opts.delay ?? 0,
        paused: !played,
      });
      if (played) tween.progress(1);
      return tween;
    },
  });
  return {
    play() {
      played = true;
      tween?.play();
    },
    revert() {
      split.revert();
    },
  };
}
