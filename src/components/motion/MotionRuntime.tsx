"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMotionPreference } from "./useMotionPreference";
import { whenIdleAfterPreloader } from "./useMotionModule";

const Impl = dynamic(() => import("./MotionRuntimeImpl"), { ssr: false });

/**
 * Mounts Lenis + ScrollTrigger wiring (a lazy chunk) only when a motion tier is active,
 * and only after the preloader has exited and the main thread is idle (never on the LCP path).
 */
export function MotionRuntime() {
  const { tier, hydrated } = useMotionPreference();
  const [ready, setReady] = useState(false);
  useEffect(() => whenIdleAfterPreloader(() => setReady(true)), []);
  if (!ready || !hydrated || tier === "unknown" || tier === "reduced") return null;
  return <Impl tier={tier} />;
}
