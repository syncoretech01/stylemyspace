# Style My Space Design — marketing site

Next.js 16 (App Router) · React 19 · TypeScript 5.9 · Tailwind CSS 4 · GSAP 3.15 (ScrollTrigger, Flip, SplitText) · Lenis · Three.js · Playwright · Lighthouse.

Content is migrated from the firm's live Wix site (https://www.stylemyspacedesign.com) into `content/projects.json`; the site is driven entirely from that file plus the business facts in `src/lib/site.ts`.

## Run it

```bash
pnpm install
cp .env.example .env.local   # set NEXT_PUBLIC_SITE_URL, optionally CONTACT_ENDPOINT
pnpm dev                     # http://localhost:3000
pnpm build && pnpm start     # production
```

## Where content lives

| What | Where | Notes |
|---|---|---|
| Business facts (NAP, services, areas, socials, nav) | `src/lib/site.ts` | Verbatim from the client brief. |
| Projects, home copy, blog excerpts, consultations | `content/projects.json` | **Generated** — do not edit by hand. |
| Editorial decisions (categories, covers, captions, hero/manifesto/material images, pricing flag) | `content/overrides.json` | Hand-edited. |
| Alt text per image | `content/alt-overrides.json` | Hand-edited, keyed by Wix media id. |
| Discipline blurbs and images | `src/lib/disciplines.ts` | Assembled from scraped copy only. |
| Optimized images | `public/projects/<slug>/`, `public/site/`, `public/blog/` | WebP masters ≤ 2400 px + OG JPEGs. |
| Raw originals | `content/raw/` (gitignored) | Downloaded by the scraper. |
| Scrape extraction + report | `content/scrape/` | Per-page JSON and `scrape-report.json`. |

### Content pipeline

```
pnpm content:scrape   # Playwright: render each live page, scroll, collect + download originals → content/raw, content/scrape
pnpm content:images   # sharp: WebP masters, blur placeholders, OG crops → public/, writes content/projects.json
pnpm content:check    # validates the JSON against src/lib/content.schema.ts, lists {{TODO}} alts, checks files exist
```

### Adding a project

1. Publish it on the live site (or drop originals into `content/raw/<slug>/NN-<mediaId>.<ext>` and add the page JSON under `content/scrape/pages/<slug>.json`).
2. Add the slug to the ordered list in `content/overrides.json` (category, cover media id, captions) and alt text in `content/alt-overrides.json`.
3. Run `pnpm content` — the case-study route, sitemap, OG image and JSON-LD are generated from the JSON.

## Brand system

Tokens live in `src/app/globals.css` (`@theme`): palette (`bone`, `sand`, `taupe`, `olive`, `olive-deep`, `ink`, `brass`), an 8 px spacing scale (`p-1` = 8 px), fluid type sizes (`text-display` … `text-eyebrow`), easings. Fonts: Fraunces (display) + Inter Tight (UI) via `next/font`. Primitives in `src/components/ui/`.

## Motion architecture

Final state by default. Every page is server-rendered in its finished state; an inline script in
`<head>` (`src/app/layout.tsx`) classifies the visitor before first paint into a motion tier —
`full` (desktop, fine pointer), `mobile` (touch or < 1024 px) or `reduced` (`prefers-reduced-motion`)
— and CSS in `globals.css` pre-hides only `[data-reveal]` elements inside a `[data-motion-root]`
whose motion module has not taken over yet (with a 4 s safety keyframe). Under `reduced`, with
JavaScript disabled, or before hydration, nothing is ever hidden.

Each animated section pairs a server-rendered component with a framework-free
`<Name>.motion.ts` module (`src/components/sections/<Name>/`) loaded lazily through
`MotionRoot` → `useMotionModule` once the preloader has exited and the main thread is idle. GSAP core,
ScrollTrigger, Flip, SplitText, Observer, Lenis and three.js are therefore never in the initial
bundle (`pnpm qa:bundle` asserts this). Tokens for easing, duration and distance live in
`src/lib/motion/tokens.ts`; media queries in `src/lib/motion/queries.ts`; nothing bounces.

