import Link from "next/link";
import type { Route } from "next";
import type { Project } from "@/lib/content.schema";
import { getCover } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SmartImage } from "@/components/ui/SmartImage";
import { focal } from "./images";

const arrow =
  "ml-3 inline-block transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:translate-x-2";

/** Keeps the arrow bound to the last word so it can never be orphaned on a line of its own. */
function TitleWithArrow({ title }: { title: string }) {
  const words = title.split(" ");
  const last = words.pop() ?? title;
  return (
    <>
      {words.length > 0 && `${words.join(" ")} `}
      <span className="whitespace-nowrap">
        {last}
        <span aria-hidden className={arrow}>
          →
        </span>
      </span>
    </>
  );
}

/**
 * Case-study footer strip. Adjacency follows portfolio order and is NOT circular (like the live
 * site): the ends fall back to /portfolio.
 *
 * Sand, not olive-deep: the site's pre-footer plate is sand everywhere else (CtaBlock), and a dark
 * strip here butted straight into the dark footer as one 1400px field. The teaser cover is painted
 * at rest — a clipped-away image read as a failed load in the finished layout.
 */
export function NextProject({ next, prev }: { next: Project | null; prev: Project | null }) {
  const nextCover = next ? getCover(next) : null;

  return (
    <Section
      tone="sand"
      aria-label="Project navigation"
      flush
      className="border-t border-taupe py-10 md:py-12 lg:py-16"
    >
      <Container>
        {next ? (
          <Link
            href={`/portfolio/${next.slug}` as Route}
            // gap-x only from lg: eleven 32px gaps do not fit a 342px container at 390.
            className="group grid grid-cols-12 items-center gap-y-6 rounded-xs lg:gap-x-4"
            data-cursor="Open"
          >
            <span className="col-span-12 lg:col-span-9 xl:col-span-8">
              <Eyebrow data-reveal>Next project</Eyebrow>
              <span
                className="mt-3 block text-balance font-display text-h2 text-ink transition-colors duration-(--dur-micro) group-hover:text-olive"
                data-reveal
              >
                <TitleWithArrow title={next.title} />
              </span>
              {next.category && <span className="mt-3 block text-small text-olive">{next.category}</span>}
            </span>
            <span className="col-span-12 border border-taupe lg:col-span-3 lg:col-start-10" aria-hidden>
              <SmartImage
                image={nextCover}
                alt=""
                sizes="(max-width: 1023px) 100vw, 33vw"
                objectPosition={nextCover ? focal(nextCover) : undefined}
                className="aspect-[3/2] w-full opacity-90 transition-opacity duration-(--dur-short) ease-(--ease-out-expo) group-hover:opacity-100 group-focus-visible:opacity-100 lg:aspect-[4/5]"
              />
            </span>
          </Link>
        ) : (
          <Link href="/portfolio" className="group inline-block w-fit rounded-xs" data-cursor="View">
            <Eyebrow data-reveal>Portfolio</Eyebrow>
            <span
              className="mt-3 block text-balance font-display text-h2 text-ink transition-colors duration-(--dur-micro) group-hover:text-olive"
              data-reveal
            >
              <TitleWithArrow title="Back to all projects" />
            </span>
          </Link>
        )}

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-t border-taupe pt-4 lg:mt-12">
          {prev ? (
            <Link href={`/portfolio/${prev.slug}` as Route} className="group block rounded-xs">
              <span className="eyebrow block text-olive">
                Previous <span className="visually-hidden">project</span>
              </span>
              <span className="mt-2 block font-display text-h3 text-ink transition-colors duration-(--dur-micro) group-hover:text-olive">
                <span aria-hidden className="mr-2 inline-block transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:-translate-x-2">
                  ←
                </span>
                {prev.title}
              </span>
            </Link>
          ) : (
            <Link href="/portfolio" className="eyebrow inline-flex min-h-6 items-center gap-1 rounded-xs text-olive underline-offset-6 transition-colors duration-(--dur-micro) hover:underline">
              <span aria-hidden>←</span> All projects
            </Link>
          )}
          {prev && (
            <Link href="/portfolio" className="eyebrow inline-flex min-h-6 items-center gap-1 rounded-xs text-olive underline-offset-6 transition-colors duration-(--dur-micro) hover:underline">
              All projects
            </Link>
          )}
        </div>
      </Container>
    </Section>
  );
}
