/**
 * Materials: the swatches are dealt from a stack (brief §5, the "exploding object" moment).
 * The 2×2 layout rendered by index.tsx IS the end state. On the full tier (≥ 1024, fine pointer) this
 * module adds the assembled start: every swatch is offset onto the stage centre with a slight rotation,
 * then a scrubbed timeline moves them out to their places and the captions fade in. On the mobile tier:
 * a plain reveal. Reduced motion never loads this file.
 *
 * No gsap.matchMedia() here, on purpose: when one of its queries flips, GSAP reverts every ScrollTrigger
 * on the page, which lifts the pinned featured-work stage out of the DOM and drops keyboard focus from
 * inside it. The tier already encodes the breakpoint, and a tier change re-mounts this module.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { dur, ease, stagger } from "@/lib/motion/tokens";
import { markReady, revealIn } from "@/lib/motion/reveal";

type Ctx = { tier: "full" | "mobile"; fine: boolean };

const SWATCH = "[data-materials-swatch]";
const ROTATION_STEP = 3; // deg per swatch in the stack: −4.5, −1.5, 1.5, 4.5
const CAPTION_RISE = 8; // px

export default function mount(root: HTMLElement, { tier }: Ctx) {
  const stage = root.querySelector<HTMLElement>("[data-materials-stage]");
  const swatches = Array.from(root.querySelectorAll<HTMLElement>(SWATCH));
  const captions = swatches.map((s) => s.querySelector<HTMLElement>("figcaption")).filter((c): c is HTMLElement => !!c);

  const c = gsap.context(() => {
    if (tier !== "full" || !stage || swatches.length < 2) {
      revealIn(root);
      markReady(root);
      return;
    }
    // Header reveals only: the swatches are driven by the timeline below (both animate y).
    revealIn(root, `[data-reveal]:not(${SWATCH})`);

    // Each swatch's square image, centred on the middle of the stage. offsetLeft/Top ignore transforms,
    // so these stay exact when ScrollTrigger re-measures mid-scrub.
    const fromX = (_: number, el: Element) => {
      const s = el as HTMLElement;
      return stage.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2);
    };
    const fromY = (_: number, el: Element) => {
      const s = el as HTMLElement;
      return stage.clientHeight / 2 - (s.offsetTop + s.offsetWidth / 2); // square image: height = width
    };
    const fromRotation = (i: number) => i * ROTATION_STEP - ((swatches.length - 1) * ROTATION_STEP) / 2;

    // Initial states in the same tick as markReady: nothing flashes.
    gsap.set(swatches, { x: fromX, y: fromY, rotation: fromRotation, transformOrigin: "50% 50%" });
    if (captions.length) gsap.set(captions, { opacity: 0, y: CAPTION_RISE });
    markReady(root);

    gsap
      .timeline({
        defaults: { ease: ease.none },
        scrollTrigger: {
          trigger: stage,
          start: "top 80%",
          end: "top 18%",
          scrub: true,
          invalidateOnRefresh: true,
          onToggle: (self) => gsap.set(swatches, { willChange: self.isActive ? "transform" : "auto" }),
        },
      })
      .fromTo(
        swatches,
        { x: fromX, y: fromY, rotation: fromRotation },
        { x: 0, y: 0, rotation: 0, duration: 1, stagger: 0.05 },
        0,
      );

    // Captions fade in as the swatches land. One-shot rather than scrubbed: they are the information
    // layer, so they stay put after their first reveal when the reader scrolls back up.
    if (captions.length) {
      ScrollTrigger.create({
        trigger: stage,
        start: "top 30%",
        once: true,
        onEnter: () =>
          gsap.to(captions, { opacity: 1, y: 0, duration: dur.short, ease: ease.out, stagger: stagger.items, overwrite: true }),
      });
    }
  }, root);

  return () => c.revert();
}
