# Critique rubric — Style My Space Design

The rubric the P5 critique agents grade against and the P6 verifiers re-check. Every finding must
cite a screenshot produced by `pnpm qa` (see `qa/README.md`) and one rubric item below. Nothing is
"felt": a finding names the pixel evidence, the criterion it violates and what correct would look like.

Inputs per route: `qa/contact-sheets/<run>/<routeSlug>-<column>.png`, the `full-initial.png` /
`full-revealed.png` shots at 1920 / 1440 / 1024 / 768 / 390, the `1440-rm` / `390-rm` shots, the
`focus-NN.png` + `focus-order.json` at 1440, and that route's slice of `qa/report.json`.

Reference frame: `DIRECTION.md` (brand system) and `src/app/globals.css` (tokens: 8 px spacing
scale, fluid type scale, palette bone / sand / taupe / olive / olive-deep / ink / brass / clay).

## Severity and confidence

| Severity | Meaning | Examples |
|---|---|---|
| `blocker` | Ships broken or misleading | invisible content, overflow that hides UI, fabricated fact, keyboard trap |
| `major` | Clearly wrong to a client at first glance | mis-cropped hero face, heading wraps to an orphan on every width, focus ring absent on nav |
| `minor` | Visible to a designer, not to a client | 4 px rhythm break, inconsistent gutter at one breakpoint, caption color off-token |
| `nit` | Polish | letter-spacing on one eyebrow, an underline offset |

`confidence` is 0–1: 1.0 = measured in the PNG (pixel-counted, or read from `report.json`);
0.7 = obvious from the screenshot without measurement; ≤ 0.5 = suspected, needs a verifier to
open the image at 100 %. Anything below 0.4 must not be filed.

## Rubric items

### R1 — Type hierarchy
The page reads as one system: display → h1 → h2 → h3 → lead → body → small → eyebrow, using only
the fluid tokens (`--text-display` … `--text-eyebrow`) and the two families (Fraunces display,
Inter Tight sans).

- **PASS**: one h1 per route; each heading level is visibly distinct from the next (size ratio ≥ 1.2
  or a family/weight change); body measure stays within 60–75 ch; no display text below 40 px on
  ≥ 1024, none below 32 px on 390; eyebrows never drop below 12 px.
- **FAIL**: two adjacent levels indistinguishable; a heading that wraps into a one-word orphan on
  any of the five widths; body text wider than 75 ch on ≥ 1024; a third typeface; a heading in
  the sans family or body copy in the serif (other than a pull-quote).

### R2 — Spacing rhythm
Everything sits on the 8 px scale (`--spacing: 0.5rem`). Section padding 12–20 units on desktop,
8–10 units on mobile; gutters consistent inside a breakpoint.

- **PASS**: measured gaps between sections, between heading and first paragraph, and between grid
  cards are multiples of 8 px (±1 px rendering tolerance) and the same value recurs across sections
  of the same kind; the space above a heading is ≥ the space below it.
- **FAIL**: any measured gap off the scale by ≥ 4 px; two sections of the same kind with different
  vertical padding at the same width; a section whose padding on 390 is larger than on 1440;
  content touching the viewport edge (< 16 px gutter on 390, < 24 px on 768+).

### R3 — Image cropping
Photography is the point of the site: crops must keep the subject and the horizon, and never
enlarge low-resolution sources.

- **PASS**: each `next/image` with `fill`/`object-cover` keeps its focal point (faces, the pendant
  cluster, the marble slab) inside the frame at all five widths; no image is rendered above its
  source's pixel width (Las Olas 960 × 640 files stay ≤ 960 px wide on screen); aspect ratios of
  grid cards match within a row; no letterboxing bars; no visibly baked-in UI (the City View
  scroll-arrow artefact is cropped out or flagged).
- **FAIL**: a subject cut at the frame edge (head, table edge, key object); visible upscaling
  (soft/blurry photo at 1440 or 1920); mixed aspect ratios in one row; a hero image whose crop
  differs so much between 1440 and 390 that a different room is shown, unless intentional and
  marked with `sizes`/art-direction.

### R4 — Color balance
Only the palette tokens appear; olive is the single primary; brass is a thin accent, never a fill;
never pure black or pure white.

- **PASS**: every sampled background/text/rule color maps to a token; dark sections (olive-deep)
  use bone text; body text on bone is ink; adjacent sections alternate bone/sand or bone/olive-deep
  without two dark sections touching; contrast for body ≥ 4.5:1, for large display ≥ 3:1.
- **FAIL**: `#000`/`#fff` anywhere; brass used as a button fill or large area; a colour not in the
  token list (except `clay` for form errors and image pixels); text under 4.5:1 on its background;
  a dark section directly followed by another dark section.

### R5 — Alignment across breakpoints
Columns, gutters and edges line up per breakpoint, and the layout degrades intentionally
(1920 → 1440 → 1024 → 768 → 390), not by accident.

- **PASS**: left edges of headings, body copy and images align to the same container edge within
  a section; grids collapse in the expected order (4 → 3/2 → 2 → 1); the header wordmark and the
  section content share a left edge at every width; nothing overlaps the sticky header; the same
  element is not centred on one width and left-aligned on the next without reason.
- **FAIL**: a ragged left edge inside a section (≥ 4 px offset); a grid with an orphan card of a
  different width; content hidden behind the header on scroll; horizontal overflow at any width
  (`report.json` `horizontal-overflow` is an automatic blocker); a column that is empty at one
  width while its siblings are full.

