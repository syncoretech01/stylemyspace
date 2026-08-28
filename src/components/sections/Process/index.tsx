import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Todo } from "@/components/ui/Todo";

/**
 * The live site does not document its process phases anywhere, so the phases are literal
 * {{TODO}} placeholders (logged in OPEN-ITEMS.md). Only the brief's approach sentence is real copy.
 */
export const PROCESS_PHASES = [1, 2, 3, 4].map((n) => ({
  number: String(n).padStart(2, "0"),
  title: `process phase ${n} name`,
  body: `process phase ${n} description`,
}));

/** STUB (P0). Owner ⑥: sticky stacked cards that scale as the next card arrives. */
export function Process() {
  return (
    <Section tone="dark" aria-labelledby="process-title">
      <Container>
        <Eyebrow>Process</Eyebrow>
        <Heading id="process-title" className="mt-2 max-w-[20ch]">
          Guided through every phase of the design process.
        </Heading>
        <p className="measure mt-4 text-sand">{SITE.approach}</p>
        <ol className="mt-8 grid gap-3 md:grid-cols-2">
          {PROCESS_PHASES.map((phase) => (
            <li key={phase.number} className="rounded-xs border border-bone/20 p-4">
              <span className="eyebrow text-sand">{phase.number}</span>
              <h3 className="mt-2 font-display text-h3">
                <Todo>{phase.title}</Todo>
              </h3>
              <p className="mt-2 text-sand">
                <Todo>{phase.body}</Todo>
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
