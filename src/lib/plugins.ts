/** Memoised lazy loaders for the heavier GSAP plugins. */
import { gsap } from "@/lib/gsap";

let flipPromise: Promise<typeof import("gsap/Flip").Flip> | null = null;
let splitPromise: Promise<typeof import("gsap/SplitText").SplitText> | null = null;
let observerPromise: Promise<typeof import("gsap/Observer").Observer> | null = null;

export function loadFlip() {
  flipPromise ??= import("gsap/Flip").then((m) => {
    gsap.registerPlugin(m.Flip);
    return m.Flip;
  });
  return flipPromise;
}

export function loadSplitText() {
  splitPromise ??= import("gsap/SplitText").then((m) => {
    gsap.registerPlugin(m.SplitText);
    return m.SplitText;
  });
  return splitPromise;
}

export function loadObserver() {
  observerPromise ??= import("gsap/Observer").then((m) => {
    gsap.registerPlugin(m.Observer);
    return m.Observer;
  });
  return observerPromise;
}
