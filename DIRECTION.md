# Direction note — Style My Space Design

Warm, editorial, quietly luxurious. A design monograph, not a landing page: generous whitespace,
one confident display serif, photography carrying the weight, restraint everywhere else.

## Brand system decisions

- **Type**: Fraunces (optical-size axis; display, wordmark, pull-quotes) + Inter Tight (UI, body,
  labels). Two families, both self-hosted through `next/font`.
- **Wordmark**: "STYLE MY SPACE" set in Fraunces at a light weight, letter-spaced `0.18em`, with
  "Design" as a small-caps sans suffix. Drawn as an SVG outline for the preloader.
- **Palette**: bone page base, sand for alternate sections, taupe for rules and muted fills, olive
  as the primary (buttons, focus rings, cursor), olive-deep for dark sections and the footer with
  bone text, ink for body copy, brass only as a thin metallic accent (rules, numerals, a single
  hover underline). Never pure black or white.
- **Spacing**: 8 px scale (`--spacing: 0.5rem`). Section padding 12–20 units desktop, 8–10 mobile.
- **Type scale**: fluid `clamp()` display down to a 12 px eyebrow floor. Body measure 60–75 ch.
- **Buttons**: pill-less, 1 px olive rule, uppercase sans label with tracking; filled olive variant
  for the primary CTA. Forms use floating labels on a 1 px taupe baseline that turns olive on focus.

## Photography

Oceanside is real photography of a completed house and is, almost literally, the brand palette:
olive wallpaper, olive velvet, brass pendants, white stone. It anchors the home hero (the "Dining"
frame), the manifesto background ("Kitchen 2") and the material swatches. Las Olas contributes the
marble and oak. The five 2500 px square collections are shown with their own descriptions from the
live site and are never described as completed work (see OPEN-ITEMS).

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
