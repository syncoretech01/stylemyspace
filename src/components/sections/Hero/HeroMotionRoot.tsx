"use client";

import type { ComponentPropsWithoutRef } from "react";
import { MotionRoot } from "@/components/motion/MotionRoot";

// Module-level constant so useMotionModule's effect deps stay stable across renders.
const load = () => import("./Hero.motion");

/**
 * Motion root for the home hero. Renders the <section> itself (HeroCanvas locates the LCP image
 * via `closest("section")`) and lazily mounts ./Hero.motion.ts on the full / mobile tiers.
 */
export function HeroMotionRoot(props: ComponentPropsWithoutRef<"section">) {
  return <MotionRoot as="section" load={load} {...props} />;
}
