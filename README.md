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

_(completed at close-out — see the "Animation techniques" section below.)_

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