### R6 — End states
After the scroll pass every reveal has finished: nothing remains at `opacity: 0`, translated,
clipped or mid-animation in `full-revealed.png`, and the initial state (`full-initial.png`) shows
the above-the-fold content without a flash of hidden text.

- **PASS**: `report.json` has no `stuck-end-state` for the route; `full-revealed.png` matches the
  intended finished layout at every width; above-the-fold content in `full-initial.png` is visible
  (hero copy, nav, first image); pinned sections release and the footer is fully reachable.
- **FAIL**: any element listed under `stuckEndState`; a partially transparent block, a heading
  with only some split lines visible; a pinned section that never unpins (scroll-NN sequence stops
  moving while the page is not at the bottom); layout shift between `full-initial` and
  `full-revealed` other than the reveals themselves.

### R7 — Focus states
Every interactive element is reachable by Tab in reading order, shows the olive (or sand on dark)
2 px outline with 4 px offset, and the skip link is the first stop.

- **PASS**: `focus-order.json` starts with the skip link, follows header → main → footer visually,
  and ends by wrapping to the first stop; each `focus-NN.png` shows a visible ring around the
  focused element; no `focus-not-visible`, `focus-lost` or `skip-link-first` issue in
  `report.json`; focus is never placed on an element that is hidden behind another.
- **FAIL**: a stop with no visible ring (contrast of ring vs. background < 3:1 counts as none);
  order that jumps between columns unpredictably; a focus trap (fewer stops than focusables and no
  wrap); an off-screen stop that does not scroll into view; a custom cursor or overlay that hides
  the ring.

### R8 — Reduced motion
With `prefers-reduced-motion: reduce` the page is the finished layout on first paint and is
pixel-equivalent to the motion build's end state.

- **PASS**: `html[data-motion="reduced"]`; `rm-hidden-first-paint` absent in `report.json`;
  `1440-rm/full-initial.png` equals `1440/full-revealed.png` apart from parallax/pinned offsets;
  the preloader is skipped; no canvas hero (static image in its place); no auto-playing motion.
- **FAIL**: anything hidden on first paint under rm; a difference in content or order between rm
  and the motion build; a residual transition longer than 0.01 ms (things visibly sliding in);
  a horizontal scroll or pinned section still active under rm.

### R9 — Copy integrity
Every word on the site is either from the live Wix site, the brief's Section 2 facts, or a visible
`{{TODO}}` token. No invented facts, awards, dates, project claims or process steps.

- **PASS**: the only `{{TODO: …}}` tokens visible are the intentional ones (Process phases, contact
  delivery, unresolved alt text) and they render as the literal token; titles/descriptions match
  `content/projects.json`; the five 2500² concept collections are never called "completed" or
  "built"; NAP matches `src/lib/site.ts`; no placeholder phone `123-456-7890`; no lorem ipsum; no
  press mention rendered while `pressConfirmed` is false.
- **FAIL**: any sentence that cannot be traced to a source; a `{{TODO}}` outside the intentional
  list, or an intentional one that is missing/hidden; a truncated or double-encoded string
  (`&amp;`, `â€™`); a heading that promises something the content does not have (e.g. "Our
  Process" over empty cards without the token); a stock image (Wix `11062b_` / `nsplsh_`).

## Finding schema

Critique output is a JSON array of `Finding` objects. Fields:

```json
{
  "id": "home-1440-R3-01",
  "route": "/",
  "viewport": 1440,
  "reducedMotion": false,
  "screenshot": "qa/screenshots/<run>/home/1440/scroll-02.png",
  "region": { "x": 120, "y": 640, "w": 860, "h": 420 },
  "rubric": "R3",
  "severity": "major",
  "confidence": 0.9,
  "observation": "Dining hero crops the brass pendant cluster at the top edge; the table edge is cut at 1440 but not at 1920.",
  "expected": "Focal point (pendants + table) fully inside the frame at every width; object-position tuned per DIRECTION.md.",
  "suggestedFix": "Set objectPosition to '50% 35%' on the hero SmartImage for widths ≤ 1440, or use the focalPoint from projects.json.",
  "owner": "src/components/sections/Hero"
}
```

| Field | Type | Rule |
|---|---|---|
| `id` | string | `<routeSlug>-<column>-<rubric>-<NN>`, unique within the run |
| `route` | string | one of `getQaRoutes()` |
| `viewport` | number | 1920 · 1440 · 1024 · 768 · 390 |
| `reducedMotion` | boolean | `true` only for the `-rm` columns |
| `screenshot` | string | repo-relative path of the PNG the finding is visible in |
| `region` | `{x,y,w,h}` or `null` | CSS-pixel box inside that screenshot; `null` only for page-wide findings (overflow, order) |
| `rubric` | `R1`–`R9` | the single item violated (file two findings rather than one with two items) |
| `severity` | `blocker` · `major` · `minor` · `nit` | per the table above |
| `confidence` | number 0–1 | see "Severity and confidence"; < 0.4 is not filed |
| `observation` | string | what is in the pixels, measured where possible |
| `expected` | string | what the rubric's PASS state looks like here |
| `suggestedFix` | string, optional | concrete change; omit rather than guess |
| `owner` | string | the path that owns the fix (`src/components/sections/<Name>`, `src/app/globals.css`, `content/…`, `scripts/…`) |

Verifier verdicts (P6) reference the finding `id` and add
`{ "verdict": "confirmed" | "rejected" | "downgraded" | "upgraded" | "duplicate", "evidence": string, "severity"?: … }`.
