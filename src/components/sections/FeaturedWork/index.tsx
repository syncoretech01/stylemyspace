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
import { FeaturedWorkMotionRoot } from "./FeaturedWorkMotionRoot";
import styles from "./FeaturedWork.module.css";

const FEATURED_COUNT = 5;
const AFTER_ID = "after-featured-work";

/**
 * Per-cover crop hints for the 4:5 frame (landscape covers lose their sides).
 * Oceanside "Living Room 4": the sofa and its stone table sit right of centre.
 */
const CROP: Record<string, string> = {
  oceanside: "62% 50%",
};

/**
 * Covers whose master carries the Wix scroll-cue disc burned into its top band.
 *
 * The frame is portrait and the master is square, so `object-position` cannot reach the artefact:
 * a square source in a 4:5 box is cropped on the x axis only. Instead the image layer is made taller
 * than the frame and pinned to its bottom edge, so the frame window shows the bottom 1/1.4 of the
 * photograph and the disc (17%–25% of the square's height) never enters it. `sizes` states the
 * layer's real rendered width, which is 1.4x the frame, so the srcset stays sharp.
 * Remove once a retouched master ships (see the asset request in OPEN-ITEMS).
 */
const ARTEFACT_CROP: Record<string, { layer: string; sizes: string }> = {
  "wellness-space-with-city-view": {
    layer: "absolute bottom-0 left-0 h-[140%] w-full motion-full:w-[126%]! motion-full:-left-[13%]!",
    sizes: "(min-width: 1024px) 74vw, 149vw",
  },
};

type Featured = { project: Project; cover: ProjectImage };

/**
 * Featured work. On the full motion tier FeaturedWork.motion.ts pins .featured-stage and translates
 * .track with the scroll, so every card crosses the viewport; the root's height (the pin distance) is
 * reserved by that module. On touch it is a native scroll-snap list, and under reduced motion a grid
 * (FeaturedWork.module.css), so no project is ever parked off-screen.
 */
export function FeaturedWork({ projects }: { projects: Project[] }) {
  const featured: Featured[] = [];
  for (const project of projects) {
    const cover = getCover(project);
    if (cover) featured.push({ project, cover });
    if (featured.length === FEATURED_COUNT) break;
  }

  return (
    <>
      <Section tone="sand" flush aria-labelledby="featured-title" className="featured overflow-clip">
        <FeaturedWorkMotionRoot>
          <div className="featured-stage flex flex-col justify-center py-10 md:py-12 lg:min-h-svh lg:pb-4 lg:pt-[calc(var(--header-h)+1rem)]">
            <Container>
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <Heading id="featured-title" data-reveal>
                  Recent <em>projects</em>
                </Heading>
                <div className="pb-1" data-reveal>
                  <Button href="/portfolio" variant="ghost">
                    All projects
                  </Button>
                </div>
              </div>
            </Container>

            <a href={`#${AFTER_ID}`} className="skip-link">
              Skip featured work
            </a>

            <ul className={cn(styles.track, "track mt-4 md:mt-5")} role="list" data-lenis-prevent-horizontal>
              {featured.map(({ project, cover }) => (
                <li key={project.slug} className={cn(styles.card, "card")} data-reveal>
                  <Link href={`/portfolio/${project.slug}` as Route} className="group block rounded-xs">
                    <figure>
                      <div className="card-frame relative aspect-[4/5] overflow-clip bg-taupe/40" data-cursor="View">
                        <SmartImage
                          image={cover}
                          sizes={ARTEFACT_CROP[project.slug]?.sizes ?? "(min-width: 1024px) 42vw, 85vw"}
                          // Full tier: 13% of slack each side against a max parallax travel of 10% of the
                          // frame width, so an edge can never be exposed. Everywhere else: exact fit.
                          className={
                            ARTEFACT_CROP[project.slug]?.layer ?? "h-full w-full motion-full:w-[126%]! motion-full:-ml-[13%]"
                          }
                          imgClassName="transition-transform duration-[1200ms] ease-(--ease-out-expo) group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
                          objectPosition={CROP[project.slug]}
                          placeholderTodo={`${project.title} cover`}
                        />
                      </div>
                      <figcaption className="mt-2">
                        <span className="block font-display text-h3 text-ink transition-colors duration-(--dur-micro) group-hover:text-olive">
                          {project.title}
                        </span>
                        {project.category && <Eyebrow className="mt-0.5">{project.category}</Eyebrow>}
                      </figcaption>
                    </figure>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </FeaturedWorkMotionRoot>
      </Section>
      {/* Target for the "Skip featured work" link: sits just after the section. */}
      <span id={AFTER_ID} tabIndex={-1} className="block h-0" />
    </>
  );
}
