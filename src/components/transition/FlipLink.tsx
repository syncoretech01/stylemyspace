"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, type ComponentPropsWithoutRef, type MouseEvent } from "react";
import { useMotionPreference } from "@/components/motion/useMotionPreference";
import { useTransition } from "./TransitionProvider";

type Props = Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "onClick"> & {
  href: Route;
  /** Project slug; the tile must contain <img data-flip-id={slug}> and the destination hero <img data-flip-target={slug}>. */
  slug: string;
};

/**
 * A Link that, on a motion tier, FLIPs the tile image into the case-study hero before navigating.
 * Modifier clicks, middle clicks and reduced motion fall through to plain navigation.
 */
export function FlipLink({ href, slug, children, ...rest }: Props) {
  const router = useRouter();
  const transition = useTransition();
  const { tier, hydrated } = useMotionPreference();
  const enabled = hydrated && tier !== "unknown" && tier !== "reduced" && !!transition;

  // Warm the Flip plugin chunk while the user is looking at the grid.
  useEffect(() => {
    if (enabled) import("@/lib/plugins").then((m) => m.loadFlip()).catch(() => {});
  }, [enabled]);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!enabled || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const img = e.currentTarget.querySelector<HTMLImageElement>(`img[data-flip-id="${CSS.escape(slug)}"]`) ?? e.currentTarget.querySelector("img");
    if (!img || !(img.complete && img.naturalWidth > 0)) return;
    e.preventDefault();
    transition!.start(img, slug, href);
    router.push(href);
  };

  return (
    <Link href={href} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
