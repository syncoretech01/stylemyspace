"use client";

import { useRef, type ComponentPropsWithoutRef, type ElementType } from "react";
import { useMotionModule, type MotionMount } from "./useMotionModule";

type Props = ComponentPropsWithoutRef<"div"> & {
  /** Must be a module-level constant: `const load = () => import("./Hero.motion")`. */
  load: () => Promise<{ default: MotionMount }>;
  as?: ElementType;
};

/**
 * Wraps a section as a motion root. Its *.motion.ts module is lazily loaded on motion tiers and
 * receives this element; until it marks the root ready, [data-reveal] children stay pre-hidden by CSS.
 * Usage (client file next to the section):
 *   "use client";
 *   const load = () => import("./Hero.motion");
 *   export const HeroMotionRoot = (p) => <MotionRoot load={load} {...p} />;
 */
export function MotionRoot({ load, as: Tag = "div", children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  useMotionModule(ref, load);
  return (
    <Tag ref={ref} data-motion-root="" {...rest}>
      {children}
    </Tag>
  );
}
