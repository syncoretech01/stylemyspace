/** Media queries shared by gsap.matchMedia() and useMotionPreference(). Keep in sync with globals.css. */
export const MQ = {
  desktop: "(min-width: 1024px)",
  mobile: "(max-width: 1023.98px)",
  reduced: "(prefers-reduced-motion: reduce)",
  motion: "(prefers-reduced-motion: no-preference)",
  coarse: "(pointer: coarse)",
  fine: "(pointer: fine) and (hover: hover)",
} as const;

export type MotionTier = "unknown" | "reduced" | "mobile" | "full";

/** Evaluate the tier in the browser. Mirrors the inline <head> script in layout.tsx. */
export function evaluateTier(): MotionTier {
  if (typeof window === "undefined") return "unknown";
  if (window.matchMedia(MQ.reduced).matches) return "reduced";
  if (window.matchMedia(MQ.coarse).matches || window.innerWidth < 1024) return "mobile";
  return "full";
}
