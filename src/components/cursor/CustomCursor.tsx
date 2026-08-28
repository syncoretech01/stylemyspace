"use client";

import dynamic from "next/dynamic";
import { useMotionPreference } from "@/components/motion/useMotionPreference";

const Impl = dynamic(() => import("./CursorImpl"), { ssr: false });

/** Olive cursor halo — fine pointers with hover, full motion tier only. Never reacts to keyboard focus. */
export function CustomCursor() {
  const { tier, fine, hydrated } = useMotionPreference();
  if (!hydrated || tier !== "full" || !fine) return null;
  return <Impl />;
}
