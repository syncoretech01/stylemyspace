import { Fragment } from "react";
import type { ProjectImage } from "@/lib/content.schema";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";
import { ManifestoMotionRoot } from "./ManifestoMotionRoot";

/** Statement assembled from the brief's Section 2 positioning and approach (no new claims). */
export const MANIFESTO =
  "We design spaces that balance elegance with ease, and sophistication with warmth, across a range of budgets, styles and timelines, guiding you through every phase.";

/** The two pairs the sentence turns on are set in the true italic. Punctuation is ignored when matching. */
const EMPHASIS = new Set(["elegance", "ease", "sophistication", "warmth"]);

/**
 * Splits the statement into word tokens with whitespace preserved as separate entries,
 * so the paragraph renders exactly the same text and the motion module can scrub `.word` opacity.
 */
const TOKENS = MANIFESTO.split(/(\s+)/).filter((t) => t.length > 0);

function Word({ token }: { token: string }) {
  const bare = token.replace(/[.,]$/, "");
  if (!EMPHASIS.has(bare)) return <span className="word">{token}</span>;
  return (
    <span className="word">
      <em>{bare}</em>
      {token.slice(bare.length)}
    </span>
  );
}

/**
 * The statement on a solid olive field, with one photograph beside it at full strength. (It used to run
 * over the kitchen under two stacked scrims, which muddied both the picture and the type.)
 * Structure: <section> (relative, clip) → motion root (reserves the pin distance on motion tiers:
 * 200svh full / 160svh mobile, natural height otherwise) → [data-manifesto-pin] (100svh, centred grid).
 * Manifesto.motion.ts pins the inner div and scrubs word opacity + the photograph's scale; under reduced
 * motion this markup IS the final state (all words opacity 1, no reserved height, nothing pinned).
 */
export function Manifesto({ image }: { image: ProjectImage | null }) {
  return (
    <Section id="manifesto" tone="dark" flush aria-labelledby="manifesto-title" className="overflow-clip">
      <ManifestoMotionRoot className="relative motion-full:h-[200svh] motion-mobile:h-[160svh]">
        <div className="relative grid min-h-svh items-center overflow-clip motion-on:h-svh" data-manifesto-pin>
          <Container className="relative grid items-center gap-8 pt-[calc(var(--header-h)+2rem)] pb-6 lg:grid-cols-12 lg:gap-4">
            <h2 id="manifesto-title" className="visually-hidden">
              Our approach
            </h2>
            <p
              data-manifesto-words
              className="font-display text-h1 text-pretty text-bone lg:col-span-8 lg:text-[clamp(2.75rem,min(5.1vw,8.9svh),5.75rem)]"
            >
              {TOKENS.map((token, i) => (
                <Fragment key={i}>{/^\s+$/.test(token) ? token : <Word token={token} />}</Fragment>
              ))}
            </p>
            <div className="hidden overflow-clip lg:col-span-4 lg:block" data-reveal>
              <div className="aspect-[4/5] max-h-[72svh] w-full" data-manifesto-bg>
                <SmartImage
                  image={image}
                  sizes="(min-width: 1024px) 32vw, 1px"
                  alt=""
                  className="h-full w-full"
                  objectPosition="60% 62%"
                  placeholderTodo="manifesto photograph (Oceanside dining table)"
                />
              </div>
            </div>
          </Container>
        </div>
      </ManifestoMotionRoot>
    </Section>
  );
}
