import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";

/** STUB (P0). Owner ③: typographic list with a hover reveal per region. */
export function ServiceAreas() {
  return (
    <Section aria-labelledby="areas-title">
      <Container>
        <Eyebrow>Service areas</Eyebrow>
        <Heading id="areas-title" className="mt-2">
          Where we work
        </Heading>
        <ul className="mt-6 grid gap-2 md:grid-cols-2" role="list">
          {SITE.serviceAreas.map((area) => (
            <li key={area} className="border-b border-taupe py-3 font-display text-h3">
              {area}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
