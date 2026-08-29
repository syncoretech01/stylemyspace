"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
// Local copy of images.ts#pad2: that module imports the server-side content loader (zod + projects.json)
// and must never be pulled into a client bundle.
const pad2 = (n: number) => String(n).padStart(2, "0");

type Props = { scrollerId: string; total: number };

const getScroller = (id: string) => document.getElementById(id);

/**
 * Prev/next for the gallery plus an "Image n of N" live region.
 *
 * Static markup renders without JS. Two transports, so the same buttons drive both states of the
 * gallery without this component ever importing GSAP:
 *  - a cancelable `gallery:step` is dispatched on the track; CaseGallery.motion.ts (full tier)
 *    claims it with preventDefault() and moves the 3D slider,
 *  - if nothing claims it, the buttons scroll the native scroll-snap strip by one slide.
 * The index follows `gallery:change` from the slider, or the strip's own scroll position.
 */
export function GalleryControls({ scrollerId, total }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = getScroller(scrollerId);
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const first = el.firstElementChild as HTMLElement | null;
      const stride = first ? first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0") : 1;
      const next = Math.min(total - 1, Math.max(0, Math.round(el.scrollLeft / Math.max(1, stride))));
      setIndex((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<{ index?: number }>).detail?.index;
      if (typeof next === "number") setIndex((prev) => (prev === next ? prev : next));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("gallery:change", onChange);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("gallery:change", onChange);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scrollerId, total]);

  const step = (dir: -1 | 1) => {
    const el = getScroller(scrollerId);
    if (!el) return;
    // Claimed by the perspective slider? Then it has already moved.
    const claimed = !el.dispatchEvent(new CustomEvent("gallery:step", { detail: { dir }, cancelable: true }));
    if (claimed) return;
    const first = el.firstElementChild as HTMLElement | null;
    if (!first) return;
    const stride = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * stride, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="flex items-center gap-2">
      <p className="eyebrow mr-1 text-olive tabular-nums" aria-hidden>
        {pad2(index + 1)} <span className="text-taupe">/</span> {pad2(total)}
      </p>
      <p className="visually-hidden" aria-live="polite" aria-atomic>
        Image {index + 1} of {total}
      </p>
      <Button variant="outline" className="size-6 rounded-full px-0" aria-label="Previous image" onClick={() => step(-1)}>
        <span aria-hidden>←</span>
      </Button>
      <Button variant="outline" className="size-6 rounded-full px-0" aria-label="Next image" onClick={() => step(1)}>
        <span aria-hidden>→</span>
      </Button>
    </div>
  );
}
