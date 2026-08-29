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
  const count = projects.length;
  // With an odd tile count the last tile would sit alone in the 2-up md grid beside an empty cell.
  const orphanAtMd = projects.length % 2 === 1;

  return (
    <PortfolioGridMotionRoot>
      <Section aria-labelledby="portfolio-title">
        <Container>
          <header className="grid gap-y-6 lg:grid-cols-12 lg:gap-x-4">
            <div className="lg:col-span-8">
              <Heading as="h1" id="portfolio-title" size="h1" data-reveal data-reveal-lcp>
                {heading}
              </Heading>
              <p className="measure mt-4 text-lead text-olive" data-reveal>
                {intro}
              </p>
            </div>
            <p className="flex items-end gap-2 lg:col-span-4 lg:justify-end" data-reveal>
              <span className="font-display text-h2 leading-none text-brass tabular-nums">{count}</span>
              <span className="eyebrow pb-1 text-olive">{count === 1 ? "project" : "projects"}</span>
            </p>
          </header>

          <div className="rule mt-8 md:mt-10" aria-hidden="true" />

          <ul className="portfolio-grid mt-8 grid grid-cols-1 items-start gap-x-3 gap-y-8 md:grid-cols-2 md:gap-x-4 md:gap-y-10 lg:grid-cols-12 lg:gap-y-16" role="list">
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
                    stepped && "lg:mt-16",
                    orphanAtMd && isLast && "md:col-span-2",
                  )}
                  data-reveal
                >
                  <FlipLink
                    href={`/portfolio/${p.slug}` as Route}
                    slug={p.slug}
                    className="group block rounded-xs"
                    data-cursor="View"
                  >
                    <figure>
                      <div
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
                          imgClassName="transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
                          imgProps={{ "data-flip-id": p.slug }}
                          objectPosition={crop?.position}
                          placeholderTodo={`${p.title} cover — pending image pipeline`}
                        />
                      </div>
                      <figcaption className="mt-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {p.category ? <Eyebrow>{p.category}</Eyebrow> : <span aria-hidden="true" className="eyebrow block">&nbsp;</span>}
                          {/* The 4-col tile is only ~266px wide at 1024; at h3 every title there
                              breaks to a one-word second line, so the size steps down for that band. */}
                          <h2 className="mt-1 font-display text-h3 text-ink lg:text-lead xl:text-h3">
                            {/* The title is the resting state; a duplicate waits under the mask and rolls in
                                on hover / keyboard focus. Nothing here ever hides the name itself. */}
                            <span className="tile-name-mask relative inline-block overflow-clip align-bottom leading-[1.35]">
                              <span className="tile-name block transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:-translate-y-full group-focus-visible:-translate-y-full">
                                {p.title}
                              </span>
                              <span
                                aria-hidden="true"
                                className="tile-name absolute left-0 top-full block w-full text-olive transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:-translate-y-full group-focus-visible:-translate-y-full"
                              >
                                {p.title}
                              </span>
                            </span>
                          </h2>
                        </div>
                        <span className="shrink-0 pt-0.5 font-display text-lead text-olive tabular-nums" aria-hidden="true">
                          {String(i + 1).padStart(2, "0")}
                        </span>
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
