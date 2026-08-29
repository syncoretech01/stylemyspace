"use client";

import { useEffect, type ComponentPropsWithoutRef } from "react";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { useTransition } from "@/components/transition/TransitionProvider";

const load = () => import("./CaseHero.motion");
const ROOT_ID = "case-hero";

type Props = ComponentPropsWithoutRef<"header"> & { slug: string };

/**
 * Motion root for the case-study opener. When a portfolio → case Flip transition is landing on this
 * hero, the root carries `data-flip-pending` until the TransitionProvider dispatches `flip:done` on
 * the hero <img> (it bubbles here). CaseHero.motion.ts reads that flag to hold the title reveal.
 */
export function CaseHeroMotionRoot({ slug, ...props }: Props) {
  const transition = useTransition();

  useEffect(() => {
    const root = document.getElementById(ROOT_ID);
    if (!root || !transition?.isPending(slug)) return;
    root.dataset.flipPending = "";
    const done = () => delete root.dataset.flipPending;
    root.addEventListener("flip:done", done, { once: true });
    // Aborted transitions never dispatch flip:done; the provider gives up after 1.8 s.
    const timer = window.setTimeout(done, 2000);
    return () => {
      root.removeEventListener("flip:done", done);
      window.clearTimeout(timer);
      done();
    };
  }, [slug, transition]);

  return <MotionRoot as="header" id={ROOT_ID} load={load} {...props} />;
}
