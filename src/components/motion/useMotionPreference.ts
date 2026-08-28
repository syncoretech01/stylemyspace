"use client";

import { useSyncExternalStore } from "react";
import { MQ, evaluateTier, type MotionTier } from "@/lib/motion/queries";

export type MotionPreference = {
  tier: MotionTier;
  /** Fine pointer with hover — custom cursor, tilt and magnetic effects only mount when true. */
  fine: boolean;
  hydrated: boolean;
};

const SERVER: MotionPreference = { tier: "unknown", fine: false, hydrated: false };
let cached: MotionPreference | null = null;

function snapshot(): MotionPreference {
  const next: MotionPreference = { tier: evaluateTier(), fine: window.matchMedia(MQ.fine).matches, hydrated: true };
  if (cached && cached.tier === next.tier && cached.fine === next.fine) return cached;
  cached = next;
  return next;
}

function subscribe(callback: () => void) {
  const lists = [MQ.reduced, MQ.coarse, MQ.fine].map((q) => window.matchMedia(q));
  lists.forEach((m) => m.addEventListener("change", callback));
  window.addEventListener("resize", callback, { passive: true });
  return () => {
    lists.forEach((m) => m.removeEventListener("change", callback));
    window.removeEventListener("resize", callback);
  };
}

/**
 * Motion tier from the user's environment. Server and first client render return `unknown`,
 * so markup never branches on it — use it only to mount enhancements after hydration.
 */
export function useMotionPreference(): MotionPreference {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER);
}
