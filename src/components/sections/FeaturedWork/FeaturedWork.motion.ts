/**
 * Featured work — horizontal parallax scroll (full tier) / entrance reveals only (mobile tier).
 *
 * Full tier: the stage is pinned (pinSpacing:false, distance reserved in CSS on the root and
 * corrected here) while the track is translated 1:1 with the scroll; each card's image layer
 * drifts at its own amplitude via containerAnimation. Mobile keeps the native scroll-snap list.
 * Reduced motion never loads this module — the static markup is the final state.
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ease } from "@/lib/motion/tokens";
import { markReady, revealIn } from "@/lib/motion/reveal";

type Ctx = { tier: "full" | "mobile"; fine: boolean };

/** Per-card parallax amplitude (% of the frame width). The layer is 120% wide, so ≤ 10 never uncovers the frame. */
const AMPLITUDES = [6, 8, 10, 8, 6] as const;

const TRACK_STYLE_KEYS = ["overflow", "scrollSnapType", "touchAction", "overscrollBehaviorX", "willChange"] as const;

export default function mount(root: HTMLElement, ctx: Ctx) {
  const stage = root.querySelector<HTMLElement>(".featured-stage");
  const track = root.querySelector<HTMLElement>(".track");
  const cards = Array.from(root.querySelectorAll<HTMLElement>(".card"));
  const restores: Array<() => void> = [];

  const c = gsap.context(() => {
    revealIn(root);
    if (ctx.tier !== "full" || !stage || !track || cards.length < 2) return;

    // --- Native scroller → translated track -------------------------------------------------
    const prev = Object.fromEntries(TRACK_STYLE_KEYS.map((k) => [k, track.style[k]])) as Record<
      (typeof TRACK_STYLE_KEYS)[number],
      string
    >;
    const hadLenisPrevent = track.hasAttribute("data-lenis-prevent");
    track.scrollLeft = 0;
    track.style.overflow = "visible";
    track.style.scrollSnapType = "none";
    track.style.touchAction = "auto";
    track.style.overscrollBehaviorX = "auto";
    track.removeAttribute("data-lenis-prevent");
    restores.push(() => {
      TRACK_STYLE_KEYS.forEach((k) => (track.style[k] = prev[k]));
      if (hadLenisPrevent) track.setAttribute("data-lenis-prevent", "");
      root.style.height = "";
    });

    /** Horizontal overflow of the track in px: last card's right edge + end padding − visible width. Transform-independent. */
    const overflow = () => {
      const last = cards[cards.length - 1]!;
      const padEnd = parseFloat(getComputedStyle(track).paddingRight) || 0;
      const extent = last.getBoundingClientRect().right - track.getBoundingClientRect().left + padEnd;
      return Math.max(0, Math.round(extent - track.clientWidth));
    };
    /** Reserve exactly stage height + travel on the root so the pin (pinSpacing:false) never shifts layout. */
    const reserve = () => {
      root.style.height = `${stage.offsetHeight + overflow()}px`;
    };
    reserve();

    const tween = gsap.to(track, {
      x: () => -overflow(),
      ease: ease.none,
      scrollTrigger: {
        trigger: root,
        pin: stage,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefreshInit: reserve,
        onToggle: (self) => {
          track.style.willChange = self.isActive ? "transform" : "";
        },
      },
    });
    const st = tween.scrollTrigger!;

    // --- Per-card image parallax at differing speeds ----------------------------------------
    cards.forEach((card, i) => {
      const frame = card.querySelector<HTMLElement>(".card-frame");
      const layer = frame?.firstElementChild as HTMLElement | null;
      if (!frame || !layer) return;
      const amp = AMPLITUDES[i % AMPLITUDES.length]! / 100;
      gsap.fromTo(
        layer,
        { x: () => -amp * frame.clientWidth },
        {
          x: () => amp * frame.clientWidth,
          ease: ease.none,
          scrollTrigger: {
            containerAnimation: tween,
            trigger: card,
            start: "left right",
            end: "right left",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    });

    // --- Keyboard: focusing a card jumps the pinned scroll so the card is centred ------------
    const onFocusIn = (e: FocusEvent) => {
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(".card");
      if (!card || !track.contains(card)) return;
      const total = overflow();
      if (!total) return;
      const rect = card.getBoundingClientRect();
      const currentX = Number(gsap.getProperty(track, "x")) || 0;
      const naturalCentre = rect.left + rect.width / 2 - currentX;
      const wantedX = gsap.utils.clamp(-total, 0, window.innerWidth / 2 - naturalCentre);
      const y = Math.round(st.start + (st.end - st.start) * (-wantedX / total));
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo({ top: y, behavior: "instant" });
    };
    root.addEventListener("focusin", onFocusIn);
    restores.push(() => root.removeEventListener("focusin", onFocusIn));

    // The root height changed from the CSS estimate to the exact travel: re-measure everything below.
    ScrollTrigger.refresh();
  }, root);

  markReady(root);

  return () => {
    c.revert();
    restores.splice(0).forEach((fn) => fn());
  };
}
