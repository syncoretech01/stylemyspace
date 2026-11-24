/**
 * Hero motion (lazy chunk, framework-free). Mounted by <HeroMotionRoot> on the full / mobile tiers;
 * never loaded under reduced motion (the static markup is final).
 *
 *  - Behind the preloader's curtain (first visit): h1[data-hero="title"] is split into masked lines
 *    while nobody can see it, and the lines rise as the curtain lifts.
 *  - With no curtain (every later visit): the headline is already painted, so it is NEVER hidden. It
 *    eases up from the CSS pre-hide offset, like every other LCP-bearing reveal on the site.
 *  - lede / ctas fade-rise with a short stagger in both cases.
 */
import { gsap } from "@/lib/gsap";
import { dist, dur, ease, stagger } from "@/lib/motion/tokens";
import { markReady } from "@/lib/motion/reveal";
import { splitLinesReveal, type LineReveal } from "@/lib/motion/split";
import { isPreloaderPending, onPreloaderLift } from "@/components/preloader/assetLoader";

/** The curtain leaves bottom-up in 0.7 s, so the headline is uncovered last: start as it clears the photograph. */
const LIFT_LEAD = 0.3;
/** How long after that a late SplitText chunk is waited for before the plain headline shows. */
const SPLIT_GRACE_MS = 160;

const q = (root: HTMLElement, key: string) => root.querySelector<HTMLElement>(`[data-hero="${key}"]`);

// Same behaviour on both tiers (no tilt / magnetic / cursor here), so the tier context is unused.
export default function mount(root: HTMLElement) {
  const title = q(root, "title");
  const supporting = ["lede", "ctas"].map((k) => q(root, k)).filter((el): el is HTMLElement => !!el);
  const curtained = isPreloaderPending();

  let disposed = false;
  let reveal: LineReveal | null = null;
  let settled = false; // the title has been shown one way or the other
  let grace = 0;
  let lifting = false;
  let lift: gsap.core.Tween | null = null;
  let offPreloader = () => {};
  let supportingTween: gsap.core.Tween | null = null;

  const ctx = gsap.context(() => {
    // ---- 1. Starting positions, then hand off from the CSS pre-hide in the same tick. ----
    if (title) gsap.set(title, curtained ? { autoAlpha: 0 } : { y: dist.rise });
    if (supporting.length) gsap.set(supporting, { opacity: 0, y: dist.rise });
    markReady(root);

    const playSupporting = (delay: number) => {
      if (!supporting.length || supportingTween) return;
      supportingTween = gsap.to(supporting, {
        opacity: 1,
        y: 0,
        duration: dur.enter,
        ease: ease.out,
        stagger: stagger.items,
        delay,
        overwrite: true,
      });
    };

    // ---- 2. Keyboard users must never land on hidden content. ----
    root.addEventListener("focusin", onFocusIn, { passive: true });

    // ---- 3. No curtain: nothing painted is ever taken away. ----
    if (!curtained || !title) {
      settled = true;
      if (title) gsap.to(title, { y: 0, duration: dur.enter, ease: ease.out });
      const start = () => playSupporting(0);
      if (curtained) offPreloader = onPreloaderLift(start);
      else start();
      return;
    }

    // ---- 4. Curtain down: split unseen, play as it lifts. ----
    const playTitle = () => {
      if (settled || disposed) return;
      settled = true;
      window.clearTimeout(grace);
      if (reveal) {
        gsap.set(title, { autoAlpha: 1 });
        reveal.play();
      } else {
        gsap.to(title, { autoAlpha: 1, duration: dur.short, ease: ease.out, overwrite: true });
      }
    };
    splitLinesReveal(title)
      .then((lr) => {
        // Too late, or gone: leave the plain headline alone.
        if (disposed || settled) return void lr?.revert();
        reveal = lr;
        if (lifting) playTitle();
      })
      .catch(() => {});
    offPreloader = onPreloaderLift(() => {
      lift = gsap.delayedCall(LIFT_LEAD, () => {
        if (disposed) return;
        lifting = true;
        playSupporting(dur.micro + stagger.lines * 2);
        if (reveal) playTitle();
        else grace = window.setTimeout(playTitle, SPLIT_GRACE_MS);
      });
    });
  }, root);

  function onFocusIn() {
    if (disposed) return;
    if (title && !settled) {
      settled = true;
      gsap.set(title, { autoAlpha: 1 });
      reveal?.play();
    }
    if (supporting.length) gsap.to(supporting, { opacity: 1, y: 0, duration: dur.micro, ease: ease.out, overwrite: true });
  }

  return () => {
    disposed = true;
    window.clearTimeout(grace);
    lift?.kill();
    offPreloader();
    root.removeEventListener("focusin", onFocusIn);
    reveal?.revert();
    reveal = null;
    ctx.revert();
  };
}
