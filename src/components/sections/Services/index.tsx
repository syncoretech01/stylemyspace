import Link from "next/link";
import type { Route } from "next";
import type { ProjectsFile } from "@/lib/content.schema";
import { resolveImage } from "@/lib/content";
import { DISCIPLINES, type Discipline } from "@/lib/disciplines";
import { SITE } from "@/lib/site";
import { cn } from "@/components/ui/cn";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";

const pad = (n: number) => String(n).padStart(2, "0");

/** Page statement (the only h1 on /services) with jump links to the four disciplines. */
export function ServicesIntro() {
  return (
    <Section aria-labelledby="services-title" className="lg:pt-32" data-section="services-intro">
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-10">
            <Eyebrow data-reveal>Services</Eyebrow>
            <Heading as="h1" id="services-title" size="display" className="mt-3 max-w-[13ch]" data-reveal>
              Interior design for how you live and&nbsp;work.
            </Heading>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <p className="measure text-lead" data-reveal>
              {SITE.approach}
            </p>
            <nav aria-label="Disciplines on this page" className="mt-6" data-reveal>
              <ul className="flex flex-wrap gap-x-4 gap-y-2" role="list">
                {DISCIPLINES.map((d, i) => (
                  <li key={d.id}>
                    <Link
                      href={`/services#${d.id}` as Route}
                      className="inline-flex min-h-6 items-center gap-1 rounded-xs eyebrow text-olive underline-offset-6 transition-colors duration-(--dur-micro) hover:text-ink hover:underline"
                    >
                      <span className="text-brass tabular-nums" aria-hidden>
                        {pad(i + 1)}
                      </span>
                      {d.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/** Crops for the square collection PNGs inside a 3/2 frame; the photographs are already 3/2. */
const DISCIPLINE_CROP: Partial<Record<Discipline["id"], string>> = {
  wellness: "50% 45%",
  commercial: "50% 55%",
};

/** The four disciplines as alternating two-column rows; ids are the anchor targets used site-wide. */
export function DisciplinesList() {
  const total = pad(DISCIPLINES.length);
  return (
    <Section tone="sand" aria-labelledby="disciplines-list-title" data-section="disciplines-list">
      <Container>
        <Eyebrow data-reveal>Disciplines</Eyebrow>
        <Heading id="disciplines-list-title" className="mt-3 max-w-[16ch]" data-reveal>
          Residential, hospitality, wellness and commercial interiors.
        </Heading>

        <ol className="mt-10 divide-y divide-taupe border-t border-taupe md:mt-14" role="list">
          {DISCIPLINES.map((d, i) => {
            const flip = i % 2 === 1;
            return (
              <li
                key={d.id}
                id={d.id}
                className="grid scroll-mt-[calc(var(--header-h)+1rem)] gap-4 py-6 md:grid-cols-12 md:items-center md:gap-8 md:py-10"
                data-reveal
              >
                <div className={cn("md:col-span-5", flip && "md:order-2 md:col-start-8")}>
                  <SmartImage
                    image={resolveImage(d.image)}
                    sizes="(min-width: 768px) 42vw, 100vw"
                    className="aspect-[3/2]"
                    objectPosition={DISCIPLINE_CROP[d.id]}
                    placeholderTodo={`${d.label} discipline image — pending image pipeline`}
                  />
                </div>
                <div className={cn("md:col-span-6", flip ? "md:order-1 md:col-start-1" : "md:col-start-7")}>
                  <span className="eyebrow block text-olive tabular-nums" aria-hidden>
                    <span className="text-brass">{pad(i + 1)}</span> / {total}
                  </span>
                  <h3 className="mt-3 font-display text-h2">{d.label}</h3>
                  <p className="measure mt-3 text-lead">{d.blurb}</p>
                  {d.note && <p className="mt-3 max-w-[48ch] text-small text-olive">{d.note}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}

/** The Section 2 service list as a numbered typographic index. */
export function ServiceList() {
  return (
    <Section aria-labelledby="service-list-title" data-section="service-list">
      <Container>
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Eyebrow data-reveal>What we do</Eyebrow>
            <Heading id="service-list-title" className="mt-3" data-reveal>
              Services
            </Heading>
          </div>
          <ol className="border-t border-taupe lg:col-span-8" role="list">
            {SITE.services.map((s, i) => (
              <li key={s} className="grid grid-cols-12 items-baseline gap-2 border-b border-taupe py-3 md:py-4" data-reveal>
                <span className="col-span-2 font-display text-h3 leading-none text-brass tabular-nums md:col-span-1" aria-hidden>
                  {pad(i + 1)}
                </span>
                <span className="col-span-10 font-display text-h1 md:col-span-11">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}

/** The three live "Book Online" offerings, verbatim; price is gated by site.showPricing. */
export function Consultations({ items, showPricing }: { items: ProjectsFile["consultations"]; showPricing: boolean }) {
  if (!items.length) return null;
  return (
    <Section tone="dark" aria-labelledby="consultations-title" data-section="consultations">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Eyebrow data-reveal>Consultations</Eyebrow>
            <Heading id="consultations-title" className="mt-3 max-w-[12ch]" data-reveal>
              Book a consultation.
            </Heading>
            <p className="mt-4 max-w-[36ch] text-sand" data-reveal>
              Booked by phone or through the contact form.
            </p>
            <div className="mt-6" data-reveal>
              <Button href="/contact" cursor="Open">
                Get in touch
              </Button>
            </div>
          </div>

          <ol className="border-t border-bone/25 lg:col-span-7" role="list">
            {items.map((c, i) => (
              <li
                key={c.name}
                className="grid grid-cols-12 items-baseline gap-2 border-b border-bone/25 py-4 md:gap-4 md:py-5"
                data-reveal
              >
                <span className="col-span-2 eyebrow text-sand tabular-nums md:col-span-1" aria-hidden>
                  {pad(i + 1)}
                </span>
                <h3 className="col-span-10 font-display text-h3 md:col-span-6">{c.name}</h3>
                <dl className="col-span-10 col-start-3 flex flex-wrap gap-x-4 gap-y-1 text-sand md:col-span-5 md:col-start-8 md:justify-end md:text-right">
                  <div>
                    <dt className="visually-hidden">Duration</dt>
                    <dd>{c.duration}</dd>
                  </div>
                  {showPricing && c.price && (
                    <div>
                      <dt className="visually-hidden">Price</dt>
                      <dd className="font-display text-h3 leading-none text-bone tabular-nums">{c.price}</dd>
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
