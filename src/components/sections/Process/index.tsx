import type { CSSProperties } from "react";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Todo } from "@/components/ui/Todo";
import { ProcessMotionRoot } from "./ProcessMotionRoot";

/**
 * The live site does not document its process phases anywhere, so the phases are literal
 * {{TODO}} placeholders (logged in OPEN-ITEMS.md). Only the brief's approach sentence is real copy.
 */
export const PROCESS_PHASES = [1, 2, 3, 4].map((n) => ({
  number: String(n).padStart(2, "0"),
  title: `process phase ${n} name`,
  body: `process phase ${n} description`,
}));

/**
 * Sticky stacked cards (Pelizzari "Know How" structure). On motion tiers each card sticks at
 * header height + i × --stack-offset (10px mobile / 14px md+) so earlier cards peek out above the
 * current one, and Process.motion.ts scales the covered cards down as the next one arrives.
 * Reduced motion / no JS: position stays static and the stack is a plain, fully readable list.
 */
export function Process() {
  const total = String(PROCESS_PHASES.length).padStart(2, "0");
  return (
    <ProcessMotionRoot>
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

          <ol
            className="mt-10 pb-[14vh] [--stack-offset:10px] md:mt-14 md:[--stack-offset:14px] lg:mt-16"
            role="list"
            data-process-stack
          >
            {PROCESS_PHASES.map((phase, i) => (
              <li
                key={phase.number}
                data-process-card
                className="flex min-h-[48svh] flex-col rounded-xs border border-taupe bg-bone p-3 text-ink motion-on:sticky md:min-h-[60svh] md:p-6 lg:p-8"
                style={
                  {
                    top: "calc(var(--header-h) + var(--i) * var(--stack-offset))",
                    marginTop: i === 0 ? undefined : "var(--stack-offset)",
                    "--i": i,
                  } as CSSProperties
                }
              >
                {/* The dim lives on this wrapper, not the card: the bone background stays opaque so covered cards never bleed through. */}
                <div className="flex flex-1 flex-col" data-process-card-body>
                  <div className="flex items-baseline justify-between gap-2 border-b border-brass pb-2" data-reveal>
                    <span className="eyebrow text-olive">Phase</span>
                    <span className="eyebrow text-olive tabular-nums" aria-hidden>
                      {phase.number} / {total}
                    </span>
                  </div>

                  <div className="grid flex-1 gap-3 pt-4 md:grid-cols-12 md:gap-6 md:pt-6" data-reveal>
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
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>
    </ProcessMotionRoot>
  );
}
