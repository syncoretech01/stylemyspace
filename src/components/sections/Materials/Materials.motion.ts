/**
 * Materials — the exploding-object moment (brief §5).
 * The exploded layout rendered by index.tsx IS the end state. On the desktop stage (≥ lg) this
 * module adds the assembled start: every swatch is offset onto the connectors' centre dot with a
 * slight rotation, then a scrubbed timeline explodes them outward, draws the connectors and finally
 * fades the captions in. Below lg the stage is a 2×2 grid without connectors — a plain reveal.
 * Reduced motion never loads this file.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { MQ } from "@/lib/motion/queries";
import { dur, ease, stagger } from "@/lib/motion/tokens";
import { markReady, revealIn } from "@/lib/motion/reveal";

const SWATCH = "[data-materials-swatch]";
const CENTRE = "[data-materials-centre]";
const ROTATION_STEP = 3; // deg per swatch in the stack: −4.5, −1.5, 1.5, 4.5
const CAPTION_RISE = 8; // px

/** The tier is irrelevant here: the layout breakpoint (gsap.matchMedia) decides the branch. */
export default function mount(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>("[data-materials-stage]");
  const swatches = Array.from(root.querySelectorAll<HTMLElement>(SWATCH));
  const captions = swatches.map((s) => s.querySelector<HTMLElement>("figcaption")).filter((c): c is HTMLElement => !!c);
  const paths = Array.from(root.querySelectorAll<SVGPathElement>("[data-materials-connector]"));

  const mm = gsap.matchMedia();
  const c = gsap.context(() => {
    // Desktop stage: absolute swatches + connectors. Layout (not tier) decides, so a coarse-pointer
    // tablet in landscape still gets the explosion its lg layout was built for.
    mm.add(MQ.desktop, () => {
      if (!stage || swatches.length < 2) {
        revealIn(root);
        markReady(root);
        return;
      }
      // Header reveals only — the swatches are driven by the timeline below (both animate y).
      revealIn(root, `[data-reveal]:not(${SWATCH})`);

      // Assembled stack: each swatch image (the square top of the figure) centred on the point the
      // connectors radiate from, so the explosion reads as coming out of the brass dot. Measured
      // rather than assumed — the dot's position is derived from the stage geometry in index.tsx.
      const dot = root.querySelector<HTMLElement>(CENTRE);
      const origin = () => {
        const s = stage.getBoundingClientRect();
        const d = dot?.getBoundingClientRect();
        return d && d.width
          ? { x: d.left + d.width / 2 - s.left, y: d.top + d.height / 2 - s.top }
          : { x: s.width / 2, y: s.height / 2 };
      };
      const centreX = () => origin().x;
      const centreY = () => origin().y;
      const fromX = (i: number, el: Element) => {
        const s = el as HTMLElement;
        return centreX() - (s.offsetLeft + s.offsetWidth / 2);
      };
      const fromY = (i: number, el: Element) => {
        const s = el as HTMLElement;
        return centreY() - (s.offsetTop + s.offsetWidth / 2); // square image: height = width
      };
      const fromRotation = (i: number) => i * ROTATION_STEP - ((swatches.length - 1) * ROTATION_STEP) / 2;

      // Initial states in the same tick as markReady: nothing flashes.
      gsap.set(swatches, { x: fromX, y: fromY, rotation: fromRotation, transformOrigin: "50% 50%" });
      if (paths.length) gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
      if (captions.length) gsap.set(captions, { opacity: 0, y: CAPTION_RISE });
      markReady(root);

      const tl = gsap.timeline({
        defaults: { ease: ease.none },
        scrollTrigger: {
          trigger: stage,
          start: "top 75%",
          end: "center 40%",
          scrub: true,
          invalidateOnRefresh: true,
          onToggle: (self) => gsap.set(swatches, { willChange: self.isActive ? "transform" : "auto" }),
        },
      });
      // 1. Explode: stack → exploded positions (function-based start values re-measure on refresh).
      tl.fromTo(
        swatches,
        { x: fromX, y: fromY, rotation: fromRotation },
        { x: 0, y: 0, rotation: 0, duration: 1, stagger: 0.05 },
        0,
      );
      // 2. Draw the connectors from the centre outward while the swatches settle.
      if (paths.length) {
        tl.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, stagger: 0.08 }, 0.7);
      }

      // 3. Captions fade in once the explosion has finished. One-shot rather than scrubbed: the
      // captions are the information layer, so they stay put after their first reveal instead of
      // re-hiding (and piling up under the re-assembled stack) when the reader scrolls back up.
      if (captions.length) {
        ScrollTrigger.create({
          trigger: stage,
          start: "center 45%",
          once: true,
          onEnter: () =>
            gsap.to(captions, { opacity: 1, y: 0, duration: dur.short, ease: ease.out, stagger: stagger.items, overwrite: true }),
        });
      }
    });

    // Mobile stage: 2×2 grid, no connectors. Plain fade-up reveals (headers + swatches).
    mm.add(MQ.mobile, () => {
      revealIn(root);
      markReady(root);
    });
  }, root);

  return () => {
    mm.revert();
    c.revert();
  };
}
