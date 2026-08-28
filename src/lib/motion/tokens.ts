/**
 * Single source of truth for easing, duration and distance.
 * Mirrored as CSS custom properties in globals.css (--dur-*).
 * Rules: entrances use dur.enter + ease.out; hover/pointer micro-interactions use dur.micro;
 * scrubbed tweens use ease.none; layout morphs (Flip, curtain, slide changes) use ease.inOut.
 * back/elastic/bounce eases are never used — nothing bounces.
 */
export const ease = {
  out: "power3.out",
  inOut: "power2.inOut",
  none: "none",
  wipe: "expo.out",
} as const;

export const dur = {
  micro: 0.3,
  short: 0.6,
  enter: 0.9,
  long: 1.2,
  wipe: 0.8,
} as const;

export const stagger = {
  chars: 0.02,
  words: 0.04,
  lines: 0.08,
  items: 0.06,
} as const;

export const dist = {
  rise: 32, // px, y offset for fade-up entrances
  lineRise: 110, // yPercent for masked line reveals (>100 so the padded mask hides it)
  tiltDeg: 6, // max rotateX/rotateY on tilt cards
  magnetPx: 12, // max magnetic displacement
  parallaxPct: 8, // ± yPercent/xPercent for parallax layers
  bgScale: 1.08, // manifesto background end scale
  cursorPx: 12, // max hero displacement in px
} as const;

export const scrub = { exact: true, soft: 0.3 } as const;
