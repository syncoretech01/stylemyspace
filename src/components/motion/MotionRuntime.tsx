"use client";

import dynamic from "next/dynamic";
import { useMotionPreference } from "./useMotionPreference";

const Impl = dynamic(() => import("./MotionRuntimeImpl"), { ssr: false });

/** Mounts Lenis + ScrollTrigger wiring (a lazy chunk) only when a motion tier is active. */
export function MotionRuntime() {
  const { tier, hydrated } = useMotionPreference();
  if (!hydrated || tier === "unknown" || tier === "reduced") return null;
  return <Impl tier={tier} />;
}
