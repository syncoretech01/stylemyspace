import type { ProjectsFile } from "@/lib/content.schema";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";

/** STUB (P0). Owner ⑥. */
export function AboutIntro() {
  return (
    <Section aria-labelledby="about-title">
      <Container>
        <Eyebrow>About</Eyebrow>
        <Heading as="h1" id="about-title" size="h1" className="mt-2 max-w-[16ch]">
          A woman-owned, New York–based interior design firm.
        </Heading>
        <p className="measure mt-4 text-lead">{SITE.positioning}</p>
      </Container>
    </Section>
  );
}

export function AboutDesigner({ designer }: { designer: ProjectsFile["home"]["meetTheDesigner"] }) {
  return (
    <Section tone="sand" aria-labelledby="designer-title">
      <Container className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-5">
          <SmartImage image={designer.portrait} sizes="(max-width: 768px) 100vw, 40vw" className="aspect-[3/4]" placeholderTodo="portrait of Eve Jean — pending image pipeline" />
        </div>
        <div className="md:col-span-7">
          <Eyebrow>{designer.heading}</Eyebrow>
          <Heading id="designer-title" className="mt-2">
            {designer.role}: {designer.name}
          </Heading>
          {designer.bio.map((p) => (
            <p key={p} className="measure mt-4">
              {p}
            </p>
          ))}
          {designer.pressConfirmed && designer.pressMention && <p className="measure mt-4 text-olive">{designer.pressMention}</p>}
        </div>
      </Container>
    </Section>
  );
}

/** Principles quoted verbatim from the firm's own blog post ("Tranquil and Functional Interior Design"). */
export const PRINCIPLES = [
  { title: "Intentional Design Choices", body: "Every color, texture, and material is selected to evoke calm and balance." },
  { title: "Customized Functionality", body: "We work with you to understand how you use your space and design solutions that make your life easier." },
  { title: "Sustainability Matters", body: "Incorporating eco-friendly materials and designs not only helps the environment but also contributes to a healthier, more serene atmosphere." },
];

export function AboutApproach() {
  return (
    <Section aria-labelledby="approach-title">
      <Container>
        <Eyebrow>Approach</Eyebrow>
        <Heading id="approach-title" className="mt-2">
          How we work
        </Heading>
        <p className="measure mt-4">{SITE.approach}</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3" role="list">
          {PRINCIPLES.map((p) => (
            <li key={p.title} className="border-t border-taupe pt-3">
              <h3 className="font-display text-h3">{p.title}</h3>
              <p className="mt-2 text-olive">{p.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
