"use client";

import { MotionRoot } from "@/components/motion/MotionRoot";
import type { ComponentPropsWithoutRef } from "react";

const load = () => import("./Disciplines.motion");

export function DisciplinesMotionRoot(props: ComponentPropsWithoutRef<"div">) {
  return <MotionRoot load={load} {...props} />;
}
