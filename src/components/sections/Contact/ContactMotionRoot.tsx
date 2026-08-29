"use client";

import type { ComponentPropsWithoutRef } from "react";
import { MotionRoot } from "@/components/motion/MotionRoot";

const load = () => import("./Contact.motion");

/**
 * Client wrapper: lazily mounts Contact.motion.ts on motion tiers. Used once per /contact section
 * (intro, form, details) so each gets its own reveal scope.
 */
export function ContactMotionRoot(props: ComponentPropsWithoutRef<"div">) {
  return <MotionRoot load={load} {...props} />;
}
