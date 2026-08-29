/**
 * Portfolio grid — batched tile entrance + 3D pointer tilt (brief §5).
 *
 * Entrance: every [data-reveal] (header lines and the tiles themselves) rises through
 * ScrollTrigger.batch — `top 92%`, once, stagger.items — via the shared revealIn helper.
 * Tilt: full tier + fine pointer only. Each tile's <figure> gets transformPerspective 900 and
 * follows the pointer's position inside its own box on rotationX/rotationY through gsap.quickTo,
 * clamped to ±dist.tiltDeg; leaving eases back to flat over dur.short (the quickTo tweens are
 * killed first so the slower homing tween owns the rotation — same pattern as magnet.motion.ts).
 * The image scale and the name roll are CSS on :hover / :focus-visible, so keyboard users get
 * the same treatment without any of this; nothing here is required to make content visible.
 * Reduced motion never loads this module — the static markup is the final state.
 */
import { gsap } from "@/lib/gsap";
import { dist, dur, ease } from "@/lib/motion/tokens";
import { markReady, revealIn } from "@/lib/motion/reveal";

type Ctx = { tier: "full" | "mobile"; fine: boolean };
type QuickTo = ReturnType<typeof gsap.quickTo>;

/** Matches the CSS `perspective` the design was drawn at: shallow enough that 6° stays subtle. */
const PERSPECTIVE = 900;

const cardOf = (tile: HTMLElement) => tile.querySelector<HTMLElement>("figure");

export default function mount(root: HTMLElement, ctx: Ctx) {
  const tiles = Array.from(root.querySelectorAll<HTMLElement>(".tile"));
  const teardown: Array<() => void> = [];

  const c = gsap.context(() => {
    revealIn(root);
    markReady(root);

    // The Flip transition clones the tile image from its live bounding rect, so any tilt still
    // applied when the link is activated would hand the clone a rotated, oversized box (and the
    // hero would visibly snap). Flatten the pressed card before FlipLink's click handler runs.
    // Registered on every tier: a coarse-pointer tap can also leave a stale :hover behind.
    const onPointerDown = (e: PointerEvent) => {
      const tile = (e.target as HTMLElement | null)?.closest<HTMLElement>(".tile");
      if (!tile || !root.contains(tile)) return;
      const card = cardOf(tile);
      if (!card) return;
      gsap.killTweensOf(card, "rotationX,rotationY");
      gsap.set(card, { rotationX: 0, rotationY: 0 });
    };
    root.addEventListener("pointerdown", onPointerDown, { passive: true, capture: true });
    teardown.push(() => root.removeEventListener("pointerdown", onPointerDown, true));

    if (ctx.tier !== "full" || !ctx.fine || !tiles.length) return;

    const clamp = gsap.utils.clamp(-dist.tiltDeg, dist.tiltDeg);

    tiles.forEach((tile) => {
      const card = cardOf(tile);
      if (!card) return;
      gsap.set(card, { transformPerspective: PERSPECTIVE, transformOrigin: "50% 50%" });

      let xTo: QuickTo | null = null;
      let yTo: QuickTo | null = null;
      let engaged = false;

      const release = () => {
        if (!engaged) return;
        engaged = false;
        gsap.killTweensOf(card, "rotationX,rotationY");
        xTo = yTo = null;
        gsap.to(card, {
          rotationX: 0,
          rotationY: 0,
          duration: dur.short,
          ease: ease.out,
          onComplete: () => {
            gsap.set(card, { willChange: "auto" });
            // Only lower the tile once it is flat again, so a returning corner is never clipped.
            gsap.set(tile, { zIndex: "auto" });
          },
        });
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const r = card.getBoundingClientRect();
        if (!r.width || !r.height) return;
        if (!engaged) {
          engaged = true;
          gsap.killTweensOf(card, "rotationX,rotationY");
          // A tilted corner reaches ~2 % of the card width past its box; the grid's 24–32 px gap
          // absorbs that, and lifting the hovered tile keeps it over its neighbours regardless.
          gsap.set(tile, { zIndex: 1 });
          gsap.set(card, { willChange: "transform" });
          xTo = gsap.quickTo(card, "rotationY", { duration: dur.micro, ease: ease.out });
          yTo = gsap.quickTo(card, "rotationX", { duration: dur.micro, ease: ease.out });
        }
        // Pointer right of centre tips the right edge away (rotationY +), pointer above centre
        // tips the top edge toward the viewer (rotationX +).
        xTo?.(clamp(((e.clientX - r.left) / r.width - 0.5) * 2 * dist.tiltDeg));
        yTo?.(clamp((0.5 - (e.clientY - r.top) / r.height) * 2 * dist.tiltDeg));
      };

      tile.addEventListener("pointermove", onMove, { passive: true });
      tile.addEventListener("pointerleave", release);
      tile.addEventListener("pointercancel", release);
      window.addEventListener("blur", release);
      teardown.push(() => {
        tile.removeEventListener("pointermove", onMove);
        tile.removeEventListener("pointerleave", release);
        tile.removeEventListener("pointercancel", release);
        window.removeEventListener("blur", release);
        gsap.killTweensOf(card, "rotationX,rotationY");
      });
    });
  }, root);

  return () => {
    teardown.splice(0).forEach((fn) => fn());
    c.revert();
  };
}
