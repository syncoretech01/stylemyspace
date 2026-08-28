import Link from "next/link";
import type { Route } from "next";
import { DISCIPLINES } from "@/lib/disciplines";
import { resolveImage } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";

/** STUB (P0). Owner ③: vertical column slider (hover expands), stacked accordion on touch. */
export function Disciplines() {
  return (
    <Section aria-labelledby="disciplines-title">
      <Container>
        <Eyebrow>Disciplines</Eyebrow>
        <Heading id="disciplines-title" className="mt-2">
          Residential, hospitality, wellness and commercial interiors.
        </Heading>
        <ul className="mt-8 grid gap-3 md:grid-cols-4" role="list">
          {DISCIPLINES.map((d) => (
            <li key={d.id}>
              <Link href={`/services#${d.id}` as Route} className="group block rounded-xs" data-cursor="Open">
                <SmartImage image={resolveImage(d.image)} sizes="(max-width: 768px) 100vw, 25vw" className="aspect-[3/4]" placeholderTodo={`${d.label} discipline image — pending image pipeline`} />
                <h3 className="mt-2 font-display text-h3">{d.label}</h3>
                <p className="mt-1 text-small text-olive">{d.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
