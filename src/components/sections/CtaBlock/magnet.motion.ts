/**
 * Magnetic button (brief §5) — shared by the CTA block and the contact form's submit.
 *
 * Every [data-magnet] wrapper inside a motion root pulls its button toward the pointer while the
 * pointer sits inside the wrapper's box grown by ZONE px on every side: the displacement is
 * PULL × the offset from the wrapper centre, clamped to ±dist.magnetPx, applied through
 * gsap.quickTo (dur.micro / ease.out). Leaving the zone eases back to 0,0 over dur.short — no
 * elastic, nothing overshoots. The *wrapper* is measured, never the button, so the button's own
 * transform can never feed back into the hit zone. Keyboard focus moves nothing: only real mouse
 * pointermove is listened to, and callers gate this to the full tier with a fine pointer.
 */
import { gsap } from "@/lib/gsap";
import { dist, dur, ease } from "@/lib/motion/tokens";

const ZONE = 40; // px the hit zone extends beyond the wrapper
const PULL = 0.35; // fraction of the pointer offset the button travels

type QuickTo = ReturnType<typeof gsap.quickTo>;

export function attachMagnets(root: HTMLElement): () => void {
  const wrappers = Array.from(root.querySelectorAll<HTMLElement>("[data-magnet]"));
  if (!wrappers.length) return () => {};

  const stops = wrappers.map((wrapper) => {
    const target = wrapper.firstElementChild as HTMLElement | null;
    if (!target) return () => {};

    const clamp = gsap.utils.clamp(-dist.magnetPx, dist.magnetPx);
    let xTo: QuickTo | null = null;
    let yTo: QuickTo | null = null;
    let engaged = false;

    const release = () => {
      if (!engaged) return;
      engaged = false;
      // Killing the quickTo tweens is what lets the slower homing tween own x/y; they are rebuilt
      // from wherever the button has reached the next time the pointer enters the zone.
      gsap.killTweensOf(target, "x,y");
      xTo = yTo = null;
      gsap.to(target, { x: 0, y: 0, duration: dur.short, ease: ease.out });
    };

    /** Re-aim at a viewport point. Also called on scroll so a stationary pointer stays honest. */
    const track = (clientX: number, clientY: number) => {
      const r = wrapper.getBoundingClientRect();
      const inside =
        clientX >= r.left - ZONE && clientX <= r.right + ZONE && clientY >= r.top - ZONE && clientY <= r.bottom + ZONE;
      if (!inside) return release();
      if (!engaged) {
        engaged = true;
        gsap.killTweensOf(target, "x,y");
        xTo = gsap.quickTo(target, "x", { duration: dur.micro, ease: ease.out });
        yTo = gsap.quickTo(target, "y", { duration: dur.micro, ease: ease.out });
      }
      xTo?.(clamp((clientX - (r.left + r.width / 2)) * PULL));
      yTo?.(clamp((clientY - (r.top + r.height / 2)) * PULL));
    };

    let last: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last = { x: e.clientX, y: e.clientY };
      track(last.x, last.y);
    };
    // The page can move under a still pointer (wheel, Lenis, a focus() scroll): without this the
    // button would keep a stale offset until the next mouse move. Only measures while engaged.
    const onScroll = () => {
      if (engaged && last) track(last.x, last.y);
    };
    const onLeave = () => {
      last = null;
      release();
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", onLeave);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onLeave);
      gsap.killTweensOf(target, "x,y");
      gsap.set(target, { x: 0, y: 0 });
    };
  });

  return () => stops.forEach((stop) => stop());
}
