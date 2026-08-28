# QA tooling

Visual and runtime checks for every route of the site, built on the plain `playwright` library
(`scripts/qa.ts`) plus one `@playwright/test` spec for WebGL (`qa/webgl.spec.ts`).

## Running

```sh
pnpm build && pnpm qa --serve          # production build, spawns `next start -p 3000`, full matrix
pnpm qa                                # against an already running server on http://localhost:3000
pnpm qa --base-url=http://localhost:3001
pnpm qa --routes=/,/about --viewports=1440,390 --skip-focus --run=smoke-dev   # quick smoke
pnpm qa --channel=chrome               # use installed Chrome instead of the headless shell
pnpm qa:webgl                          # WebGL lifecycle spec in real Chrome (QA_BASE_URL, QA_HEADED=1)
```

Flags for `pnpm qa`:

| Flag | Default | Meaning |
|---|---|---|
| `--base-url=` | `http://localhost:3000` | Server to test. Ignored port-wise by `--serve` only for the check that the port is free. |
| `--serve` | off | Spawn `next start -p <port>` (needs a prior `pnpm build`); killed on exit. Never use against a running `next dev` — Next 16 locks the port. |
| `--routes=` | all of `getQaRoutes()` | Comma-separated subset. Routes outside the list are run with an expected status of 200. |
| `--viewports=` | `1920,1440,1024,768,390` | Subset of widths. Heights: 1080 / 900 / 768 / 1024 / 844. Reduced-motion columns run only for 1440 and 390 when those widths are selected. |
| `--skip-focus` | off | Skip the keyboard pass at 1440. |
| `--concurrency=` | `3` | Parallel browser contexts. |
| `--run=` | timestamp | Name of the output folder under `qa/screenshots/`. |
| `--channel=` | none | `chrome` forces the installed Chrome. Without it the cached headless shell is used and Chrome is a fallback if that fails to launch. |

Every route × viewport × mode gets a **fresh browser context** (empty `sessionStorage`), so the
preloader runs each time. The dev server (`next dev`) works for smoke runs but logs HMR/dev-tools
warnings that are not present in production; grade against `next start`.

## What a run does (per route × viewport)

1. `goto` (`load`) → soft `networkidle` (10 s) → wait for `html[data-preloader-done="true"]`
   (10 s, FAIL on timeout) → `document.fonts.ready` → two animation frames.
2. `full-initial.png` — full-page capture of the first paint.
3. Scroll pass: from `y=0` in 100 vh jumps (`window.__lenis.scrollTo` + `window.scrollTo`
   instant), 600 ms settle, viewport capture `scroll-NN.png` each step, until the bottom.
4. Back to top, 400 ms → `full-revealed.png` (full page, every reveal should have fired).
5. Probes: stuck elements (anything in `<main>` larger than 40 × 20 px with `opacity: 0` or
   `visibility: hidden`), horizontal overflow (`scrollWidth > innerWidth + 1`).
6. At 1440 (motion mode) unless `--skip-focus`: Tab through up to 120 stops, screenshot each
   (`focus-NN.png`; every 5th when more than 40 focusables), write `focus-order.json`.
7. Then 1440 and 390 again with `reducedMotion: 'reduce'` (column suffix `-rm`), where hidden
   content on first paint is a FAIL and `html[data-motion]` must be `reduced`.

Throughout, the harness records console errors and warnings (with source location), uncaught
page errors, failed requests, and every response with status ≥ 400 (except the intentional
`/this-page-does-not-exist` document, which must be exactly 404).

## Outputs

| Path | Content |
|---|---|
| `qa/screenshots/<run>/<routeSlug>/<column>/` | `full-initial.png`, `scroll-NN.png`, `full-revealed.png`, `focus-NN.png`, `focus-order.json`. `<column>` is `1920` … `390`, or `1440-rm` / `390-rm`. `routeSlug`: `/` → `home`, `/portfolio/oceanside` → `portfolio__oceanside`. |
| `qa/report.json` | Machine-readable: per result `status`, `issues[] {kind, level, text, url, status}`, `suppressed[]` (allowlisted issues), screenshot paths, timings, observed motion tier, stuck-element lists. A copy is kept inside the run folder. |
| `qa/report.md` | Matrix (route × `1920 | 1440 | 1024 | 768 | 390 | 1440-rm | 390-rm`) with PASS / WARN / FAIL, an issue digest per cell, allowlist echo, timings. |
| `qa/contact-sheets/<run>/` | `<routeSlug>-<column>.png` (all captures of one cell) and `all-full-<column>.png` (every route's `full-revealed.png`). Built only when `scripts/contact-sheet.ts` exists; otherwise a note is written to the report. |

Everything under `qa/screenshots`, `qa/contact-sheets` and the two reports is gitignored.

### Status rules

| Status | Triggered by (issue `kind`) |
|---|---|
| **FAIL** (exit code 1) | `console-error`, `pageerror`, `request-failed`, `http-status` (≥ 400), `unexpected-status`, `preloader-timeout`, `horizontal-overflow`, `focus-lost`, `skip-link-first`, `rm-hidden-first-paint`, `motion-tier` (under rm), `script-error` |
| **WARN** | `console-warning`, `stuck-end-state`, `focus-not-visible`, `focus-order` (ring longer than 120 stops) |
| info (never counted) | `request-aborted` (`net::ERR_ABORTED` on prefetch / navigation), `networkidle-timeout` |

## Allowlist

`qa/allowlist.json` suppresses specific issues. Every entry needs a reason; suppressed issues are
still echoed in `qa/report.md` under "Suppressed issues".

```json
{
  "entries": [
    {
      "kind": "console-warning",
      "urlPattern": "/_next/static/chunks/",
      "textPattern": "^\\[Fast Refresh\\]",
      "reason": "Dev-server HMR notice; absent in production builds (smoke runs only)."
    }
  ]
}
```

- `kind` — the issue kind from `report.json`, or `*` for any kind.
- `urlPattern` / `textPattern` — optional JavaScript regex sources tested against `issue.url` and
  `issue.text`. Both must match when both are present.
- `reason` — required; printed in the report.

Keep the list short and specific. A production `pnpm qa` run should need no entries; if one is
needed, the reason should say why the underlying issue is not fixable on our side.

## WebGL spec

`pnpm qa:webgl` runs `qa/webgl.spec.ts` with `qa/playwright.config.ts` in real Chrome
(`channel: 'chrome'`). An init script wraps `HTMLCanvasElement.prototype.getContext` and counts
WebGL contexts, then the test opens `/`, clicks the primary-nav link to `/portfolio`, goes back,
and asserts: at most one live context at each step, zero live contexts and no hero canvas on
`/portfolio`, no console errors, no page errors. Passes with no canvas (today) and with the
three.js hero (later). The renderer Chrome used is written to the test annotations; set
`QA_HEADED=1` to run headed on a real GPU.

## Critique

`qa/rubric.md` holds the critique rubric (R1–R9) and the `Finding` JSON schema used by the P5
critique and P6 verification agents.
