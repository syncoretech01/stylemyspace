import { Fragment } from "react";
import type { ProjectImage } from "@/lib/content.schema";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";
import { ManifestoMotionRoot } from "./ManifestoMotionRoot";

/** Statement assembled from the brief's Section 2 positioning and approach (no new claims). */
export const MANIFESTO =
  "We design spaces that balance elegance with ease, and sophistication with warmth — across a range of budgets, styles and timelines, guiding you through every phase.";

/**
 * Splits the statement into word tokens with whitespace preserved as separate entries,
 * so the paragraph renders exactly the same text and the motion module can scrub `.word` opacity.
 */
const TOKENS = MANIFESTO.split(/(\s+)/).filter((t) => t.length > 0);

/**
 * Dark, full-height statement over the Oceanside kitchen.
 * Structure: <section> (relative, clip) → motion root (reserves the pin distance on motion tiers:
 * 220svh full / 170svh mobile, natural height otherwise) → [data-manifesto-pin] (100svh, centred grid).
 * Manifesto.motion.ts pins the inner div and scrubs word opacity + background scale; under reduced
 * motion this markup IS the final state (all words opacity 1, no reserved height, nothing pinned).
 */
export function Manifesto({ image }: { image: ProjectImage | null }) {
  return (
    <Section id="manifesto" tone="dark" flush aria-labelledby="manifesto-title" className="overflow-clip">
      <ManifestoMotionRoot className="relative motion-full:h-[220svh] motion-mobile:h-[170svh]">
        <div className="relative grid min-h-svh place-items-center overflow-clip motion-on:h-svh" data-manifesto-pin>
          {/*
            Own absolute wrapper: SmartImage's fill frame is `relative`, so it needs a sized parent to fill.
            This layer (a descendant of the pinned element, never an ancestor) is what the module scales 1 → 1.08.
          */}
          <div aria-hidden className="absolute inset-0" data-manifesto-bg>
            <SmartImage
              image={image}
              sizes="100vw"
              alt=""
              className="h-full w-full"
              objectPosition="50% 35%"
              placeholderTodo="manifesto background (Oceanside kitchen) — pending image pipeline"
            />
          </div>
          {/*
            55% olive-deep scrim everywhere, plus a second layer behind the statement so bone copy stays
            ≥ 4.5:1 over the white kitchen: flat below lg (the text spans the full width), a left-weighted
            gradient from lg up that lets the right edge of the photograph breathe.
          */}
          <div aria-hidden className="absolute inset-0 bg-olive-deep/55" />
          <div
            aria-hidden
            className="absolute inset-0 bg-olive-deep/45 lg:bg-transparent lg:bg-linear-to-r lg:from-olive-deep/45 lg:via-olive-deep/45 lg:via-80% lg:to-olive-deep/25"
          />
          <Container className="relative py-16 md:py-20">
            <h2 id="manifesto-title" className="visually-hidden">
              Our approach
            </h2>
            <Eyebrow data-reveal>Manifesto</Eyebrow>
            <p
              aria-label={MANIFESTO}
              data-reveal
              data-manifesto-words
              className="mt-4 max-w-[22ch] font-display text-h1 text-balance text-bone md:mt-5"
            >
              {TOKENS.map((token, i) => (
                <Fragment key={i}>{/^\s+$/.test(token) ? token : <span className="word">{token}</span>}</Fragment>
              ))}
            </p>
          </Container>
        </div>
      </ManifestoMotionRoot>
      {/*
        Seam bleed. The Hero's ground is solid olive-deep at its bottom edge, so the two dark
        sections met on a hard full-width line (#363B2B abutting the photograph's ~#5F6254). This
        carries the hero's ground into the top of the image so the pair reads as one dark movement
        instead of two stacked panels. It sits outside the pinned element, so it stays at the top of
        the section rather than travelling with the pin.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-linear-to-b from-olive-deep to-transparent lg:h-40"
      />
    </Section>
  );
}
