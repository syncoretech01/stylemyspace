import type { ProjectsFile } from "@/lib/content.schema";
import { DISCIPLINES } from "@/lib/disciplines";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";

/** STUB (P0). Owner ⑥. */
export function ServicesIntro() {
  return (
    <Section aria-labelledby="services-title">
      <Container>
        <Eyebrow>Services</Eyebrow>
        <Heading as="h1" id="services-title" size="h1" className="mt-2 max-w-[16ch]">
          Interior design for how you live and work.
        </Heading>
        <p className="measure mt-4 text-lead">{SITE.approach}</p>
      </Container>
    </Section>
  );
}

export function DisciplinesList() {
  return (
    <Section tone="sand" aria-labelledby="disciplines-list-title">
      <Container>
        <Eyebrow>Disciplines</Eyebrow>
        <Heading id="disciplines-list-title" className="mt-2">
          Four kinds of space
        </Heading>
        <ul className="mt-8 grid gap-6 md:grid-cols-2" role="list">
          {DISCIPLINES.map((d) => (
            <li key={d.id} id={d.id} className="scroll-mt-24 border-t border-taupe pt-3">
              <h3 className="font-display text-h3">{d.label}</h3>
              <p className="mt-2">{d.blurb}</p>
              {d.note && <p className="mt-2 text-small text-olive">{d.note}</p>}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function ServiceList() {
  return (
    <Section aria-labelledby="service-list-title">
      <Container>
        <Eyebrow>What we do</Eyebrow>
        <Heading id="service-list-title" className="mt-2">
          Services
        </Heading>
        <ul className="mt-6 divide-y divide-taupe" role="list">
          {SITE.services.map((s, i) => (
            <li key={s} className="flex items-baseline gap-4 py-3">
              <span className="eyebrow text-olive">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-display text-h3">{s}</span>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function Consultations({ items, showPricing }: { items: ProjectsFile["consultations"]; showPricing: boolean }) {
  if (!items.length) return null;
  return (
    <Section tone="dark" aria-labelledby="consultations-title">
      <Container>
        <Eyebrow>Consultations</Eyebrow>
        <Heading id="consultations-title" className="mt-2">
          Book a session
        </Heading>
        <ul className="mt-8 grid gap-4 md:grid-cols-3" role="list">
          {items.map((c) => (
            <li key={c.name} className="border-t border-bone/20 pt-3">
              <h3 className="font-display text-h3">{c.name}</h3>
              <p className="mt-2 text-sand">
                {c.duration}
                {showPricing && c.price ? ` · ${c.price}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
