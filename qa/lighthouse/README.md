# Lighthouse audits

Node-API Lighthouse 12.8.2 (Node 20 — Lighthouse 13 needs Node ≥ 22) driven by
`scripts/lighthouse.ts`, with the bundle and content checks that sit next to it.
Everything in this directory except this README is a generated run and is gitignored.

## The real audit

```sh
pnpm build                                  # production build (next start refuses to run without it)
pnpm qa:lighthouse --serve --runs=3         # spawns `next start -p 3000`, audits, stops it
```

What happens:

1. `--serve` starts `next start` on the port of `--base-url` (default `http://localhost:3000`)
   and waits until it answers. Without `--serve` the script audits whatever is already listening.
2. Every audited route is **warmed** (`scripts/warm-images.ts`): the HTML is fetched and every
   `/_next/image?url=…&w=…&q=…` variant it references (src, srcset, imagesrcset and the inline RSC
   payload) is requested with `Accept: image/webp`, four at a time. The first request for a variant is
   a cold resize; after warming, Lighthouse only ever sees cached responses.
3. One Chrome is launched through `chrome-launcher` (`--headless=new --no-sandbox --disable-gpu`)
   and every route × mode × run is audited serially through it.
4. Reports land in `qa/lighthouse/<run>/<routeSlug>.<mode>.r<n>.report.{json,html}`; the run name is
   `--run=<name>` or a timestamp. `summary.md` and `summary.json` hold the medians.
5. Exit code is 1 when any median misses a threshold or a cell could not be audited.

Useful flags:

| Flag | Meaning |
|---|---|
| `--base-url=http://localhost:3000` | Server to audit (port also used by `--serve`) |
| `--serve` | Spawn `next start` for the duration of the run |
| `--runs=3` | Runs per route × mode (default 3) |
| `--routes=/,/about` | Subset of routes (default: every site route from `qa/routes.ts`, minus the 404 probe) |
| `--modes=desktop,mobile` | Subset of modes (default both) |
| `--headed` | Visible Chrome with a real GPU (see WebGL note) |
| `--run=<name>` | Output directory name under `qa/lighthouse/` |

Modes: `desktop` uses Lighthouse's desktop preset (`lighthouse/core/config/desktop-config.js`:
1350×940 viewport, dense 4G, no CPU throttle); `mobile` is the Lighthouse default (Moto G Power
emulation, slow 4G, 4× CPU throttle). Only the four categories performance, accessibility,
best-practices and seo are gathered.

## How the median is chosen

Runs of the same route × mode are sorted by **Performance score** (ties broken by LCP, higher LCP
first) and the middle run is reported: index `⌊(n − 1) / 2⌋`, i.e. run 2 of 3. With an even
number of runs the lower middle is taken so the summary never shows a number better than a real
run. Every score, metric, failing audit and opportunity in the summary comes from that one median
run — they are not averaged across runs. `summary.json` still lists every run's scores and
metrics (`allRuns`) and the median's report paths.

A run whose JSON carries `runtimeError` (or where Lighthouse throws) is retried once; the failed
attempt is kept as `<slug>.<mode>.r<n>.attempt<k>.failed.report.json`. If the retry also fails the
cell is reported as `ERROR` and the script exits 1.

## Thresholds (per route, per mode, applied to the median)

| Metric | Pass |
|---|---|
| Performance | ≥ 85 desktop · ≥ 75 mobile |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 95 |
| LCP | < 2500 ms |
| CLS | < 0.1 |

They live in `THRESHOLDS` at the top of `scripts/lighthouse.ts`. The summary also records TBT and
Speed Index (informational), the ids + titles of every failing accessibility / best-practices / SEO
audit (score < 1), and the top five performance opportunities by estimated savings.

## Headless vs headed (WebGL)

Headless Chrome (`--headless=new --disable-gpu`) has no real GPU: WebGL is served by SwiftShader,
which reports a major performance caveat. The home hero probes
`getContext('webgl2', { failIfMajorPerformanceCaveat: true })` and, under that caveat, keeps the
static hero image and never downloads three.js. **The standard audit therefore measures the
static-hero path**, which is exactly what low-end devices get.

The WebGL path is verified separately:

- `pnpm qa:webgl` — Playwright against real Chrome (`channel: 'chrome'`) asserts ≤ 1 WebGL
  context, disposal on route change and zero console output.
- one headed desktop run on `/` for transparency, recorded next to the regular run:

  ```sh
  pnpm qa:lighthouse --routes=/ --modes=desktop --runs=3 --headed --run=headed-home
  ```

  `--headed` drops `--headless=new` and `--disable-gpu`; a Chrome window opens on your display, so
  keep it in the foreground and don't move the mouse over it while it runs (pointer parallax would
  add work to the trace).

## Dev server runs

Running against `next dev` works (the pipeline is the same) but the numbers are meaningless:
dev chunks are unminified, HMR-instrumented and not code-split like the build. The script detects
the dev HMR client and stamps a warning in the console and the summary. Use it only to prove the
pipeline, e.g. `pnpm qa:lighthouse --routes=/about --modes=desktop --runs=1 --run=smoke-dev`.

## Companion checks

- `pnpm qa:bundle [baseUrl]` (`scripts/check-bundle.ts`) — fetches every route's initial
  `<script src>` / `<link rel="modulepreload">` chunks under `/_next/static` and fails if any contains
  three.js (`WebGLRenderer`), gsap (`ScrollTrigger`, `gsap.registerPlugin`, `_gsap`) or Lenis
  (`lenis`). Against `next dev` violations are informational (exit 0) unless `--strict`.
- `pnpm content:check [--strict]` (`scripts/check-content.ts`) — validates `content/projects.json`
  against the zod contract, lists `todos[]`, counts `{{TODO` alts, checks every image file exists
  under `public/`, checks covers and the 7-project sitemap. `--strict` fails on any TODO alt or
  missing file.
- `pnpm tsx scripts/warm-images.ts [baseUrl] [--routes=…]` — the warm step on its own.
