"use client";

import type { ComponentPropsWithoutRef } from "react";
import { MotionRoot } from "@/components/motion/MotionRoot";

const load = () => import("./Manifesto.motion");

/** Client wrapper: lazily mounts Manifesto.motion.ts (pin + word scrub) on motion tiers. */
export function ManifestoMotionRoot(props: ComponentPropsWithoutRef<"div">) {
  return <MotionRoot load={load} {...props} />;
}
