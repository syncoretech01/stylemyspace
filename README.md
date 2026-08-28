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

Open questions and every `{{TODO}}` placeholder are tracked in [OPEN-ITEMS.md](OPEN-ITEMS.md). The design direction and reference sites are in [DIRECTION.md](DIRECTION.md).
