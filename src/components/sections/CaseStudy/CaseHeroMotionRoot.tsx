"use client";

import type { ComponentPropsWithoutRef } from "react";
import { MotionRoot } from "@/components/motion/MotionRoot";

const load = () => import("./CaseHero.motion");

/** Motion root for the case-study opener. */
export function CaseHeroMotionRoot(props: ComponentPropsWithoutRef<"header">) {
  return <MotionRoot as="header" load={load} {...props} />;
}
