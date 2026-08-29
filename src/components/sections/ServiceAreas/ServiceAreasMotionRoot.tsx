"use client";

import { MotionRoot } from "@/components/motion/MotionRoot";
import type { ComponentPropsWithoutRef } from "react";

const load = () => import("./ServiceAreas.motion");

export function ServiceAreasMotionRoot(props: ComponentPropsWithoutRef<"div">) {
  return <MotionRoot load={load} {...props} />;
}
