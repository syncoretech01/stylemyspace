"use client";

import { MotionRoot } from "@/components/motion/MotionRoot";
import type { ComponentPropsWithoutRef } from "react";

const load = () => import("./FeaturedWork.motion");

/** Motion root for the featured-work pin: reserves the pin distance in CSS, the module corrects it. */
export function FeaturedWorkMotionRoot(props: ComponentPropsWithoutRef<"div">) {
  return <MotionRoot load={load} {...props} />;
}
