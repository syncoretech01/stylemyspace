"use client";

import { useEffect, type RefObject } from "react";
import { useMotionPreference } from "./useMotionPreference";

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
  deps: ReadonlyArray<unknown> = [],
) {
  const { tier, fine, hydrated } = useMotionPreference();
  useEffect(() => {
    if (!hydrated || tier === "unknown" || tier === "reduced") return;
    const root = ref.current;
    if (!root) return;
    let cancelled = false;
    let cleanup: void | (() => void);
    load()
      .then((mod) => {
        if (cancelled) return;
        cleanup = mod.default(root, { tier, fine });
      })
      .catch(() => {
        // Motion chunk failed: reveal the final state instead of leaving content hidden.
        root.dataset.motionReady = "1";
      });
    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, fine, hydrated, ref, load, ...deps]);
}
