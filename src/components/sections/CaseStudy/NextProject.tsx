import Link from "next/link";
import type { Route } from "next";
import type { Project } from "@/lib/content.schema";
import { getCover } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SmartImage } from "@/components/ui/SmartImage";
import { focal } from "./images";

const smallLink =
  "eyebrow inline-flex min-h-6 items-center gap-1 rounded-xs text-bone underline-offset-6 transition-colors duration-(--dur-micro) hover:text-sand hover:underline";

/**
 * Case-study footer strip. Adjacency follows portfolio order and is NOT circular (like the live
 * site): the ends fall back to /portfolio. The next cover reveals on hover/focus (static on mobile).
 */
export function NextProject({ next, prev }: { next: Project | null; prev: Project | null }) {
  const nextCover = next ? getCover(next) : null;

  return (
    <Section tone="dark" aria-label="Project navigation" flush className="py-10 md:py-12 lg:py-16">
      <Container>
        {next ? (
          <Link
            href={`/portfolio/${next.slug}` as Route}
            className="group grid grid-cols-12 items-center gap-x-4 gap-y-6 rounded-xs"
            data-cursor="Open"
          >
            <span className="col-span-12 lg:col-span-8">
              <Eyebrow data-reveal>Next project</Eyebrow>
              <span className="mt-3 block font-display text-h2 text-bone transition-colors duration-(--dur-micro) group-hover:text-sand" data-reveal>
                {next.title}
                <span aria-hidden className="ml-3 inline-block transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:translate-x-2">
                  →
                </span>
              </span>
              {next.category && <span className="mt-3 block text-small text-sand">{next.category}</span>}
            </span>
            <span className="col-span-12 border border-bone/15 lg:col-span-3 lg:col-start-10" aria-hidden>
              <SmartImage
                image={nextCover}
                alt=""
                sizes="(max-width: 1023px) 100vw, 33vw"
                objectPosition={nextCover ? focal(nextCover) : undefined}
                className="aspect-[4/5] w-full transition-[clip-path] duration-(--dur-short) ease-(--ease-out-expo) lg:[clip-path:inset(0_0_100%_0)] lg:group-hover:[clip-path:inset(0)] lg:group-focus-visible:[clip-path:inset(0)]"
              />
            </span>
          </Link>
        ) : (
          <Link href="/portfolio" className="group block rounded-xs" data-cursor="View">
            <Eyebrow data-reveal>Portfolio</Eyebrow>
            <span className="mt-3 block font-display text-h2 text-bone transition-colors duration-(--dur-micro) group-hover:text-sand" data-reveal>
              Back to all projects
              <span aria-hidden className="ml-3 inline-block transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:translate-x-2">
                →
              </span>
            </span>
          </Link>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-bone/20 pt-4 lg:mt-12">
          {prev ? (
            <Link href={`/portfolio/${prev.slug}` as Route} className={smallLink}>
              <span aria-hidden>←</span> Previous <span className="visually-hidden">project:</span>
              <span className="normal-case tracking-normal">{prev.title}</span>
            </Link>
          ) : (
            <Link href="/portfolio" className={smallLink}>
              <span aria-hidden>←</span> All projects
            </Link>
          )}
          {prev && next && (
            <Link href="/portfolio" className={smallLink}>
              All projects
            </Link>
          )}
        </div>
      </Container>
    </Section>
  );
}
