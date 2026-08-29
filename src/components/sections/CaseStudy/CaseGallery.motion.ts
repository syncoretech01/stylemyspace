/**
 * Case-study gallery — 3D perspective slider (brief §5).
 *
 * The static markup is a native horizontal scroll-snap strip and that IS the design on the mobile
 * tier and under reduced motion (this module never loads there). On the full tier the strip is
 * taken out of native scrolling and re-staged in perspective: the track becomes the stage
 * (`perspective: 1200px`, overflow visible so nothing clips the rotated slides — the section clips
 * the x-axis) and every slide is absolutely centred, then offset from the active one:
 *
 *     offset = i − position
 *     x         = offset × slideWidth × 0.82
 *     z         = −|offset| × 220
 *     rotationY = −offset × 8
 *     opacity   = 1 while |offset| ≤ 2, fading to 0 by |offset| = 3
 *
 * Slides that reach opacity 0 are also `display:none` — off-stage images must not linger as
 * invisible boxes (paint cost, QA's stuck-element probe, screen-reader noise).
 *
 * Input: Observer drag (`pointer,touch` — never `wheel`, scroll is never hijacked), the existing
 * prev/next buttons (they dispatch a cancelable `gallery:step` on the track and fall back to
 * `scrollBy` when this module is not mounted) and ArrowLeft/ArrowRight/Home/End while focus is
 * inside the region. Every position change moves the roving tabindex to the active figure, marks
 * the rest `inert` + `aria-hidden`, and dispatches `gallery:change` so <GalleryControls> updates
 * its counter and its aria-live "Image n of N".
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { loadObserver } from "@/lib/plugins";
import { dist, dur, ease } from "@/lib/motion/tokens";
import { markReady, revealIn } from "@/lib/motion/reveal";
import type { MotionMount } from "@/components/motion/useMotionModule";

const PERSPECTIVE = 1200; // px, on the stage
const X_FACTOR = 0.82; // slide widths between neighbours
const Z_STEP = 220; // px pushed back per step away from the active slide
const ROT_STEP = 8; // deg of rotationY per step
const OPAQUE_SPAN = 2; // |offset| ≤ this is fully opaque; 0 by OPAQUE_SPAN + 1
const FLICK_VELOCITY = 250; // px/s above which a drag throws on to the next slide
const RESIZE_DEBOUNCE = 0.15; // s

/** Restores an element's inline style attribute exactly as it was found. */
function styleSnapshot(el: HTMLElement) {
  const before = el.getAttribute("style");
  return () => {
    if (before === null) el.removeAttribute("style");
    else el.setAttribute("style", before);
  };
}

