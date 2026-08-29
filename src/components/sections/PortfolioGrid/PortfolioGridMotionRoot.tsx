"use client";

import type { ComponentPropsWithoutRef } from "react";
import { MotionRoot } from "@/components/motion/MotionRoot";

const load = () => import("./PortfolioGrid.motion");

/** Client wrapper: lazily mounts PortfolioGrid.motion.ts (batched tile entrance + pointer tilt). */
export function PortfolioGridMotionRoot(props: ComponentPropsWithoutRef<"div">) {
  return <MotionRoot load={load} {...props} />;
}
