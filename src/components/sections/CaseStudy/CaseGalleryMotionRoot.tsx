"use client";

import { MotionRoot } from "@/components/motion/MotionRoot";
import type { ComponentPropsWithoutRef } from "react";

const load = () => import("./CaseGallery.motion");

export function CaseGalleryMotionRoot(props: ComponentPropsWithoutRef<"section">) {
  return <MotionRoot as="section" load={load} {...props} />;
}
