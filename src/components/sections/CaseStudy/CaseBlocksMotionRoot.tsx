"use client";

import { MotionRoot } from "@/components/motion/MotionRoot";
import type { ComponentPropsWithoutRef } from "react";

const load = () => import("./CaseBlocks.motion");

export function CaseBlocksMotionRoot(props: ComponentPropsWithoutRef<"div">) {
  return <MotionRoot load={load} {...props} />;
}
