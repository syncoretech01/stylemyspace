import type { Material } from "@/lib/content.schema";
import { getProject, resolveImage } from "@/lib/content";
import { cn } from "@/components/ui/cn";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";
import { MaterialsMotionRoot } from "./MaterialsMotionRoot";

/**
 * Intro line — verbatim from the firm's blog post "Tranquil and Functional Interior Design:
 * Creating Spaces That Soothe and Serve" (content/projects.json → blog[0].body).
 */
const INTRO_QUOTE =
  "Thoughtfully chosen elements such as soft lighting, neutral palettes, natural textures, and comfortable furnishings can transform a room into a haven.";
const INTRO_SOURCE = "Tranquil and Functional Interior Design";

const FALLBACK: Material[] = [
  { id: "wood", label: "Wood", quote: "", quoteSource: "", image: null, objectPosition: "50% 50%" },
  { id: "stone", label: "Stone", quote: "", quoteSource: "", image: null, objectPosition: "50% 50%" },
  { id: "textile", label: "Textile", quote: "", quoteSource: "", image: null, objectPosition: "50% 50%" },
  { id: "brass", label: "Brass", quote: "", quoteSource: "", image: null, objectPosition: "50% 50%" },
];

/**
 * Exploded end-state layout for the four swatches on the desktop stage.
 * `figure` = Tailwind position classes (percent of the stage); `anchor` = the swatch centre in the
 * SVG's 400×300 system that the connector line from the stage centre (200,150) points at.
 * Swatches are 27% of the stage width (108 units); bottom-row figures are anchored to the stage
 * bottom so the caption height never pushes them out of the stage. The stage is 5:4 at xl and
 * 10:9 at lg — the minimum that keeps two rows of swatch + caption clear of each other — and the
 * SVG stretches to it (preserveAspectRatio="none" + non-scaling strokes).
 */
type Slot = { figure: string; anchor: readonly [number, number] };
const SLOTS: readonly [Slot, Slot, Slot, Slot] = [
  { figure: "lg:left-0 lg:top-0", anchor: [54, 54] }, // top-left
  { figure: "lg:right-0 lg:top-0", anchor: [346, 54] }, // top-right
  { figure: "lg:bottom-0 lg:left-[7%]", anchor: [82, 214] }, // bottom-left
  { figure: "lg:bottom-0 lg:right-[10%]", anchor: [306, 214] }, // bottom-right
];
const CENTRE = [200, 150] as const;

/**
 * "Materials & palette": four square crops of real project photography sit in their exploded
 * positions with thin connector lines from a centre point. Below `lg` they stack as a 2×2 grid
 * with the connectors hidden. This markup is the end state; Materials.motion.ts adds the assembled
 * start (stack at the stage centre) and scrubs the explosion, connector draw and caption fade.
 */
export function Materials({ materials }: { materials: Material[] }) {
  const items = (materials.length ? materials : FALLBACK).slice(0, 4);

  return (
    <Section id="materials" aria-labelledby="materials-title">
      <MaterialsMotionRoot>
        <Container>
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-x-4 lg:gap-y-0">
            <div className="lg:col-span-7">
              <Eyebrow data-reveal>Materials &amp; palette</Eyebrow>
              <Heading id="materials-title" className="mt-2 max-w-[18ch]" data-reveal>
                Warm wood, stone, soft textiles and a note of brass.
              </Heading>
            </div>
            <blockquote className="self-end lg:col-span-4 lg:col-start-9" data-reveal>
              <p className="text-body text-ink">“{INTRO_QUOTE}”</p>
              <footer className="mt-2 text-small text-olive">
                From the Style My Space Design blog, <cite className="not-italic">{INTRO_SOURCE}</cite>
              </footer>
            </blockquote>
          </div>

          <div
            className="relative mt-10 grid grid-cols-2 gap-x-3 gap-y-6 md:mt-12 lg:mt-16 lg:block lg:aspect-[10/9] xl:aspect-[5/4]"
            data-materials-stage
          >
            {/* Connector lines: same 400×300 coordinate system as the % positions above. Desktop only. */}
            <svg
              viewBox="0 0 400 300"
              preserveAspectRatio="none"
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
            >
              {SLOTS.map((slot, i) => (
                <path
                  key={i}
                  d={`M${CENTRE[0]} ${CENTRE[1]} L${slot.anchor[0]} ${slot.anchor[1]}`}
                  pathLength={1}
                  fill="none"
                  stroke="var(--color-taupe)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  data-materials-connector
                />
              ))}
              <circle cx={CENTRE[0]} cy={CENTRE[1]} r={2.5} fill="var(--color-brass)" data-materials-centre />
            </svg>

            {items.map((m, i) => {
              const slot = SLOTS[i] ?? SLOTS[0];
              const image = resolveImage(m.image);
              const credit = m.image ? getProject(m.image.slug)?.title : null;
              return (
                <figure
                  key={m.id}
                  className={cn("relative lg:absolute lg:w-[27%]", slot.figure)}
                  data-reveal
                  data-materials-swatch={m.id}
                >
                  <SmartImage
                    image={image}
                    sizes="(min-width: 1024px) 30vw, 50vw"
                    className="aspect-square"
                    objectPosition={m.objectPosition}
                    placeholderTodo={`${m.label} swatch — pending image pipeline`}
                  />
                  <figcaption className="mt-2">
                    <span className="eyebrow flex items-baseline gap-1.5 text-olive">
                      <span aria-hidden className="text-brass">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {credit && <span>{credit}</span>}
                    </span>
                    <span className="mt-1 block font-display text-h3 text-ink">{m.label}</span>
                    {m.quote && <p className="mt-1 text-small text-olive text-pretty">“{m.quote}”</p>}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </Container>
      </MaterialsMotionRoot>
    </Section>
  );
}
