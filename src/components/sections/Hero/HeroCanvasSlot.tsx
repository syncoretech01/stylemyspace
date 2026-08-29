"use client";

import { useMotionPreference } from "@/components/motion/useMotionPreference";
import { HeroCanvas } from "@/components/three/HeroCanvas";

/**
 * Renders <HeroCanvas /> only once hydrated on the "full" tier. HeroCanvas already no-ops elsewhere,
 * but its opacity-0 host would otherwise sit in the DOM as a full-bleed invisible element on the
 * mobile and reduced-motion tiers (where nothing ever fades it in).
 */
export function HeroCanvasSlot() {
  const { tier, hydrated } = useMotionPreference();
  if (!hydrated || tier !== "full") return null;
  return <HeroCanvas />;
}
