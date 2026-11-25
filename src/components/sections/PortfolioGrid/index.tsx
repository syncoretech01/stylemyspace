import type { Route } from "next";
import type { Project, ProjectImage } from "@/lib/content.schema";
import { getCover } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/components/ui/cn";
import { FlipLink } from "@/components/transition/FlipLink";
import { PortfolioGridMotionRoot } from "./PortfolioGridMotionRoot";

type Props = { projects: Project[]; title: string; intro: string };

/**
 * Repeating 12-column span pattern: 7/5 · 5/7 · 4/4/4 (seven tiles per cycle).
 * DOM order = visual order = tab order; the grid reads as masonry through per-tile aspect ratios.
 */
type Span = 7 | 5 | 4;
const PATTERN: Span[] = [7, 5, 5, 7, 4, 4, 4];

const SPAN_CLASS: Record<Span, string> = {
  7: "lg:col-span-7",
  5: "lg:col-span-5",
  4: "lg:col-span-4",
};

/** `sizes` must never be smaller than the rendered width: 12-col tile widths at ≥1024, 2-up at ≥768, full below. */
const SIZES: Record<Span, string> = {
  7: "(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw",
  5: "(min-width: 1024px) 42vw, (min-width: 768px) 50vw, 100vw",
  4: "(min-width: 1024px) 34vw, (min-width: 768px) 50vw, 100vw",
};

/** The md-orphan tile spans the whole 2-up row, so it renders full-bleed between 768 and 1024. */
const SIZES_ORPHAN: Record<Span, string> = {
  7: "(min-width: 1024px) 58vw, 100vw",
  5: "(min-width: 1024px) 42vw, 100vw",
  4: "(min-width: 1024px) 34vw, 100vw",
};

/** Frame ratio follows the cover's own orientation so no subject is fought by the crop. */
function frameRatio(cover: ProjectImage | null): string {
  if (!cover) return "aspect-[4/5]";
  const r = cover.width / cover.height;
  if (r > 1.15) return "aspect-[4/3]";
  if (r < 0.87) return "aspect-[4/5]";
  return "aspect-square";
}

/** The lg restatement of each ratio, for the tile that widens to two columns at md. */
const RATIO_LG: Record<string, string> = {
  "aspect-[4/5]": "lg:aspect-[4/5]",
  "aspect-[4/3]": "lg:aspect-[4/3]",
  "aspect-square": "lg:aspect-square",
};

/**
 * Covers whose master carries the Wix scroll-cue disc burned into its top band: the frame is cut
 * landscape and anchored to the bottom edge so the artefact falls outside every crop. The disc sits
 * between 17% and 25% of the square's height, so a 7/5 frame (top 28.6% dropped) clears it at every
 * width. Remove the entry once a retouched master ships (see the asset request in OPEN-ITEMS).
 */
const ARTEFACT_CROP: Record<string, { ratio: string; position: string }> = {
  "wellness-space-with-city-view": { ratio: "aspect-[7/5]", position: "50% 100%" },
};

export function PortfolioGrid({ projects, title, intro }: Props) {
  const heading = title || "Portfolio";
  // With an odd tile count the last tile would sit alone in the 2-up md grid beside an empty cell.
  const orphanAtMd = projects.length % 2 === 1;

  return (
    <PortfolioGridMotionRoot>
      <Section aria-labelledby="portfolio-title" className="lg:pt-12">
        <Container>
          <header className="grid gap-y-3 lg:grid-cols-12 lg:items-end lg:gap-x-4">
            <Heading as="h1" id="portfolio-title" size="display" className="lg:col-span-7" data-reveal data-reveal-lcp>
              {heading}
            </Heading>
            <p className="lede max-w-[34ch] lg:col-span-5 lg:pb-1.5" data-reveal>
              {intro}
            </p>
          </header>

          <ul className="portfolio-grid mt-6 grid grid-cols-1 items-start gap-x-3 gap-y-7 md:mt-8 md:grid-cols-2 md:gap-x-4 md:gap-y-9 lg:mt-9 lg:grid-cols-12 lg:gap-y-11" role="list">
            {projects.map((p, i) => {
              const span = PATTERN[i % PATTERN.length] ?? 4;
              const cover = getCover(p);
              // The 5-col tile of each two-up row steps down for an editorial stagger (desktop only).
              const pos = i % PATTERN.length;
              const stepped = pos === 1 || pos === 2;
              const isLast = i === projects.length - 1;
              const crop = ARTEFACT_CROP[p.slug];
              const ratio = crop?.ratio ?? frameRatio(cover);
              return (
                <li
                  key={p.slug}
                  className={cn(
                    "tile relative",
                    SPAN_CLASS[span],
                    stepped && "lg:mt-12",
                    orphanAtMd && isLast && "md:col-span-2",
                  )}
                  data-reveal
                >
                  <FlipLink
                    href={`/portfolio/${p.slug}` as Route}
                    slug={p.slug}
                    className="group block rounded-xs"
                  >
                    <figure>
                      <div
                        data-cursor="View"
                        className={cn(
                          "tile-frame overflow-clip bg-taupe/40",
                          ratio,
                          // The last tile fills the md row, so its frame turns landscape there.
                          orphanAtMd && isLast && `md:aspect-[3/2] ${RATIO_LG[ratio] ?? ""}`,
                        )}
                      >
                        <SmartImage
                          image={cover}
                          sizes={orphanAtMd && isLast ? SIZES_ORPHAN[span] : SIZES[span]}
                          lcp={i === 0}
                          quality={i === 0 ? 85 : 75}
                          className="h-full w-full"
                          imgClassName="transition-transform duration-[1200ms] ease-(--ease-out-expo) group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
                          imgProps={{ "data-flip-id": p.slug }}
                          objectPosition={crop?.position}
                          placeholderTodo={`${p.title} cover`}
                        />
                      </div>
                      <figcaption className="mt-2">
                        {/* The 4-col tile is only ~266px wide at 1024; at h3 every title there breaks to a
                            one-word second line, so the size steps down for that band. */}
                        <h2 className="font-display text-h3 text-ink lg:text-[1.5rem] xl:text-h3">
                          {/* The title is the resting state; a duplicate waits under the mask and rolls in
                              on hover / keyboard focus. Nothing here ever hides the name itself. */}
                          <span className="tile-name-mask relative inline-block overflow-clip align-bottom leading-[1.3]">
                            <span className="tile-name block transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:-translate-y-full group-focus-visible:-translate-y-full">
                              {p.title}
                            </span>
                            <span
                              aria-hidden="true"
                              className="tile-name absolute top-full left-0 block w-full text-olive italic transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:-translate-y-full group-focus-visible:-translate-y-full"
                            >
                              {p.title}
                            </span>
                          </span>
                        </h2>
                        {p.category && <Eyebrow className="mt-0.5">{p.category}</Eyebrow>}
                      </figcaption>
                    </figure>
                  </FlipLink>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>
    </PortfolioGridMotionRoot>
  );
}
