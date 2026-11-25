/**
 * The one place GSAP core and ScrollTrigger are registered.
 * Only *.motion.ts modules (lazy chunks) may import this file.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  ScrollTrigger.defaults({ markers: false });

  // A refresh takes every pinned element out of its spacer and puts it back. Moving a node in the DOM
  // blurs whatever is focused inside it, so a resize would drop a keyboard user out of the pinned track.
  let focused: HTMLElement | null = null;
  ScrollTrigger.addEventListener("refreshInit", () => {
    focused = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
  });
  ScrollTrigger.addEventListener("refresh", () => {
    if (focused?.isConnected && document.activeElement === document.body) focused.focus({ preventScroll: true });
    focused = null;
  });
}

/** Run `fn` (which may re-parent pinned nodes) without losing keyboard focus from inside `root`. */
export function keepFocus(root: HTMLElement, fn: () => void) {
  const active = document.activeElement;
  fn();
  if (active instanceof HTMLElement && root.contains(active) && document.activeElement !== active) {
    active.focus({ preventScroll: true });
  }
}

export { gsap, ScrollTrigger };