| Technique | Where | Notes |
|---|---|---|
| Preloader (SVG logotype stroke draw + real asset-progress counter + `clip-path` curtain, ≤ 2.5 s, once per session) | `src/components/preloader/` | CSS-driven; `assetLoader.ts` tracks fonts, the LCP image and the WebGL chunk |
| Three.js displacement plane on the hero photo (single WebGL context, DPR ≤ 2, IntersectionObserver pause, disposed on unmount) | `src/components/three/` | Mounts on the `full` tier after the preloader when hardware GL is available; the `<img>` beneath stays the LCP element |
| Headline masked line reveal (SplitText `mask: "lines"`) | `src/lib/motion/split.ts`, Hero, CaseHero | Plays after the preloader / after a Flip lands |
| Custom cursor (olive halo with labels from `data-cursor`) | `src/components/cursor/` | Fine pointers only; never reacts to keyboard focus |
| Pinned manifesto (word-by-word scrub, background scale 1 → 1.08) | `sections/Manifesto` | Pin distance reserved in CSS (`motion-full:h-[220svh]`) so pinning never shifts layout |
| Disciplines column slider | `sections/Disciplines` | Pure CSS `flex-grow` on hover / `:focus-within`; stacked on touch |
| Horizontal parallax track (pinned, image layers at differing speeds via `containerAnimation`) | `sections/FeaturedWork` | Native scroll-snap list on mobile / reduced |
| Portfolio grid entrance + 3D tilt (≤ 6°) + name mask | `sections/PortfolioGrid` | Tilt on fine pointers only |
| Cross-route FLIP zoom (tile → case-study hero) | `src/components/transition/` | Persistent overlay clone; abort paths for back/blur/timeout |
| Case study parallax blocks, sticky title, 3D gallery slider (Observer drag, arrow keys, live region) | `sections/CaseStudy` | Native scroll-snap strip on mobile / reduced |
| Exploding material swatches with SVG connector lines | `sections/Materials` | Exploded layout is the CSS end state |
| Stacked process cards (sticky + scale scrub) | `sections/Process` | No pin |
| Service-area hover underline draw | `sections/ServiceAreas` | CSS |
| Magnetic CTA, floating-label form with live validation, footer revealed from beneath `<main>` | `sections/CtaBlock`, `sections/Contact`, `globals.css` | Footer reveal is `position: sticky; bottom: 0` |

## QA

```bash
pnpm build
pnpm qa --serve             # Playwright: screenshots at 1920/1440/1024/768/390 + every 100vh, console/network assertions, focus pass, reduced-motion pass → qa/
pnpm qa:sheets              # contact sheets for review
pnpm qa:lighthouse --serve  # Lighthouse desktop + mobile per route → qa/lighthouse/<run>/summary.md
pnpm qa:bundle              # asserts three/gsap/lenis are not in the initial bundle
pnpm qa:webgl               # real-Chrome WebGL context check
```

### Verified behaviours

| Path | How it was checked |
|---|---|
| Reduced motion | `prefers-reduced-motion: reduce` renders every page in its final state on first paint, with no WebGL, no Lenis and no pinning (`pnpm qa` runs every route at 1440 and 390 in this mode). |
| Mobile | Touch/narrow viewports drop the 3D hero, the tilt effects and the horizontal pin, and keep native scrolling. |
| No JavaScript | Every route renders its heading, copy, images (`<noscript>` fallbacks) and the contact form; the preloader stays `display: none`. |
| Keyboard | `pnpm qa` tabs each route at 1440, screenshots every focus state and asserts the skip link comes first and focus is never lost. |
| WebGL | `pnpm qa:webgl` asserts one context at most, disposal on navigation and a clean console in real Chrome. |
| Preloader | `qa/preloader.spec.ts` asserts it runs once per session, finishes inside 2.5 s, never reappears on navigation and never renders under reduced motion. |
| Screenshot QA | `pnpm qa` covers 13 routes × 5 widths plus reduced-motion and keyboard-focus passes — 91 cells, **0 FAIL / 0 WARN** on the final run. |
| Bundles | `pnpm qa:bundle --strict` asserts three.js, GSAP, Lenis and the content loader are absent from every route's initial JS. |
| Facts | Every rendered route was scanned for fabricated-claim patterns (awards, press logos, testimonials, statistics, founding dates, team sizes, budgets, completion dates, superlatives): zero hits. "Certified MWBE" and "over 5 years of experience" appear only where the live bio is quoted verbatim; the unverifiable press mention is not rendered at all; pricing appears only on `/services` with the three real Book Online figures. |
| Placeholders | **No `{{TODO}}` token renders anywhere** on the site. The Process phase cards now carry draft copy pending the client's sign-off (OPEN-ITEMS OI-03), sourced from the firm's own journal posts and listed services; the only remaining placeholder is the contact form's delivery note, which appears solely in the form's success state. `pnpm content:check --strict` passes with zero TODO alt text. |

