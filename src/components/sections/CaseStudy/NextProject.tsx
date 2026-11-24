import Link from "next/link";
import type { Route } from "next";
import type { Project } from "@/lib/content.schema";
import { getCover } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";
import { focal } from "./images";

const quietLink =
  "group eyebrow inline-flex min-h-6 items-center rounded-xs text-olive transition-colors duration-(--dur-micro) hover:text-ink";

/** Keeps the arrow bound to the last word so it can never be orphaned on a line of its own. */
function TitleWithArrow({ title }: { title: string }) {
  const words = title.split(" ");
  const last = words.pop() ?? title;
  return (
    <>
      {words.length > 0 && `${words.join(" ")} `}
      <span className="whitespace-nowrap">
        {last}
        <span
          aria-hidden
          className="ml-2 inline-block transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:translate-x-1.5"
        >
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
 * strip here butted straight into the dark footer as one field.
 */
export function NextProject({ next, prev }: { next: Project | null; prev: Project | null }) {
  const nextCover = next ? getCover(next) : null;

  return (
    <Section tone="sand" aria-label="Project navigation" flush className="py-8 md:py-10 lg:py-13">
      <Container>
        {next ? (
          <Link
            href={`/portfolio/${next.slug}` as Route}
            // gap-x only from lg: eleven 32px gaps do not fit a 342px container at 390.
            className="group grid grid-cols-12 items-center gap-y-4 rounded-xs lg:gap-x-4"
          >
            <span className="order-last col-span-12 lg:order-first lg:col-span-6">
              <span className="block text-olive">Next project</span>
              <span className="mt-1 block text-balance font-display text-h1 text-ink transition-colors duration-(--dur-micro) group-hover:text-olive">
                <TitleWithArrow title={next.title} />
              </span>
              {next.category && <span className="eyebrow mt-2 block text-olive">{next.category}</span>}
            </span>
            <span className="col-span-12 overflow-clip lg:col-span-5 lg:col-start-8" aria-hidden>
              <SmartImage
                image={nextCover}
                alt=""
                sizes="(min-width: 1024px) 40vw, 100vw"
                objectPosition={nextCover ? focal(nextCover) : undefined}
                className="aspect-[3/2] w-full"
                imgClassName="transition-transform duration-[1200ms] ease-(--ease-out-expo) group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
              />
            </span>
          </Link>
        ) : (
          <Link href="/portfolio" className="group inline-block w-fit rounded-xs">
            <span className="block text-olive">Portfolio</span>
            <span className="mt-1 block text-balance font-display text-h1 text-ink transition-colors duration-(--dur-micro) group-hover:text-olive">
              <TitleWithArrow title="Back to all projects" />
            </span>
          </Link>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-olive/25 pt-2">
          {prev ? (
            <Link href={`/portfolio/${prev.slug}` as Route} className={quietLink}>
              <span className="link-rule">
                <span className="visually-hidden">Previous project: </span>
                <span aria-hidden>← </span>
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          <Link href="/portfolio" className={quietLink}>
            <span className="link-rule">All projects</span>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
