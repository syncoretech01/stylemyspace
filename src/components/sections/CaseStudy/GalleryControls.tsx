"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { pad2 } from "./images";

type Props = { scrollerId: string; total: number };

const getScroller = (id: string) => document.getElementById(id);

/**
 * Prev/next for the native scroll-snap strip plus an "Image n of N" live region.
 * Static markup renders without JS; the buttons simply scroll the list by one slide.
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
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scrollerId, total]);

  const step = (dir: -1 | 1) => {
    const el = getScroller(scrollerId);
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
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
