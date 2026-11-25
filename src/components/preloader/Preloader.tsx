"use client";

import { useEffect, useRef, useState } from "react";
import { isPreloaderPending, markPreloaderDone, markPreloaderLifting, subscribe, track } from "./assetLoader";
import "./preloader.css";

const MIN_MS = 900; // let the logotype draw
const EXIT_BY_MS = 1300; // + 700ms curtain = 2 s hard cap
const WIPE_MS = 700;
const FACE_WAIT_MS = 400; // draw in the fallback serif rather than hold an empty curtain any longer

/**
 * Runs once per session. The inline <head> script decides (before first paint) whether this
 * session has already seen it; when not pending the element is display:none and unmounts.
 */
export function Preloader() {
  const ref = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isPreloaderPending()) {
      setGone(true);
      return;
    }
    try {
      sessionStorage.setItem("sms.preloaded", "1");
    } catch {
      /* private mode: preloader simply runs again next time */
    }

    const inertTargets = Array.from(document.querySelectorAll<HTMLElement>("header, main, footer"));
    inertTargets.forEach((t) => t.setAttribute("inert", ""));

    const start = performance.now();
    // Real milestones. Weights are relative; absent milestones just drop out of the total.
    track(Promise.resolve(), 10);
    const fonts = document.fonts?.ready ?? Promise.resolve();
    track(fonts, 20);
    const lcp = document.querySelector<HTMLImageElement>("img[data-lcp]");
    if (lcp) track(lcp.complete && lcp.naturalWidth > 0 ? Promise.resolve() : lcp.decode().catch(() => {}), 45);
    track(
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((r) => window.addEventListener("load", () => r(), { once: true })),
      10,
    );
    // The logotype needs the display face only. Waiting for document.fonts.ready held an empty curtain
    // until the body face and the italic had arrived too.
    const logo = el.querySelector(".preloader__text");
    const face = logo && document.fonts ? document.fonts.load(`500 46px ${getComputedStyle(logo).fontFamily}`) : Promise.resolve();
    const draw = () => el.classList.add("is-drawing");
    Promise.race([face, new Promise((r) => window.setTimeout(r, FACE_WAIT_MS))]).then(draw, draw);

    let target = 0;
    let shown = 0;
    let raf = 0;
    let exiting = false;
    const unsubscribe = subscribe((p) => {
      target = Math.max(target, p);
    });

    const finish = () => {
      inertTargets.forEach((t) => t.removeAttribute("inert"));
      markPreloaderDone();
      setGone(true);
    };
    const exit = () => {
      if (exiting) return;
      exiting = true;
      unsubscribe();
      if (pctRef.current) pctRef.current.textContent = "100%";
      el.classList.add("is-done");
      markPreloaderLifting();
      const timer = window.setTimeout(finish, WIPE_MS + 60);
      el.addEventListener(
        "transitionend",
        () => {
          window.clearTimeout(timer);
          finish();
        },
        { once: true },
      );
    };

    const loop = () => {
      const elapsed = performance.now() - start;
      shown += (target * 100 - shown) * 0.12;
      if (pctRef.current) pctRef.current.textContent = `${Math.round(shown)}%`;
      if ((target >= 1 && elapsed >= MIN_MS && shown > 97) || elapsed >= EXIT_BY_MS) {
        exit();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
    };
  }, []);

  if (gone) return null;

  return (
    <div id="preloader" ref={ref} role="status" aria-live="polite" aria-label="Loading">
      <div className="preloader__inner">
        <svg className="preloader__logo" viewBox="0 0 640 80" aria-hidden="true" focusable="false">
          <text className="preloader__text" x="50%" y="56" textAnchor="middle">
            Style My Space
          </text>
        </svg>
        <span ref={pctRef} className="preloader__pct" aria-hidden="true">
          0%
        </span>
      </div>
    </div>
  );
}
