"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { dur, ease } from "@/lib/motion/tokens";

/**
 * A small "View" chip that trails the pointer over project photographs ([data-cursor] frames) and is
 * not there at all the rest of the time. The native cursor is never hidden. It used to be an opaque
 * olive disc over every link and button on the site, which covered the label being pointed at.
 */
export default function CursorImpl() {
  const chipRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const chip = chipRef.current;
    if (!chip) return;
    if (window.matchMedia("(forced-colors: active)").matches) return;

    const ctx = gsap.context(() => {
      gsap.set(chip, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.9 });
      const x = gsap.quickTo(chip, "x", { duration: dur.micro, ease: ease.out });
      const y = gsap.quickTo(chip, "y", { duration: dur.micro, ease: ease.out });
      let shown = false;

      const show = (text: string, e: PointerEvent) => {
        chip.textContent = text;
        if (shown) return;
        shown = true;
        gsap.set(chip, { x: e.clientX, y: e.clientY });
        gsap.to(chip, { autoAlpha: 1, scale: 1, duration: dur.micro, ease: ease.out, overwrite: "auto" });
      };
      const hide = () => {
        if (!shown) return;
        shown = false;
        gsap.to(chip, { autoAlpha: 0, scale: 0.9, duration: dur.micro / 2, ease: ease.out, overwrite: "auto" });
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" || !shown) return;
        x(e.clientX);
        y(e.clientY);
      };
      const onOver = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const frame = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor]");
        if (frame?.dataset.cursor) show(frame.dataset.cursor, e);
        else hide();
      };
      const onVis = () => document.visibilityState === "hidden" && hide();

      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerover", onOver, { passive: true });
      document.addEventListener("pointerleave", hide);
      document.addEventListener("pointerdown", hide, { passive: true });
      document.addEventListener("visibilitychange", onVis);
      return () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerover", onOver);
        document.removeEventListener("pointerleave", hide);
        document.removeEventListener("pointerdown", hide);
        document.removeEventListener("visibilitychange", onVis);
      };
    });
    return () => ctx.revert();
  }, []);

  // Route change: whatever was under the pointer is gone.
  useEffect(() => {
    if (chipRef.current) gsap.set(chipRef.current, { autoAlpha: 0 });
  }, [pathname]);

  return (
    <div
      ref={chipRef}
      aria-hidden="true"
      className="eyebrow pointer-events-none invisible fixed top-0 left-0 z-[90] rounded-xs bg-bone px-2 py-1 text-ink"
    />
  );
}
