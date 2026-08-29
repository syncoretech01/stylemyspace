"use client";

import type { ComponentPropsWithoutRef } from "react";
import { MotionRoot } from "@/components/motion/MotionRoot";

const load = () => import("./About.motion");

export function AboutMotionRoot(props: ComponentPropsWithoutRef<"div">) {
  return <MotionRoot load={load} {...props} />;
}
