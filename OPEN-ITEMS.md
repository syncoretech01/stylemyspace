# Open items

Everything on this list needs a decision or confirmation from Style My Space Design, or records a
limitation of the build. Legend — **needs-client**: a fact or asset only the client can supply or
confirm · **provisional**: a reversible decision made to follow the brief; says how to flip it ·
**source**: a discrepancy found in the live site data · **tooling**: environment limitation.

Every literal `{{TODO: …}}` token rendered on the site is listed in section B.

## A. Needs client confirmation

| ID | Item | Evidence | Default applied |
|---|---|---|---|
| OI-01 | **Email address discrepancy.** The live footer displays `info@stylemyspacedesign.com` but its link opens `mailto:info@stylemyspaceinc.com`. | Live site footer, every page | The displayed address is used for both text and link (per brief §2). `emailMailto` is kept in `content/projects.json` for reference. |
| OI-02 | **Disciplines.** The brief lists Residential / Hospitality / Wellness / Commercial; the live home page has Commercial / Education / Residential cards and the bio says "wellness, commercial, and residential". | Live `/` category cards | Brief followed. Education is shown as a note under Commercial (Classroom Designs). Hospitality/Wellness blurbs are assembled only from scraped copy. |
| OI-03 | **Process phases are not documented anywhere on the live site.** | `/`, `/blog`, `/book-online`, all project pages | Process section renders four `{{TODO}}` phase cards plus the brief's sentence "guides clients through every phase of the design process". |
| OI-04 | **Press mention** — "Eve's work has been featured in prominent publications such as Voyage ATL, Business of Home, Bold Journey, CanvasRebel, Home and Texture, and Mic." is real live-site copy but unverifiable (no links). | Live `/` "Meet the Designer" | Stored with `pressConfirmed: false` and **not rendered** until confirmed (never rendered as logos). Flip in `content/overrides.json`. |
| OI-05 | **Project categories** are only stated for Oceanside and Las Olas ("Residential"). | Project pages | Wellness titles grouped under Wellness; Classroom Designs → Education; Modern Interior Design has no label. See `categoryNote` per project in `content/projects.json`. |
| OI-06 | **Las Olas** is described as an Airbnb investment property but labelled "Residential" on the live site; the brief lists Hospitality as a discipline. | `/portfolio-collections/my-portfolio/las-olas` | Kept as Residential (site fact) with a note; the Hospitality discipline card uses a Las Olas photograph. |
| OI-07 | **Five collections (Aromatherapy, City View, Classroom, Wellness Space Designs, Modern Interior) are 2500×2500 PNGs whose descriptions read like image-collection captions — they may be concept visualizations rather than photographs of completed work.** | Project pages | Presented with the live descriptions, never described as built/completed. Please confirm how to label them. |
| OI-08 | **Low-resolution originals:** 8 of 9 Las Olas images and 2 Oceanside images are ≤ 960 px wide. | Wix originals | Used at card size only; not used full-bleed. Higher-resolution files would improve the case study. |
| OI-09 | **"Wellness Space with City View"** source image has a scroll-arrow UI icon baked into the pixels. | Original file | Shown as-is; a clean export is requested. |
| OI-10 | **Cover-only collections:** Aromatherapy and Natural Elements and Wellness Space with City View have a single image; Classroom Designs has two. | Wix galleries | Single-image case-study layout. More photography welcome. |
| OI-11 | **Consultation pricing** from `/book-online` (Home Design Refresh 2 hr $500 · Move-In Design Guidance 1 hr $200 · Office Design Consultation 1 hr 30 min $300) is shown on `/services`. | `/book-online` | `site.showPricing: true` in `content/overrides.json`; set to false to hide prices. "Book Online" itself has no equivalent on the new site (no booking backend) — the CTA goes to `/contact`. |
| OI-12 | **Canonical domain** for the new site is unknown (www vs apex, or a new host). | — | `NEXT_PUBLIC_SITE_URL` defaults to `https://www.stylemyspacedesign.com`. |
| OI-13 | **Contact form delivery** is not connected to any email/CRM service. | — | The form validates server-side and shows `{{TODO: connect form delivery (CONTACT_ENDPOINT)}}` on success. Set `CONTACT_ENDPOINT` to a JSON POST endpoint (or wire Resend) to send. |
| OI-14 | **Legal entity**: the live bio says "Founder & Principal Designer of Style My Space Inc."; the brand is Style My Space Design. | Live `/` bio | Footer shows "© year Style My Space Design"; `legalName` stored for a legal line if wanted. |
| OI-15 | Claims shown verbatim from the live site that the client should re-confirm: "over 5 years of experience", "certified MWBE". | Live `/` bio | Rendered on `/about` exactly as on the live site. |
| OI-16 | **No vector logo exists** (the live favicon is a 192 px JPEG). | Live site head | A typographic wordmark (Fraunces, letter-spaced) and a simple "S" SVG favicon are used. An SVG mark would replace both. |
| OI-17 | **Blog posts** (3, dated Dec 5 2024) are not migrated: the brief's sitemap has no blog route. Their copy is quoted on About/Materials. | `/blog` | Add a `/blog` route if wanted; bodies are captured in `content/scrape/pages/post-*.json`. |
| OI-18 | **15 duplicate uploads** of Oceanside photography exist in the live home page's "Our Recent Projects" gallery under different media ids (e.g. "Kitchen 2.jpg", "Master's Bedroom.png" 2880×1620, "IMG_0527_8_9-2 (1).png" 3175×4490), reachable only by scrolling that gallery sideways; 9 further gallery items never load and are unknown. | Home warmup JSON (`content/scrape/scrape-report.json` → unreferencedUploads) | Not downloaded (duplicates of images already in the Oceanside collection). If any are distinct photographs, please supply them. |
| OI-34 | **Materials "Stone" swatch** pairs a sentence from the Modern Interior Design collection description ("marble, gold accents…") with a Las Olas bathroom photograph (credited as Las Olas). | `content/overrides.json` → `home.materials` | Kept (both are the firm's own words/photos); swap the quote in `overrides.json` if the pairing is not wanted. |
| OI-35 | **Hospitality discipline image** is the Las Olas cover, a 960×640 original that renders soft when the column expands on wide screens. | `src/lib/disciplines.ts` | Kept; a higher-resolution Las Olas frame would fix it. |
| OI-36 | **Hero on phones**: the scroll cue is hidden below 1024 px and the CTA row sits just under the first fold at 390×844 so the photograph stays clean. | Hero section | Kept; lower `pt-[46svh]` in `src/components/sections/Hero/index.tsx` to lift the CTAs. |

## B. `{{TODO}}` inventory (rendered on the site)

| Token | Where | Item |
|---|---|---|
| `{{TODO: process phase 1–4 name}}` / `{{TODO: process phase 1–4 description}}` | Home → Process | OI-03 |
| `{{TODO: connect form delivery (CONTACT_ENDPOINT)}}` | Contact form success state | OI-13 |

_Alt-text TODOs are tracked by `pnpm content:check` and must be zero before release._

## C. Source-data discrepancies

| ID | Item | Handling |
|---|---|---|
| OI-19 | Las Olas gallery item 05 carries the caption "AM" (filename noise). | Caption nulled in `content/overrides.json`. |
| OI-20 | The portrait's alt on the live site is a filename ("Eve Oceanside Portrait Retouched.jpeg"); the Oceanside gallery captions ("Kitchen 2", "Dining 5"…) are gallery labels, not descriptions. | Alt text for every image is authored by looking at each image (`content/alt-overrides.json`); captions are kept verbatim as captions. |
| OI-21 | Wix Bookings config contains a template phone number `123-456-7890`. | Ignored; only 516-500-5886 is used. |
| OI-42 | The Las Olas description uses a straight typewriter apostrophe ("the property's potential") where the rest of the site uses a typographic one. The sentence is reproduced **verbatim** from the live site, so the punctuation was left as the client wrote it rather than silently edited. | Change it in `content/overrides.json` if the client prefers the typographic apostrophe. |
| OI-22 | Hidden Wix editor placeholder text ("Create Your First Project…") exists in every project page's HTML. | Excluded by visibility checks in the scraper. |
| OI-33 | The live "Previous / Next Project" buttons stop at the first and last project (not circular); `portfolio-projects-sitemap.xml` lists the projects in a different order from the `/portfolio` gallery and the brief. | Site navigation follows the brief/portfolio order and is not circular (ends link back to `/portfolio`). |

## D. Assets excluded

| ID | Item | Handling |
|---|---|---|
| OI-23 | `11062b_a212ef61…` ("Black Vase") on the live home page is a Wix stock-library image. | Excluded — never presented as client work. |
| OI-24 | Social-icon PNGs and the Wix favicon JPEG. | Excluded. |

## E. Provisional decisions (reversible)

| ID | Decision | How to flip |
|---|---|---|
| OI-25 | Fonts: Fraunces + Inter Tight (brief allowed Cormorant Garamond / Satoshi alternatives). | `src/app/layout.tsx` + `globals.css` `@theme inline`. |
| OI-26 | Images are served as WebP masters through `next/image` (WebP output); AVIF is not enabled at the optimizer because its cold encode/decode cost hurts the mobile Lighthouse budget. | Add `"image/avif"` first in `images.formats` in `next.config.ts`. |
| OI-27 | The custom cursor is an olive halo that follows the pointer; the native cursor stays visible for accessibility. | `HIDE_NATIVE_CURSOR` in `src/components/cursor/CursorImpl.tsx`. |
| OI-28 | Raw Wix originals are kept in `content/raw/` (gitignored) rather than `public/projects/`; only optimized WebP files ship from `public/projects/<slug>/`. | — |
| OI-29 | Lighthouse is run headless (software GL), so the WebGL probe falls back to the static hero during audits; a headed run with WebGL active is reported separately. | `pnpm qa:lighthouse --headed`. |
| OI-37 | Service areas have no hover *image* reveal (the Abvtek borrow): the regions have no project imagery of their own, so the interaction is the underline draw + "Get in touch" hint. | Add region imagery to `content/` and the section if wanted. |
| OI-38 | Disciplines on touch devices render all four rows expanded (no accordion toggles) — everything is reachable without JS. | Add toggles in `src/components/sections/Disciplines` if collapsing is preferred. |
| OI-39 | The Education note under Commercial reads "Including education centers: engaging and stimulating environments tailored to all learners." (from the live Education card). | `src/lib/disciplines.ts`. |

## F. Tooling / environment

| ID | Item |
|---|---|
| OI-30 | The brief's "design-taste" and "design-engineering" skills are not available in this environment; the Awwwards reference research (`DIRECTION.md`) and `qa/rubric.md` substitute. |
| OI-31 | Godly.website now redirects to recent.design and The FWA's search requires JavaScript; references were gathered from Awwwards only. |
| OI-32 | Lighthouse 13 requires Node ≥ 22.19; Node 20.17 is installed, so Lighthouse 12.8.2 is pinned (identical scoring). TypeScript is pinned to 5.9 because 7.x has no JS compiler API for Next. |
| OI-41 | The QA harness records one GL driver note ("GPU stall due to ReadPixels") on `/` — the only WebGL route — when it screenshots the live hero canvas. It is allowlisted in `qa/allowlist.json` with the evidence; real sessions produce zero console output (`qa/webgl.spec.ts` plus two browsing probes). |
| OI-40 | Lighthouse mobile audits are run over a local HTTP/2 proxy (`pnpm qa:h2`) because `next start` only speaks HTTP/1.1 and the simulated-throttling model charges extra round-trips per connection that a production H2/H3 edge does not incur; HTTP/1.1 numbers are reported alongside. Images below the fold load via IntersectionObserver (with `<noscript>` fallbacks) rather than native `loading=lazy`, which fetched several screens of imagery at parse time. |
