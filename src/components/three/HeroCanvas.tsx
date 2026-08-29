"use client";

import { useEffect, useRef } from "react";
import { useMotionPreference } from "@/components/motion/useMotionPreference";
import { isPreloaderPending, onPreloaderDone, track } from "@/components/preloader/assetLoader";
import type { HeroScene } from "./heroScene";

type Props = {
  /** Selector (within the hero section) of the already-decoded <img> to lift onto the plane. */
  imageSelector?: string;
};

/**
 * Mounts the three.js displacement plane over the hero <img> on the "full" motion tier only,
 * after the preloader has exited, and only when the WebGL probe reports hardware acceleration.
 * Under every other condition the static <img> beneath simply remains — it is also the LCP element.
 */
export function HeroCanvas({ imageSelector = "img[data-lcp]" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { tier, hydrated } = useMotionPreference();

  useEffect(() => {
    if (!hydrated || tier !== "full") return;
    const host = hostRef.current;
    const section = host?.closest<HTMLElement>("section") ?? host?.parentElement ?? null;
    if (!host || !section) return;
    const img = section.querySelector<HTMLImageElement>(imageSelector);
    if (!img) return;

    let disposed = false;
    let scene: HeroScene | null = null;
    let detachPointer = () => {};

    const boot = async () => {
      const { getSharedContext } = await import("./webgl-probe");
      if (disposed || !getSharedContext()) return;
      if (!(img.complete && img.naturalWidth > 0)) {
        await img.decode().catch(() => {});
      }
      if (disposed) return;
      // Hand three a source whose reported size IS the bitmap size (see HeroSource in heroScene.ts).
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      if (!width || !height) return;
      let source: ImageBitmap | HTMLImageElement = img;
      if (typeof createImageBitmap === "function") {
        // Pre-flip here: WebGL cannot flip an ImageBitmap at upload time.
        source = await createImageBitmap(img, { imageOrientation: "flipY" }).catch(() => img);
      }
      if (disposed) {
        if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) source.close();
        return;
      }
      const load = import("./heroScene");
      const mod = await (isPreloaderPending() ? track(load, 15) : load);
      if (disposed) return;
      const preFlipped = typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap;
      scene = mod.createHeroScene(host, { source, width, height, preFlipped }, {
        onReady: () => host.classList.add("is-ready"),
      });
      if (!scene) return;
      scene.start();
      const onMove = (e: PointerEvent) => {
        const rect = section.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        scene?.setPointer(x, y);
      };
      const onLeave = () => scene?.setPointer(0, 0);
      section.addEventListener("pointermove", onMove, { passive: true });
      section.addEventListener("pointerleave", onLeave, { passive: true });
      detachPointer = () => {
        section.removeEventListener("pointermove", onMove);
        section.removeEventListener("pointerleave", onLeave);
      };
    };

    // Start after the preloader (or on idle when the preloader is not running this session).
    let cancelIdle = () => {};
    const off = onPreloaderDone(() => {
      if (typeof requestIdleCallback === "function") {
        const id = requestIdleCallback(() => void boot(), { timeout: 400 });
        cancelIdle = () => cancelIdleCallback(id);
      } else {
        const id = window.setTimeout(() => void boot(), 120);
        cancelIdle = () => window.clearTimeout(id);
      }
    });

    return () => {
      disposed = true;
      off();
      cancelIdle();
      detachPointer();
      scene?.dispose();
      host.classList.remove("is-ready");
    };
  }, [hydrated, tier, imageSelector]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="hero-canvas-host pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[800ms] ease-out [&.is-ready]:opacity-100 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full"
    />
  );
}
