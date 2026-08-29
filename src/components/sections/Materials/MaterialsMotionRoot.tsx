"use client";

import type { ComponentPropsWithoutRef } from "react";
import { MotionRoot } from "@/components/motion/MotionRoot";

const load = () => import("./Materials.motion");

/** Client wrapper: lazily mounts Materials.motion.ts (assemble → explode scrub) on motion tiers. */
export function MaterialsMotionRoot(props: ComponentPropsWithoutRef<"div">) {
  return <MotionRoot load={load} {...props} />;
}
