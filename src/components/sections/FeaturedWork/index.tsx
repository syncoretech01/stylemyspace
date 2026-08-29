import Link from "next/link";
import type { Route } from "next";
import type { Project, ProjectImage } from "@/lib/content.schema";
import { getCover } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/components/ui/cn";
import styles from "./FeaturedWork.module.css";

const FEATURED_COUNT = 5;
const AFTER_ID = "after-featured-work";

/**
 * Per-cover crop hints for the 4:5 frame (landscape covers lose their sides).
 * Oceanside "Dining": the olive dining nook sits right of centre.
 */
const CROP: Record<string, string> = {
  oceanside: "64% 50%",
};

/**
 * Covers whose master carries the Wix scroll-cue disc burned into its top band.
 *
 * The frame is portrait and the master is square, so `object-position` cannot reach the artefact —
 * a square source in a 4:5 box is cropped on the x axis only. Instead the image layer is made taller
 * than the frame and pinned to its bottom edge, so the frame window shows the bottom 1/1.4 of the
 * photograph and the disc (17%–25% of the square's height) never enters it. `sizes` states the
 * layer's real rendered width, which is 1.4x the frame, so the srcset stays sharp.
 * Remove once a retouched master ships (see the asset request in OPEN-ITEMS).
 */
const ARTEFACT_CROP: Record<string, { layer: string; sizes: string }> = {
  "wellness-space-with-city-view": {
    layer: "absolute bottom-0 left-0 h-[140%] w-full motion-on:w-[126%]! motion-on:-left-[13%]!",
    sizes: "(min-width: 1024px) 74vw, 149vw",
  },
};

type Featured = { project: Project; cover: ProjectImage };

/**
 * Featured work — static P2 state.
 * Structure P3 will pin: <section> → .stage (min-h-svh, centred) → <ul class="track"> of cards.
 * Until then the track is a native horizontal scroller (scroll-snap, thin olive scrollbar).
 */
export function FeaturedWork({ projects }: { projects: Project[] }) {
  const featured: Featured[] = [];
  for (const project of projects) {
    const cover = getCover(project);
    if (cover) featured.push({ project, cover });
    if (featured.length === FEATURED_COUNT) break;
  }
  const total = String(featured.length).padStart(2, "0");

  return (
    <>
      <Section tone="sand" flush aria-labelledby="featured-title" className="featured overflow-clip">
        <div className="featured-stage flex flex-col justify-center py-12 md:py-16 lg:min-h-svh lg:pb-4 lg:pt-[calc(var(--header-h)+1rem)]">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <Eyebrow data-reveal>Selected work</Eyebrow>
                <Heading id="featured-title" className="mt-2" data-reveal>
                  Recent projects
                </Heading>
              </div>
              <Button href="/portfolio" variant="ghost" cursor="View" data-reveal>
                All projects
              </Button>
            </div>
          </Container>

          <a href={`#${AFTER_ID}`} className="skip-link">
            Skip featured work
          </a>

          <ul className={cn(styles.track, "track mt-6 md:mt-8")} role="list" data-lenis-prevent>
            {featured.map(({ project, cover }, i) => (
              <li key={project.slug} className={cn(styles.card, "card")} data-reveal>
                <Link
                  href={`/portfolio/${project.slug}` as Route}
                  className="group block rounded-xs"
                  data-cursor="View"
                >
                  <figure>
                    <div className="card-frame relative aspect-[4/5] overflow-clip bg-taupe/40">
                      <SmartImage
                        image={cover}
                        sizes={ARTEFACT_CROP[project.slug]?.sizes ?? "(min-width: 1024px) 42vw, 85vw"}
                        // Motion tiers: 13% of slack each side against a max parallax travel of
                        // 10% of the frame width, so an edge can never be exposed. Static/reduced: exact fit.
                        className={
                          ARTEFACT_CROP[project.slug]?.layer ?? "h-full w-full motion-on:w-[126%]! motion-on:-ml-[13%]"
                        }
                        imgClassName="transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
                        objectPosition={CROP[project.slug]}
                        placeholderTodo={`${project.title} cover — pending image pipeline`}
                      />
                    </div>
                    <figcaption className="mt-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {project.category && <Eyebrow>{project.category}</Eyebrow>}
                        <span className="mt-1 block font-display text-h3 text-ink">{project.title}</span>
                      </div>
                      <span
                        className="shrink-0 pt-0.5 font-display text-lead text-olive tabular-nums"
                        aria-hidden="true"
                      >
                        {String(i + 1).padStart(2, "0")}
                        <span className="text-olive">/</span>
                        {total}
                      </span>
                    </figcaption>
                  </figure>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>
      {/* Target for the "Skip featured work" link — sits just after the section. */}
      <span id={AFTER_ID} tabIndex={-1} className="block h-0" />
    </>
  );
}
