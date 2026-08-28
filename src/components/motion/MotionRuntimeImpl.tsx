"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

declare global {
  interface Window {
    /** Exposed for QA scripts (window.lenis is reserved by Lenis' own typings). */
    __lenis?: Lenis;
  }
}

export default function MotionRuntimeImpl({ tier }: { tier: "full" | "mobile" }) {
  const pathname = usePathname();

  useEffect(() => {
    ScrollTrigger.clearScrollMemory("manual");
    if (tier !== "full") return; // mobile: native scroll, ScrollTrigger only
    const lenis = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true, syncTouch: false, anchors: true });
    window.__lenis = lenis;
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete window.__lenis;
    };
  }, [tier]);

  useEffect(() => {
    // After every navigation, start from the top and re-measure once the new DOM has painted.
    if (!window.location.hash) window.__lenis?.scrollTo(0, { immediate: true, force: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());
    return () => {
      alive = false;
    };
  }, []);

  return null;
}