const mount: MotionMount = (root, ctx) => {
  const track = root.querySelector<HTMLElement>("[data-gallery-track]");
  const slides = track ? Array.from(track.querySelectorAll<HTMLElement>("[data-gallery-slide]")) : [];
  const restores: Array<() => void> = [];

  const c = gsap.context(() => {
    // Mobile tier, cover-only projects and single-image galleries keep the native strip.
    if (ctx.tier !== "full" || !track || slides.length < 2) {
      revealIn(root);
      markReady(root);
      return;
    }

    const total = slides.length;
    const figures = slides.map((s) => s.querySelector<HTMLElement>("figure"));

    // Header copy only: the figures are staged by the slider, not by the shared reveal.
    revealIn(root, "[data-reveal]:not(figure)");

    // ---------------------------------------------------------------- measure (before absolutising)
    let stride = 0;
    let stageHeight = 0;
    const measure = () => {
      const first = slides[0];
      stride = (first ? first.offsetWidth : 0) * X_FACTOR;
      const cs = getComputedStyle(track);
      const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      stageHeight = slides.reduce((max, s) => Math.max(max, s.offsetHeight), 0) + padY;
    };
    measure();

    // ---------------------------------------------------------------- the stage
    restores.push(styleSnapshot(track));
    const hadLenisPrevent = track.hasAttribute("data-lenis-prevent");
    if (hadLenisPrevent) {
      track.removeAttribute("data-lenis-prevent");
      restores.push(() => track.setAttribute("data-lenis-prevent", ""));
    }
    track.scrollLeft = 0;
    Object.assign(track.style, {
      position: "relative",
      overflow: "visible", // never clip the rotated slides — the section clips x
      scrollSnapType: "none",
      touchAction: "pan-y", // vertical drags still scroll the page
      perspective: `${PERSPECTIVE}px`,
      transformStyle: "preserve-3d",
      cursor: "grab",
      height: `${stageHeight}px`,
    });

    slides.forEach((slide) => {
      restores.push(styleSnapshot(slide));
      Object.assign(slide.style, { position: "absolute", top: "0", left: "50%", margin: "0" });
    });
    gsap.set(slides, { xPercent: -50, transformOrigin: "50% 50%", force3D: true });

    // ---------------------------------------------------------------- rendering
    let position = 0; // fractional while dragging
    let active = 0;
    const hidden = slides.map(() => false);
    let hideCall: gsap.core.Tween | null = null;

    const opacityFor = (offset: number) => gsap.utils.clamp(0, 1, OPAQUE_SPAN + 1 - Math.abs(offset));

    const setHidden = (i: number, hide: boolean) => {
      if (hidden[i] === hide) return;
      hidden[i] = hide;
      const slide = slides[i];
      if (slide) slide.style.display = hide ? "none" : "";
    };

    /** Fold every off-stage slide out of layout once the current transition has landed. */
    const syncHidden = () => slides.forEach((_, i) => setHidden(i, opacityFor(i - position) === 0));

    const render = (next: number, animate: boolean) => {
      position = gsap.utils.clamp(0, total - 1, next);
      hideCall?.kill();
      hideCall = null;
      slides.forEach((slide, i) => {
        const offset = i - position;
        const away = Math.abs(offset);
        const opacity = opacityFor(offset);
        if (opacity > 0) setHidden(i, false); // reveal before it animates in
        // Paint order is set outright: it must not interpolate through wrong stacking.
        slide.style.zIndex = String(total - Math.round(away));
        const vars: gsap.TweenVars = {
          x: offset * stride,
          z: -away * Z_STEP,
          rotationY: -offset * ROT_STEP,
          opacity,
          overwrite: "auto",
        };
        if (animate) gsap.to(slide, { ...vars, duration: dur.short, ease: ease.inOut });
        else gsap.set(slide, vars);
      });
      if (animate) hideCall = gsap.delayedCall(dur.short, syncHidden);
      else syncHidden();
    };

    // ---------------------------------------------------------------- a11y state
    const announce = () => {
      track.dispatchEvent(new CustomEvent("gallery:change", { detail: { index: active }, bubbles: true }));
    };

    const applyRovingTabindex = (moveFocus: boolean) => {
      const focused = document.activeElement;
      const stealsFocus = moveFocus && figures.some((f, i) => f === focused && i !== active);
      slides.forEach((slide, i) => {
        const on = i === active;
        if (on) {
          slide.removeAttribute("inert");
          slide.removeAttribute("aria-hidden");
        } else {
          slide.setAttribute("inert", "");
          slide.setAttribute("aria-hidden", "true");
        }
        const figure = figures[i];
        if (figure) figure.tabIndex = on ? 0 : -1;
      });
      // The roving item moved out from under the caret: take the focus with it.
      if (stealsFocus) figures[active]?.focus({ preventScroll: true });
    };

    slides.forEach((slide, i) => {
      restores.push(() => {
        slide.removeAttribute("inert");
        slide.removeAttribute("aria-hidden");
        const figure = figures[i];
        if (figure) figure.tabIndex = 0;
      });
    });

    const goTo = (index: number, animate = true) => {
      const next = gsap.utils.clamp(0, total - 1, Math.round(index));
      const changed = next !== active;
      active = next;
      render(active, animate);
      applyRovingTabindex(changed);
      // Always published, so <GalleryControls> also re-syncs on mount (a tier switch can arrive
      // with the strip's own scroll index still on screen). Re-publishing the same index is a
      // no-op in React, so the live region never announces twice.
      announce();
    };

    // ---------------------------------------------------------------- initial state (before markReady)
    goTo(0, false);
    gsap.set(track, { opacity: 0, y: dist.rise });
    markReady(root);

    // Entrance: the stage fades/rises in like every other [data-reveal] group.
    const show = (duration: number) =>
      gsap.to(track, { opacity: 1, y: 0, duration, ease: ease.out, overwrite: true });
    ScrollTrigger.create({ trigger: track, start: "top 92%", once: true, onEnter: () => show(dur.enter) });

    // ---------------------------------------------------------------- input
    const onFocusIn = () => show(dur.micro); // a keyboard user must never land on a hidden stage
    root.addEventListener("focusin", onFocusIn, { passive: true });
    restores.push(() => root.removeEventListener("focusin", onFocusIn));

    // Prev/next: <GalleryControls> dispatches a cancelable event and only falls back to
    // scrollBy() when nothing claims it (mobile tier, or before this chunk has loaded).
    const onStep = (event: Event) => {
      event.preventDefault();
      const dir = (event as CustomEvent<{ dir?: number }>).detail?.dir ?? 1;
      goTo(active + dir);
    };
    track.addEventListener("gallery:step", onStep);
    restores.push(() => track.removeEventListener("gallery:step", onStep));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      let next: number;
      if (event.key === "ArrowLeft") next = active - 1;
      else if (event.key === "ArrowRight") next = active + 1;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = total - 1;
      else return;
      event.preventDefault();
      goTo(next);
    };
    root.addEventListener("keydown", onKeyDown);
    restores.push(() => root.removeEventListener("keydown", onKeyDown));

    // Pressing on a photo would otherwise start the browser's native image drag, which swallows the
    // pointer stream mid-gesture (Observer never sees the release).
    const onNativeDrag = (event: Event) => event.preventDefault();
    track.addEventListener("dragstart", onNativeDrag);
    restores.push(() => track.removeEventListener("dragstart", onNativeDrag));

    // Focus arriving on a slide by any other route (e.g. a browser find) becomes the active slide.
    const onSlideFocus = (event: FocusEvent) => {
      const slide = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-gallery-slide]");
      const index = slide ? slides.indexOf(slide) : -1;
      if (index >= 0 && index !== active) goTo(index);
    };
    track.addEventListener("focusin", onSlideFocus);
    restores.push(() => track.removeEventListener("focusin", onSlideFocus));

    // ---------------------------------------------------------------- resize
    let resizeCall: gsap.core.Tween | null = null;
    const onResize = () => {
      resizeCall?.kill();
      resizeCall = gsap.delayedCall(RESIZE_DEBOUNCE, () => {
        measure();
        track.style.height = `${stageHeight}px`;
        render(active, false);
      });
    };
    window.addEventListener("resize", onResize, { passive: true });
    restores.push(() => {
      window.removeEventListener("resize", onResize);
      resizeCall?.kill();
      hideCall?.kill();
    });

    // ---------------------------------------------------------------- drag (async plugin chunk)
    let disposed = false;
    restores.push(() => {
      disposed = true;
    });
    let dragFrom = 0;
    loadObserver()
      .then((Observer) => {
        if (disposed) return;
        const observer = Observer.create({
          target: track,
          type: "pointer,touch", // never "wheel": the page scroll stays the page's
          lockAxis: true,
          dragMinimum: 4,
          tolerance: 4,
          onDragStart: () => {
            // Grab the stack where it is *drawn*, so seizing a running transition never jumps.
            const first = slides[0];
            const drawn = first && stride ? -(Number(gsap.getProperty(first, "x")) || 0) / stride : position;
            dragFrom = drawn;
            render(drawn, false);
            track.style.cursor = "grabbing";
            track.style.userSelect = "none";
          },
          onDrag: (self) => {
            if (self.axis === "y" || !stride) return;
            render(dragFrom - ((self.x ?? 0) - (self.startX ?? 0)) / stride, false);
          },
          onDragEnd: (self) => {
            track.style.cursor = "grab";
            track.style.userSelect = "";
            if (self.axis === "y") return;
            // Snap to the nearest slide, or one further on when the release was a flick.
            const velocity = self.velocityX;
            let target = Math.round(position);
            if (Math.abs(velocity) > FLICK_VELOCITY) {
              target = velocity < 0 ? Math.ceil(position) : Math.floor(position);
            }
            goTo(target);
          },
        });
        // First in the queue: Observer must let go of the track before its styles are restored.
        restores.unshift(() => observer.kill());
      })
      .catch(() => {
        /* Drag is an enhancement: the buttons and arrow keys still drive the slider. */
      });
  }, root);

  return () => {
    c.revert();
    restores.splice(0).forEach((fn) => fn());
  };
};

export default mount;
