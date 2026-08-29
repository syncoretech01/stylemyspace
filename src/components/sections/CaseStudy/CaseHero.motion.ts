/**
 * Case-study hero motion (lazy chunk, framework-free). Mounted by <CaseHeroMotionRoot> on the
 * full / mobile tiers; never loaded under reduced motion (the static markup is the final state).
 *
 *  - h1        masked line reveal (SplitText mask:"lines"). Plays as soon as the split is ready,
 *              unless a Flip transition is landing on the hero image: then it waits for the
 *              `flip:done` event (bubbling from img[data-flip-target]) with a 1.6 s fallback.
 *  - the rest  category / description / note / meta list fade-rise via [data-reveal].
 */
import { gsap } from "@/lib/gsap";
import { dur, ease } from "@/lib/motion/tokens";
import { markReady, revealIn } from "@/lib/motion/reveal";
import { splitLinesReveal, type LineReveal } from "@/lib/motion/split";

const FLIP_FALLBACK_MS = 1600;

export default function mount(root: HTMLElement) {
  const title = root.querySelector<HTMLElement>("h1");

  let disposed = false;
  let reveal: LineReveal | null = null;
  let splitReady = false;
  let wantPlay = false;
  let played = false;
  let fallback = 0;

  const play = () => {
    if (played || disposed) return;
    played = true;
    if (reveal) reveal.play();
    else if (title) gsap.to(title, { autoAlpha: 1, duration: dur.short, ease: ease.out, overwrite: true });
  };

  const requestPlay = () => {
    wantPlay = true;
    window.clearTimeout(fallback);
    root.removeEventListener("flip:done", requestPlay);
    if (splitReady) play();
  };

  const onFocusIn = (e: FocusEvent) => {
    if (title && e.target instanceof Node && title.contains(e.target)) requestPlay();
  };

  const ctx = gsap.context(() => {
    // 1. Hidden states first, then hand off from the CSS pre-hide in the same tick. The h1 stays
    //    fully hidden until SplitText has wrapped its lines (async: plugin chunk + fonts).
    if (title) gsap.set(title, { autoAlpha: 0 });
    revealIn(root, "[data-reveal]:not(h1)");
    markReady(root);

    // 2. Decide when the title may play.
    if ("flipPending" in root.dataset) {
      root.addEventListener("flip:done", requestPlay, { once: true });
      fallback = window.setTimeout(requestPlay, FLIP_FALLBACK_MS);
    } else {
      requestPlay();
    }
    root.addEventListener("focusin", onFocusIn, { passive: true });

    if (!title) return;
    splitLinesReveal(title)
      .then((lr) => {
        if (disposed) {
          lr?.revert();
          return;
        }
        reveal = lr;
        splitReady = true;
        // Lines already sit at yPercent 110 inside their masks (paused from-tween, immediateRender).
        if (lr) gsap.set(title, { autoAlpha: 1 });
        if (wantPlay) play();
      })
      .catch(() => {
        if (disposed) return;
        splitReady = true;
        if (wantPlay) play();
      });
  }, root);

  return () => {
    disposed = true;
    window.clearTimeout(fallback);
    root.removeEventListener("flip:done", requestPlay);
    root.removeEventListener("focusin", onFocusIn);
    reveal?.revert();
    reveal = null;
    ctx.revert();
  };
}
