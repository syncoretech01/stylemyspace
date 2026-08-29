import type { Route } from "next";
import type { Project, ProjectImage } from "@/lib/content.schema";
import { getCover } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
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

/** Frame ratio follows the cover's own orientation so no subject is fought by the crop. */
function frameRatio(cover: ProjectImage | null): string {
  if (!cover) return "aspect-[4/5]";
  const r = cover.width / cover.height;
  if (r > 1.15) return "aspect-[4/3]";
  if (r < 0.87) return "aspect-[4/5]";
  return "aspect-square";
}

export function PortfolioGrid({ projects, title, intro }: Props) {
  // The live site titles the page "My Portfolio"; the h1 drops the possessive.
  const heading = title.replace(/^my\s+/i, "") || "Portfolio";
  const count = projects.length;

  return (
    <PortfolioGridMotionRoot>
      <Section aria-labelledby="portfolio-title" className="pt-16 md:pt-20 lg:pt-24">
        <Container>
          <header className="grid gap-y-6 lg:grid-cols-12 lg:gap-x-4">
            <div className="lg:col-span-8">
              <Eyebrow data-reveal>Portfolio</Eyebrow>
              <Heading as="h1" id="portfolio-title" size="h1" className="mt-2" data-reveal>
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
              return (
                <li
                  key={p.slug}
                  className={cn("tile", SPAN_CLASS[span], stepped && "lg:mt-16")}
                  data-reveal
                >
                  <FlipLink
                    href={`/portfolio/${p.slug}` as Route}
                    slug={p.slug}
                    className="group block rounded-xs"
                    data-cursor="View"
                  >
                    <figure>
                      <div className={cn("tile-frame overflow-clip bg-taupe/40", frameRatio(cover))}>
                        <SmartImage
                          image={cover}
                          sizes={SIZES[span]}
                          lcp={i === 0}
                          quality={i === 0 ? 85 : 75}
                          className="h-full w-full"
                          imgClassName="transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
                          imgProps={{ "data-flip-id": p.slug }}
                          placeholderTodo={`${p.title} cover — pending image pipeline`}
                        />
                      </div>
                      <figcaption className="mt-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {p.category ? <Eyebrow>{p.category}</Eyebrow> : <span aria-hidden="true" className="eyebrow block">&nbsp;</span>}
                          <h2 className="mt-1 font-display text-h3 text-ink">
                            <span className="tile-name-mask inline-block overflow-clip align-bottom">
                              <span className="tile-name inline-block">{p.title}</span>
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
