/**
 * Hero motion (lazy chunk, framework-free). Mounted by <HeroMotionRoot> on the full / mobile tiers
 * once the preloader has exited; never loaded under reduced motion (the static markup is final).
 *
 *  - h1[data-hero="title"]   masked line reveal (SplitText mask:"lines", yPercent 110, stagger .08),
 *                            paused until the preloader has finished, then played.
 *  - eyebrow / lede / ctas   fade-rise with a short stagger, starting as the lines are drawing in.
 *  - a[data-hero="cue"]      autoAlpha 0 over the first 50 px of scroll (visibility:hidden also drops
 *                            it from the tab order); restored when the user returns to the top.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { dist, dur, ease, stagger } from "@/lib/motion/tokens";
import { markReady } from "@/lib/motion/reveal";
import { splitLinesReveal, type LineReveal } from "@/lib/motion/split";
import { onPreloaderDone } from "@/components/preloader/assetLoader";

const q = (root: HTMLElement, key: string) => root.querySelector<HTMLElement>(`[data-hero="${key}"]`);

// Same behaviour on both tiers (no tilt / magnetic / cursor here), so the tier context is unused.
export default function mount(root: HTMLElement) {
  const title = q(root, "title");
  const supporting = ["eyebrow", "lede", "ctas"].map((k) => q(root, k)).filter((el): el is HTMLElement => !!el);
  const cue = q(root, "cue");

  let disposed = false;
  let reveal: LineReveal | null = null;
  let offPreloader = () => {};
  let supportingTween: gsap.core.Tween | null = null;

  const ctx = gsap.context(() => {
    // ---- 1. Initial hidden states, then hand off from the CSS pre-hide in the same tick. ----
    // The h1 stays fully hidden until SplitText has wrapped its lines (async: plugin chunk + fonts),
    // otherwise it would flash complete and then jump behind the masks.
    if (title) gsap.set(title, { autoAlpha: 0 });
    if (supporting.length) gsap.set(supporting, { opacity: 0, y: dist.rise });
    markReady(root);

    // ---- 2. Supporting copy: a short stagger, overlapping the tail of the line draw. ----
    const playSupporting = () => {
      if (!supporting.length || supportingTween) return;
      supportingTween = gsap.to(supporting, {
        opacity: 1,
        y: 0,
        duration: dur.enter,
        ease: ease.out,
        stagger: stagger.items,
        delay: dur.micro + stagger.lines * 2,
        overwrite: true,
      });
    };

    // ---- 3. Scroll cue: gone after the first 50 px, back when the reader returns to the top. ----
    if (cue) {
      ScrollTrigger.create({
        start: 50,
        end: "max",
        animation: gsap.to(cue, { autoAlpha: 0, duration: dur.micro, ease: ease.out, paused: true }),
        toggleActions: "play none none reverse",
      });
    }

    // ---- 4. Keyboard users must never land on hidden content. ----
    root.addEventListener("focusin", onFocusIn, { passive: true });

    // ---- 5. Headline: split into masked lines, hold until the preloader curtain has lifted. ----
    const showTitleFallback = () => {
      if (title) gsap.to(title, { autoAlpha: 1, duration: dur.short, ease: ease.out, overwrite: true });
    };
    const armPlayback = () => {
      offPreloader = onPreloaderDone(() => {
        if (disposed) return;
        reveal?.play();
        playSupporting();
      });
    };

    if (!title) {
      armPlayback();
      return;
    }

    splitLinesReveal(title)
      .then((lr) => {
        if (disposed) {
          lr?.revert();
          return;
        }
        reveal = lr;
        // Lines already sit at yPercent 110 inside their masks (paused from-tween, immediateRender).
        if (lr) gsap.set(title, { autoAlpha: 1 });
        else showTitleFallback();
        armPlayback();
      })
      .catch(() => {
        if (disposed) return;
        showTitleFallback();
        armPlayback();
      });
  }, root);

  function onFocusIn() {
    if (disposed) return;
    reveal?.play();
    if (title && !reveal) gsap.set(title, { autoAlpha: 1 });
    if (supporting.length) gsap.to(supporting, { opacity: 1, y: 0, duration: dur.micro, ease: ease.out, overwrite: true });
  }

  return () => {
    disposed = true;
    offPreloader();
    root.removeEventListener("focusin", onFocusIn);
    reveal?.revert();
    reveal = null;
    ctx.revert();
  };
}
