"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionPreference } from "@/components/motion/useMotionPreference";

type Pending = {
  slug: string;
  href: string;
  clone: HTMLImageElement;
  timeout: number;
  startedAt: number;
  /** The tile image we hid behind the clone; restored on every exit path. */
  source: HTMLImageElement;
  /** The destination hero, hidden while the clone flies so the two never double up. */
  hero?: HTMLImageElement;
};

type Api = {
  /** Begin a Flip transition from `img` (a tile image) toward the case-study hero for `slug`. */
  start(img: HTMLImageElement, slug: string, href: string): void;
  /** True when a transition is in flight for this slug (the destination hero may delay its own reveal). */
  isPending(slug: string): boolean;
};

const Ctx = createContext<Api | null>(null);
export const useTransition = () => useContext(Ctx);

const ABORT_MS = 1800;
const DECODE_RACE_MS = 600;
const DURATION = 1.2;

/**
 * Owns a persistent, fixed overlay that survives App Router navigations. A clone of the clicked
 * image is FLIP-ped from the tile's rect to the destination hero's rect (matched by
 * img[data-flip-target="<slug>"]), then removed. Every failure path removes the clone.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<Pending | null>(null);
  const pathname = usePathname();
  const { tier } = useMotionPreference();

  /** Every exit path runs through here: the clone goes and both hidden images come back. */
  const clear = (fade = true) => {
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    window.clearTimeout(p.timeout);
    p.hero?.style.removeProperty("visibility");
    const remove = () => {
      p.clone.remove();
      // Restore the tile last: while the clone is fading it still covers the tile's slot.
      p.source.style.removeProperty("visibility");
    };
    if (!fade) return remove();
    import("@/lib/gsap").then(({ gsap }) => gsap.to(p.clone, { autoAlpha: 0, duration: 0.3, onComplete: remove }), remove);
  };

  const [api] = useState<Api>(() => ({
    start(img, slug, href) {
      const overlay = overlayRef.current;
      if (!overlay) return;
      clear(false);
      import("@/lib/plugins").then(async ({ loadFlip }) => {
        const Flip = await loadFlip();
        const clone = img.cloneNode(true) as HTMLImageElement;
        clone.removeAttribute("srcset");
        clone.removeAttribute("sizes");
        clone.removeAttribute("id");
        clone.removeAttribute("data-flip-id");
        clone.src = img.currentSrc || img.src;
        clone.setAttribute("alt", "");
        Object.assign(clone.style, { position: "fixed", margin: "0", objectFit: "cover", willChange: "transform,width,height" });
        overlay.appendChild(clone);
        Flip.fit(clone, img, { absolute: true, scale: false });
        img.style.visibility = "hidden";
        const timeout = window.setTimeout(() => clear(true), ABORT_MS);
        pendingRef.current = { slug, href, clone, timeout, startedAt: performance.now(), source: img };
      });
    },
    isPending: (slug) => pendingRef.current?.slug === slug,
  }));

  // Destination handling: when the route for the pending slug has committed, fit the clone to its hero.
  useEffect(() => {
    const p = pendingRef.current;
    if (!p) return;
    if (pathname !== p.href) {
      clear(true);
      return;
    }
    let cancelled = false;
    const raf = requestAnimationFrame(async () => {
      const hero = document.querySelector<HTMLImageElement>(`img[data-flip-target="${CSS.escape(p.slug)}"]`);
      if (!hero || cancelled) return clear(true);
      // The new route paints its hero immediately; without this the viewer sees the full-bleed hero
      // AND the travelling clone at once. Recorded on the pending record so clear() always restores it.
      p.hero = hero;
      hero.style.visibility = "hidden";
      const decode = hero.complete && hero.naturalWidth > 0 ? Promise.resolve() : hero.decode().catch(() => {});
      await Promise.race([decode, new Promise((r) => setTimeout(r, DECODE_RACE_MS))]);
      if (cancelled || pendingRef.current !== p) {
        hero.style.removeProperty("visibility");
        return;
      }
      const { loadFlip } = await import("@/lib/plugins");
      const Flip = await loadFlip();
      const { ease } = await import("@/lib/motion/tokens");
      window.clearTimeout(p.timeout);
      Flip.fit(p.clone, hero, {
        absolute: true,
        scale: false,
        duration: DURATION,
        ease: ease.inOut,
        onComplete: () => {
          hero.style.removeProperty("visibility");
          p.clone.remove();
          p.source.style.removeProperty("visibility");
          if (pendingRef.current === p) pendingRef.current = null;
          hero.dispatchEvent(new CustomEvent("flip:done", { bubbles: true }));
          // The click moved the reader to a new page; a normal <Link> would have reset focus.
          document.querySelector<HTMLElement>("#case-title")?.focus({ preventScroll: true });
        },
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
     
  }, [pathname]);

  useEffect(() => {
    const onPop = () => clear(false);
    const onVis = () => document.visibilityState === "hidden" && clear(false);
    window.addEventListener("popstate", onPop);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("visibilitychange", onVis);
    };
     
  }, []);

  // Reduced motion: never start; anything in flight is dropped.
  useEffect(() => {
    if (tier === "reduced") clear(false);
     
  }, [tier]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div ref={overlayRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[85]" />
    </Ctx.Provider>
  );
}
