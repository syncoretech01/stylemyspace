import Link from "next/link";
import type { Route } from "next";
import type { ImageRef, ProjectsFile } from "@/lib/content.schema";
import { resolveImage } from "@/lib/content";
import { DISCIPLINES, type Discipline } from "@/lib/disciplines";
import { SITE } from "@/lib/site";
import { cn } from "@/components/ui/cn";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { ServicesMotionRoot } from "./ServicesMotionRoot";

/** Page statement (the only h1 on /services) with jump links to the four disciplines. */
export function ServicesIntro() {
  return (
    <ServicesMotionRoot>
      <Section aria-labelledby="services-title" className="pb-8 md:pb-10 lg:pt-12 lg:pb-11" data-section="services-intro">
        <Container>
          <Heading as="h1" id="services-title" size="display" className="max-w-[19ch]" data-reveal data-reveal-lcp>
            Interior design for how you <em>live and&nbsp;work.</em>
          </Heading>
          <div className="mt-5 grid gap-4 lg:mt-6 lg:grid-cols-12 lg:items-end lg:gap-4">
            <p className="lede max-w-[38ch] lg:col-span-6">{SITE.approach}</p>
            <nav aria-label="Disciplines on this page" className="lg:col-span-6 lg:justify-self-end">
              <ul className="flex flex-wrap gap-x-4 gap-y-1" role="list">
                {DISCIPLINES.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/services#${d.id}` as Route}
                      className="group inline-flex min-h-6 items-center rounded-xs eyebrow text-olive transition-colors duration-(--dur-micro) hover:text-ink"
                    >
                      <span className="link-rule">{d.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </Container>
      </Section>
    </ServicesMotionRoot>
  );
}

/** The home page's island view needs its lower half under a scrim; here the photograph stands alone. */
const DISCIPLINE_IMAGE: Partial<Record<Discipline["id"], ImageRef>> = {
  residential: { slug: "oceanside", mediaId: "6af838_e7e9d4a26a6745589d27f6645ed7a590" },
};

/** Crops inside the 5:4 frame. */
const DISCIPLINE_CROP: Partial<Record<Discipline["id"], string>> = {
  residential: "64% 50%",
  hospitality: "66% 50%",
  wellness: "50% 40%",
  commercial: "50% 60%",
};

/**
 * The four disciplines as two staggered pairs; ids are the anchor targets used site-wide. The photograph
 * sits flat on the sand with its words directly beneath, so the copy never leaves its picture.
 */
export function DisciplinesList() {
  return (
    <ServicesMotionRoot>
      <Section tone="sand" aria-labelledby="disciplines-list-title" data-section="disciplines-list">
        <Container>
          <h2 id="disciplines-list-title" className="visually-hidden">
            Disciplines
          </h2>
          <ul className="grid gap-x-4 gap-y-9 md:grid-cols-2 lg:gap-x-9 lg:gap-y-13" role="list">
            {DISCIPLINES.map((d, i) => (
              <li
                key={d.id}
                id={d.id}
                className={cn(
                  "scroll-mt-[calc(var(--header-h)+2rem)]",
                  // The right column is stepped down once; the pairs below inherit the offset.
                  i % 2 === 1 && "md:translate-y-8 lg:translate-y-12",
                )}
              >
                <div data-reveal>
                  <SmartImage
                    image={resolveImage(DISCIPLINE_IMAGE[d.id] ?? d.image)}
                    sizes="(min-width: 768px) 46vw, 100vw"
                    className="aspect-[5/4]"
                    objectPosition={DISCIPLINE_CROP[d.id]}
                    placeholderTodo={`${d.label} discipline image`}
                  />
                  <h3 className="mt-3 font-display text-h2">{d.label}</h3>
                  <p className="mt-1.5 max-w-[46ch]">{d.blurb}</p>
                  {d.note && <p className="mt-1.5 max-w-[46ch] text-olive">{d.note}</p>}
                </div>
              </li>
            ))}
          </ul>
          {/* Absorbs the stepped column so the section's own padding is measured from the last picture. */}
          <div aria-hidden className="hidden md:block md:h-8 lg:h-12" />
        </Container>
      </Section>
    </ServicesMotionRoot>
  );
}

/** Oceanside stairwell: a tall frame that can run the height of the list beside it. */
const SERVICE_LIST_IMAGE: ImageRef = { slug: "oceanside", mediaId: "6af838_d5e03023a9ca44af8c62582f3846491a" };

/** The Section 2 service list as a typographic index, beside one tall photograph. */
export function ServiceList() {
  return (
    <ServicesMotionRoot>
      <Section aria-labelledby="service-list-title" data-section="service-list">
        <Container>
          <div className="grid gap-7 lg:grid-cols-12 lg:gap-4">
            <div className="hidden lg:col-span-4 lg:block" data-reveal>
              <SmartImage
                image={resolveImage(SERVICE_LIST_IMAGE)}
                sizes="(min-width: 1024px) 30vw, 1px"
                className="h-full min-h-[30rem]"
                objectPosition="50% 30%"
              />
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Heading id="service-list-title" size="h3" className="text-olive" data-reveal>
                What we do
              </Heading>
              <ul className="mt-3 border-t border-taupe" role="list">
                {SITE.services.map((s) => (
                  <li key={s} className="border-b border-taupe py-2 font-display text-h1 md:py-2.5" data-reveal>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>
    </ServicesMotionRoot>
  );
}

/** The three live "Book Online" offerings, verbatim; price is gated by site.showPricing. */
export function Consultations({ items, showPricing }: { items: ProjectsFile["consultations"]; showPricing: boolean }) {
  if (!items.length) return null;
  return (
    <ServicesMotionRoot>
      <Section tone="dark" aria-labelledby="consultations-title" data-section="consultations">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-4">
            <div className="lg:col-span-4">
              <Heading id="consultations-title" className="max-w-[9ch]" data-reveal>
                Book a <em>consultation.</em>
              </Heading>
              <p className="mt-2.5 max-w-[32ch] text-sand" data-reveal>
                Booked by phone or through the contact form.
              </p>
              <div className="mt-4" data-reveal>
                <Button href="/contact">Request a time</Button>
              </div>
            </div>

            <ul className="border-t border-bone/25 lg:col-span-7 lg:col-start-6" role="list">
              {items.map((c) => (
                <li
                  key={c.name}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-0.5 border-b border-bone/25 py-3 md:py-3.5"
                  data-reveal
                >
                  <h3 className="font-display text-h3">{c.name}</h3>
                  <dl className="contents">
                    {showPricing && c.price && (
                      <div className="text-right">
                        <dt className="visually-hidden">Price</dt>
                        <dd className="font-display text-h3 text-bone tabular-nums">{c.price}</dd>
                      </div>
                    )}
                    <div className="col-span-2">
                      <dt className="visually-hidden">Duration</dt>
                      <dd className="text-small text-sand">{c.duration}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>
    </ServicesMotionRoot>
  );
}
