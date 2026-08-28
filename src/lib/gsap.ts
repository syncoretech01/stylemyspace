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
}

export { gsap, ScrollTrigger };
