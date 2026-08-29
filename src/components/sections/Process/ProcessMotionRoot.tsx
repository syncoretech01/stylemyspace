"use client";

import type { ComponentPropsWithoutRef } from "react";
import { MotionRoot } from "@/components/motion/MotionRoot";

const load = () => import("./Process.motion");

export function ProcessMotionRoot(props: ComponentPropsWithoutRef<"div">) {
  return <MotionRoot load={load} {...props} />;
}
