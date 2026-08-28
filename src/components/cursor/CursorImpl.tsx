"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { dur, ease } from "@/lib/motion/tokens";

/** Set to true to hide the native cursor (see OPEN-ITEMS OI-27). Kept visible for accessibility. */
export const HIDE_NATIVE_CURSOR = false;

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, summary, label";

export default function CursorImpl() {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!dot || !label) return;
    if (window.matchMedia("(forced-colors: active)").matches) return;

    const ctx = gsap.context(() => {
      gsap.set(dot, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 1 });
      const x = gsap.quickTo(dot, "x", { duration: dur.micro, ease: ease.out });
      const y = gsap.quickTo(dot, "y", { duration: dur.micro, ease: ease.out });
      let shown = false;
      let scale = 1;

      const setScale = (next: number, text?: string) => {
        if (text !== undefined) label.textContent = text;
        if (next === scale) return;
        scale = next;
        gsap.to(dot, { scale: next, duration: dur.micro, ease: ease.out, overwrite: "auto" });
        gsap.to(label, { autoAlpha: text ? 1 : 0, duration: dur.micro, ease: ease.out, overwrite: "auto" });
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        x(e.clientX);
        y(e.clientY);
        if (!shown) {
          shown = true;
          gsap.to(dot, { autoAlpha: 1, duration: dur.micro });
        }
      };
      const onOver = (e: PointerEvent) => {
        const target = e.target as Element | null;
        const labelled = target?.closest<HTMLElement>("[data-cursor]");
        if (labelled?.dataset.cursor) return setScale(3.5, labelled.dataset.cursor);
        if (target?.closest(INTERACTIVE)) return setScale(2, "");
        setScale(1, "");
      };
      const hide = () => {
        shown = false;
        gsap.to(dot, { autoAlpha: 0, duration: dur.micro });
      };
      const onVis = () => document.visibilityState === "hidden" && hide();

      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerover", onOver, { passive: true });
      document.addEventListener("pointerleave", hide);
      document.addEventListener("visibilitychange", onVis);
      if (HIDE_NATIVE_CURSOR) document.documentElement.style.cursor = "none";
      return () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerover", onOver);
        document.removeEventListener("pointerleave", hide);
        document.removeEventListener("visibilitychange", onVis);
        document.documentElement.style.cursor = "";
      };
    });
    return () => ctx.revert();
  }, []);

  // Route change: whatever was under the pointer is gone; drop the label.
  useEffect(() => {
    if (labelRef.current) labelRef.current.textContent = "";
    if (dotRef.current) gsap.to(dotRef.current, { scale: 1, duration: dur.micro });
  }, [pathname]);

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[90] flex size-3 items-center justify-center rounded-full bg-olive shadow-[0_0_0_1px_rgba(247,244,237,0.55)]"
    >
      <span ref={labelRef} className="text-[3px] font-sans uppercase tracking-[0.12em] text-bone opacity-0" />
    </div>
  );
}
