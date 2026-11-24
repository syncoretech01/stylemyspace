"use client";

import { useEffect, type RefObject } from "react";
import { useMotionPreference } from "./useMotionPreference";
import { isPreloaderPending, onPreloaderDone } from "@/components/preloader/assetLoader";

/** Run `cb` after the preloader has exited and the main thread is idle — keeps GSAP off the LCP critical path. */
export function whenIdleAfterPreloader(cb: () => void, timeout = 1500) {
  let cancelIdle = () => {};
  const off = onPreloaderDone(() => {
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => cb(), { timeout });
      cancelIdle = () => cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(cb, 200);
      cancelIdle = () => window.clearTimeout(id);
    }
  });
  return () => {
    off();
    cancelIdle();
  };
}

/**
 * While the preloader's curtain is down: run `cb` as soon as the LCP image has arrived, so a module can
 * take its starting position unseen without ever competing with that image for bandwidth. With no
 * curtain (or if it lifts first) this is `whenIdleAfterPreloader`.
 */
export function whenCurtainedOrIdle(cb: () => void) {
  if (!isPreloaderPending()) return whenIdleAfterPreloader(cb);
  let settled = false;
  const run = () => {
    if (settled) return;
    settled = true;
    cb();
  };
  const off = whenIdleAfterPreloader(run);
  const img = document.querySelector<HTMLImageElement>("img[data-lcp]");
  const arrived = !img || (img.complete && img.naturalWidth > 0) ? Promise.resolve() : img.decode().catch(() => {});
  arrived.then(run);
  return () => {
    settled = true;
    off();
  };
}

export type MotionContext = { tier: "full" | "mobile"; fine: boolean };
/** A motion module mounts onto a section root and returns a cleanup. Framework-free, lazily loaded. */
export type MotionMount = (root: HTMLElement, ctx: MotionContext) => void | (() => void);

/**
 * Lazily load a section's *.motion.ts module when a motion tier is active.
 * Reduced motion / unknown tier: nothing loads and the CSS final state stays.
 */
export function useMotionModule(
  ref: RefObject<HTMLElement | null>,
  load: () => Promise<{ default: MotionMount }>,
  early = false,
) {
  const { tier, fine, hydrated } = useMotionPreference();
  useEffect(() => {
    if (!hydrated || tier === "unknown" || tier === "reduced") return;
    const root = ref.current;
    if (!root) return;
    let cancelled = false;
    let cleanup: void | (() => void);
    const stop = (early ? whenCurtainedOrIdle : whenIdleAfterPreloader)(() => {
      load()
        .then((mod) => {
          if (cancelled) return;
          cleanup = mod.default(root, { tier, fine });
        })
        .catch(() => {
          // Motion chunk failed: reveal the final state instead of leaving content hidden.
          root.dataset.motionReady = "1";
        });
    });
    return () => {
      cancelled = true;
      stop();
      cleanup?.();
    };
  }, [tier, fine, hydrated, ref, load, early]);
}
