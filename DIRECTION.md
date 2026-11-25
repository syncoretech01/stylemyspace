# Direction note — Style My Space Design

Warm, editorial, quietly luxurious. A design monograph, not a landing page: generous whitespace,
one confident display serif, photography carrying the weight, restraint everywhere else.

## Brand system decisions

- **Type**: Cormorant Garamond (display, ledes, numerals, wordmark) + Jost (body, UI, labels), both
  self-hosted through `next/font`. Cormorant is the brief's own named alternative. It was chosen by
  setting the site's real headlines in nine candidates on the site's palette: it has the warmest
  contrast, a true calligraphic italic and the best ampersand of the set, which suits "elegance with
  ease, sophistication with warmth". Jost's geometric capitals are the classic foil for it.
  - Its weakness is a small x-height and fine hairlines, so it is set at 500 throughout and about 15%
    larger than a book face would be. One static instance ships (plus the italic), to protect mobile LCP.
  - The true italic is the only emphasis device: one phrase per headline, never a second typeface.
  - Lining figures site-wide (`lnum`), because prices and phone numbers are set in the serif.
  - Tracked capitals (`eyebrow`) are for buttons, navigation and metadata. They are **not** a kicker
    above every section heading; sections open on their headline.
- **Wordmark**: "STYLE MY SPACE" in Cormorant Garamond capitals, letter-spaced `0.2em`, with
  "Design" as a small tracked-sans suffix. Drawn as an SVG outline for the preloader.
- **Palette**: bone page base, sand for alternate sections, taupe for rules and muted fills, olive
  as the primary (buttons, focus rings, cursor), olive-deep for dark sections and the footer with
  bone text, ink for body copy, brass only as a thin metallic accent (rules, numerals, a single
  hover underline). Never pure black or white.
- **Spacing**: 8 px scale (`--spacing: 0.5rem`). Section padding 12–20 units desktop, 8–10 mobile.
- **Type scale**: fluid `clamp()` display down to a 13 px label floor, 18 px body, 62–72 character
  measure. `--text-hero` is also bounded by viewport height so the home headline and its calls to
  action always share the first screen.
- **Buttons**: pill-less, 1 px olive rule, uppercase sans label with tracking; filled olive variant
  for the primary CTA. Forms use static labels above a 1 px olive baseline that thickens on focus.
- **One label per intent**: "Start a project" (contact), "View the work" (portfolio).

## Photography

Oceanside is real photography of a completed house and is, almost literally, the brand palette:
olive wallpaper, olive velvet, brass pendants, white stone. It anchors the home hero (the "Dining"
frame, shown without any scrim: the headline sits on its white ceiling, which dissolves into the
page), the manifesto photograph, the Residential discipline, two process cards and two of the material
swatches. Swatches are tight crops of the masters (`crop` in `content/overrides.json`), so wood reads as
wood and velvet as velvet. The five 2500 px square collections are shown with their own descriptions from
the live site and are never described as completed work (see OPEN-ITEMS).

**One photograph, one place.** No photograph appears twice on a page, crops included, and neither do two
frames of the same view. The home page has twenty photographs in twenty slots; a project with a single
photograph shows it once, whole, beside its words. `pnpm qa` fails any page that breaks this
(`repeated-photo`).

## References (Awwwards gallery, gathered 2026-08-28) — what is borrowed, structurally

| Reference | Recognition | Borrowed |
|---|---|---|
| MERSI — mersi-architecture.com | SOTD Apr 2026 | The closest tonal cousin (warm beige / near-black). Project index treatment (name · category · location · year in columns) for `/portfolio`; the single-line hero statement at editorial scale. |
| GKC Architecture & Design — gkc.ca (Locomotive) | SOTD Nov 2025 | Horizontal project carousel as the pinned Featured-work section; an end-of-page "let's talk" block that precedes the footer. |
| Telha Clarke — telhaclarke.com.au | SOTD Feb 2026 | Loader → hero handoff; parallax grid gallery on the portfolio; next-project widget on case studies. |
| Nine To Five — 9to5studio.it | SOTD Apr 2026 | About-page hierarchy: statement → portrait → detail paragraphs; gallery-first project pages. |
| Tecnoarreda — tecnoarreda.it | HM Jul 2026 | Uppercase eyebrow labels with serif emphasis in headings; the four-solutions row → our four Disciplines columns. |
| Pelizzari Studio — pelizzari.com | HM Jul 2026 | "Know How" methodology block → the Process stack; a two-column NAP footer. |
| Abvtek Interiors — abvtek.com (Next.js) | HM Jun 2026 | Numbered `01 / 04` slider counters; hover image reveals (next-project link, service areas). |
| Yoo Interior — yoointerior.com | HM Jun 2026 | Card hierarchy: category eyebrow above the project name. |

Not borrowed from any of them: colour, typefaces, copy, layout proportions.

Gallery notes: Godly.website now redirects to recent.design and The FWA's search requires
JavaScript, so the eight references above all come from Awwwards' Architecture / Interior Design
listings.
