import type { CSSProperties } from "react";
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

const STACK_OFFSET_PX = 14;

/**
 * Sticky stacked cards (Pelizzari "Know How" structure). Pure CSS: each card sticks at
 * header height + i×14px so the earlier cards peek out above the current one. P3 adds the
 * scale-down of covered cards; without it the stack is a plain, fully readable list.
 */
export function Process() {
  const total = String(PROCESS_PHASES.length).padStart(2, "0");
  return (
    <Section tone="dark" aria-labelledby="process-title" data-section="process">
      <Container>
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">
            <Eyebrow data-reveal>Process</Eyebrow>
            <Heading id="process-title" className="mt-2 max-w-[18ch]" data-reveal>
              Guided through every phase of the design process.
            </Heading>
          </div>
          <p className="measure text-lead text-sand lg:col-span-5 lg:self-end" data-reveal>
            {SITE.approach}
          </p>
        </div>

        <ol className="mt-10 pb-[14vh] md:mt-14 lg:mt-16" role="list" data-process-stack>
          {PROCESS_PHASES.map((phase, i) => (
            <li
              key={phase.number}
              data-process-card
              data-reveal
              className="sticky flex min-h-[48svh] flex-col rounded-xs border border-taupe bg-bone p-3 text-ink md:min-h-[60svh] md:p-6 lg:p-8"
              style={
                {
                  top: `calc(var(--header-h) + ${i * STACK_OFFSET_PX}px)`,
                  marginTop: i === 0 ? undefined : `${STACK_OFFSET_PX}px`,
                  "--i": i,
                } as CSSProperties
              }
            >
              <div className="flex items-baseline justify-between gap-2 border-b border-brass pb-2">
                <span className="eyebrow text-olive">Phase</span>
                <span className="eyebrow text-olive tabular-nums" aria-hidden>
                  {phase.number} / {total}
                </span>
              </div>

              <div className="grid flex-1 gap-3 pt-4 md:grid-cols-12 md:gap-6 md:pt-6">
                <span
                  className="font-display text-display leading-none text-brass tabular-nums md:col-span-4 lg:col-span-3"
                  aria-hidden
                >
                  {phase.number}
                </span>
                <div className="md:col-span-8 lg:col-span-7">
                  <h3 className="font-display text-h2">
                    <span className="visually-hidden">Phase {phase.number}: </span>
                    <Todo>{phase.title}</Todo>
                  </h3>
                  <p className="measure mt-3 text-lead text-olive">
                    <Todo>{phase.body}</Todo>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
