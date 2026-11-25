"use client";

import { useSyncExternalStore } from "react";
import { MQ, evaluateTier, type MotionTier } from "@/lib/motion/queries";

export type MotionPreference = {
  tier: MotionTier;
  /** Fine pointer with hover: the cursor chip, tilt and magnetic effects only mount when true. */
  fine: boolean;
  hydrated: boolean;
};

const SERVER: MotionPreference = { tier: "unknown", fine: false, hydrated: false };

/** A change of tier re-mounts every motion module on the page, so it has to be a settled fact. */
const SETTLE_MS = 250;

/**
 * One store for the whole page. The value is only ever replaced by `evaluate()`, never recomputed while
 * rendering: a transient size mid-resize (a window being snapped, a full-page capture) used to be picked
 * up by whichever component rendered next, tearing down and re-hiding sections the reader had scrolled.
 */
let current: MotionPreference | null = null;
let timer = 0;
let stop: (() => void) | null = null;
const listeners = new Set<() => void>();

const read = (): MotionPreference => ({ tier: evaluateTier(), fine: window.matchMedia(MQ.fine).matches, hydrated: true });

function evaluate() {
  window.clearTimeout(timer);
  const next = read();
  if (current && current.tier === next.tier && current.fine === next.fine) return;
  current = next;
  listeners.forEach((l) => l());
}

function settle() {
  window.clearTimeout(timer);
  timer = window.setTimeout(evaluate, SETTLE_MS);
}

function start() {
  const reduced = window.matchMedia(MQ.reduced);
  const pointers = [MQ.coarse, MQ.fine].map((q) => window.matchMedia(q));
  // An accessibility preference applies at once; geometry and pointer changes have to settle first.
  reduced.addEventListener("change", evaluate);
  pointers.forEach((m) => m.addEventListener("change", settle));
  window.addEventListener("resize", settle, { passive: true });
  return () => {
    window.clearTimeout(timer);
    reduced.removeEventListener("change", evaluate);
    pointers.forEach((m) => m.removeEventListener("change", settle));
    window.removeEventListener("resize", settle);
  };
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  stop ??= start();
  return () => {
    listeners.delete(callback);
    if (listeners.size) return;
    stop?.();
    stop = null;
  };
}

const snapshot = (): MotionPreference => (current ??= read());

/**
 * Motion tier from the user's environment. Server and first client render return `unknown`,
 * so markup never branches on it: use it only to mount enhancements after hydration.
 */
export function useMotionPreference(): MotionPreference {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER);
}
