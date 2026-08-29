"use client";

import type { ComponentPropsWithoutRef } from "react";
import { MotionRoot } from "@/components/motion/MotionRoot";

const load = () => import("./CtaBlock.motion");

/** Client wrapper: lazily mounts CtaBlock.motion.ts (reveals + magnetic button) on motion tiers. */
export function CtaBlockMotionRoot(props: ComponentPropsWithoutRef<"div">) {
  return <MotionRoot load={load} {...props} />;
}