### Lighthouse (`final`, HTTP/2, median of 2 runs per cell)

**24 of 24 cells pass.** Thresholds: Performance ≥ 85 desktop / ≥ 75 mobile, Accessibility ≥ 95,
Best Practices ≥ 95, SEO ≥ 95, LCP < 2500 ms, CLS < 0.1.

| Route | Mode | Perf | A11y | BP | SEO | LCP | CLS | TBT | Status |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| / | desktop | 99 | 100 | 100 | 100 | 600 ms | 0.001 | 0 ms | PASS |
| / | mobile | 97 | 100 | 100 | 100 | 2,404 ms | 0.000 | 9 ms | PASS |
| /portfolio | desktop | 100 | 100 | 100 | 100 | 483 ms | 0.001 | 0 ms | PASS |
| /portfolio | mobile | 99 | 100 | 100 | 100 | 1,878 ms | 0.000 | 6 ms | PASS |
| /portfolio/oceanside | desktop | 100 | 100 | 100 | 100 | 572 ms | 0.001 | 0 ms | PASS |
| /portfolio/oceanside | mobile | 97 | 100 | 100 | 100 | 2,403 ms | 0.000 | 5 ms | PASS |
| /portfolio/las-olas | desktop | 100 | 100 | 100 | 100 | 511 ms | 0.001 | 0 ms | PASS |
| /portfolio/las-olas | mobile | 98 | 100 | 100 | 100 | 2,208 ms | 0.000 | 6 ms | PASS |
| /portfolio/aromatherapy-and-natural-elements | desktop | 100 | 100 | 100 | 100 | 610 ms | 0.001 | 0 ms | PASS |
| /portfolio/aromatherapy-and-natural-elements | mobile | 98 | 100 | 100 | 100 | 2,388 ms | 0.000 | 6 ms | PASS |
| /portfolio/wellness-space-with-city-view | desktop | 100 | 100 | 100 | 100 | 491 ms | 0.001 | 0 ms | PASS |
| /portfolio/wellness-space-with-city-view | mobile | 100 | 100 | 100 | 100 | 1,727 ms | 0.000 | 6 ms | PASS |
| /portfolio/classroom-designs | desktop | 100 | 100 | 100 | 100 | 544 ms | 0.001 | 0 ms | PASS |
| /portfolio/classroom-designs | mobile | 99 | 100 | 100 | 100 | 1,877 ms | 0.000 | 5 ms | PASS |
| /portfolio/wellness-space-designs | desktop | 100 | 100 | 100 | 100 | 583 ms | 0.001 | 0 ms | PASS |
| /portfolio/wellness-space-designs | mobile | 98 | 100 | 100 | 100 | 2,327 ms | 0.000 | 5 ms | PASS |
| /portfolio/modern-interior-design | desktop | 100 | 100 | 100 | 100 | 521 ms | 0.001 | 0 ms | PASS |
| /portfolio/modern-interior-design | mobile | 98 | 100 | 100 | 100 | 2,177 ms | 0.000 | 6 ms | PASS |
| /services | desktop | 100 | 100 | 100 | 100 | 437 ms | 0.001 | 0 ms | PASS |
| /services | mobile | 99 | 100 | 100 | 100 | 1,982 ms | 0.000 | 5 ms | PASS |
| /about | desktop | 100 | 100 | 100 | 100 | 457 ms | 0.001 | 0 ms | PASS |
| /about | mobile | 98 | 100 | 100 | 100 | 2,208 ms | 0.004 | 10 ms | PASS |
| /contact | desktop | 100 | 100 | 100 | 100 | 417 ms | 0.001 | 0 ms | PASS |
| /contact | mobile | 99 | 100 | 100 | 100 | 1,862 ms | 0.000 | 8 ms | PASS |

Reproduce with `pnpm build && pnpm start`, `pnpm qa:h2`, then
`NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm qa:lighthouse --base-url=https://localhost:3443 --runs=2 --chrome-flags=--ignore-certificate-errors`.
Full reports (JSON + HTML) land in `qa/lighthouse/<run>/`.

Open questions and every `{{TODO}}` placeholder are tracked in [OPEN-ITEMS.md](OPEN-ITEMS.md). The design direction and reference sites are in [DIRECTION.md](DIRECTION.md).
