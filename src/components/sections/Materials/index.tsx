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
 *
 * The geometry is derived rather than eyeballed, so the connector lines land on the swatch centres
 * at every width. Horizontal positions are percentages of the stage width; a swatch is 27 % wide
 * and, being square, 27 % of the stage WIDTH tall — which is why the vertical positions are written
 * in `cqw` (the stage is the query container) instead of percentages of the stage height. The stage
 * height is then the sum of its parts, so no ratio slack is left over and a caption's line count can
 * never shift a swatch:
 *
 *   height   = 2 × 27cqw (swatch rows) + 2 × --mat-cap (caption reserves) + --mat-gap (row gap)
 *   row 2 y  = 27cqw + --mat-cap + --mat-gap
 *
 * Class strings are written out in full because Tailwind scans this file as text.
 */
const SWATCH = 27; // swatch width, % of stage width (half of it — 13.5 — is written into the classes)
const INSET = 7; // bottom-row inset from the stage edge, % of stage width — equal on both sides,
// and repeated as the literal `lg:left-[7%]` / `lg:right-[7%]` below (Tailwind scans for whole classes)

const ROW2_TOP = "lg:top-[calc(27cqw_+_var(--mat-cap)_+_var(--mat-gap))]";
const SLOTS: readonly [string, string, string, string] = [
  "lg:left-0 lg:top-0", // top-left
  "lg:right-0 lg:top-0", // top-right
  `lg:left-[7%] ${ROW2_TOP}`, // bottom-left
  `lg:right-[7%] ${ROW2_TOP}`, // bottom-right
];

/** Stage height, and the caption/gap reserves the two formulas above are built from. */
const STAGE =
  "[--mat-cap:10rem] [--mat-gap:4rem] lg:h-[calc(54cqw_+_2_*_var(--mat-cap)_+_var(--mat-gap))] xl:[--mat-cap:8rem] xl:[--mat-gap:5rem]";

/**
 * The connector overlay is a box whose four corners ARE the four swatch centres: inset half a swatch
 * horizontally, half a swatch (in cqw) from the stage top, and half a swatch plus one caption
 * reserve from the stage bottom. With a 0–100 viewBox and `preserveAspectRatio="none"` the path
 * coordinates are therefore literal percentages OF THAT BOX and stay exact at any stage aspect: the
 * top swatches sit on its top corners, the inset bottom swatches sit `INSET` of the stage width in
 * from its bottom corners. The centre dot is an HTML element, not an SVG circle, so the stretched
 * viewBox cannot turn it into an ellipse.
 */
const OVERLAY =
  "lg:left-[13.5%] lg:right-[13.5%] lg:top-[13.5cqw] lg:bottom-[calc(13.5cqw_+_var(--mat-cap))]";
const BOX_W = 100 - SWATCH; // overlay box width, % of stage width
const X_IN = Number(((INSET / BOX_W) * 100).toFixed(2)); // bottom swatch centre, % of the box
const CENTRE = [50, 50] as const;
const ANCHORS: readonly (readonly [number, number])[] = [
  [0, 0], // top-left swatch centre
  [100, 0], // top-right
  [X_IN, 100], // bottom-left
  [100 - X_IN, 100], // bottom-right
];

/**
 * "Materials & palette": four square crops of real project photography sit in their exploded
 * positions with thin connector lines from a centre point. Below `lg` they stack as a 2×2 grid
 * with the connectors hidden. This markup is the end state; Materials.motion.ts adds the assembled
 * start (the swatches stacked on the centre dot) and scrubs the explosion, connector draw and
 * caption fade.
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

          {/* Query container: the swatches are square, so every vertical measure below is a share of
              this box's WIDTH (cqw) and the stage height is the sum of its parts. */}
          <div className="@container mt-10 md:mt-12 lg:mt-16">
            <div className={cn("relative grid grid-cols-2 gap-x-3 gap-y-6 lg:block", STAGE)} data-materials-stage>
              {/* Connector overlay: the box corners are the swatch centres, so the 0–100 viewBox
                  coordinates are exact at every width. Desktop only. */}
              <div aria-hidden className={cn("pointer-events-none absolute hidden lg:block", OVERLAY)}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                  {ANCHORS.map(([x, y], i) => (
                    <path
                      key={i}
                      d={`M${CENTRE[0]} ${CENTRE[1]} L${x} ${y}`}
                      pathLength={1}
                      fill="none"
                      stroke="var(--color-taupe)"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                      data-materials-connector
                    />
                  ))}
                </svg>
                <span
                  className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass"
                  data-materials-centre
                />
              </div>

              {items.map((m, i) => {
                const slot = SLOTS[i] ?? SLOTS[0];
                const image = resolveImage(m.image);
                const credit = m.image ? getProject(m.image.slug)?.title : null;
                return (
                  <figure
                    key={m.id}
                    className={cn("relative lg:absolute lg:w-[27%]", slot)}
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
                        <span aria-hidden className="text-olive">
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
          </div>
        </Container>
      </MaterialsMotionRoot>
    </Section>
  );
}
