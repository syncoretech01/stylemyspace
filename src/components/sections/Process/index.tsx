import type { CSSProperties } from "react";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { ProcessMotionRoot } from "./ProcessMotionRoot";

/**
 * DRAFT COPY — awaiting the client's sign-off (OPEN-ITEMS OI-03).
 *
 * The live site documents no process anywhere, so rather than invent a methodology these four
 * phases follow the sequence an interior design project genuinely runs in, and every claim inside
 * them is drawn from words Style My Space Design has already published or from the services the
 * firm lists. Nothing here asserts a duration, a price, a deliverable count or a guarantee — none
 * of that is known. Sources are noted per phase; replace freely once Eve Jean confirms her wording.
 */
export const PROCESS_PHASES = [
  {
    number: "01",
    title: "Consultation",
    // "We work with you to understand how you use your space and design solutions that make your
    // life easier." — Style My Space Design journal, "Tranquil and Functional Interior Design".
    // Budgets / styles / timelines: the firm's own description of how it works.
    body: "We start with how you actually use the space. That conversation sets the brief — the way you live or work in the room, the budget you have in mind, the style you are drawn to and the timeline you are working to.",
  },
  {
    number: "02",
    title: "Concept and space planning",
    // Space planning is one of the firm's listed services. "Every color, texture, and material is
    // selected to evoke calm and balance." — journal, "Tranquil and Functional Interior Design".
    // Natural light and a connection to nature: journal, "Elegant Wellness Space Designs".
    body: "Layout comes first: how the room should flow, where the natural light falls, what each area has to do. From there a direction takes shape — a palette and a set of materials chosen to evoke calm and balance.",
  },
  {
    number: "03",
    title: "Design development",
    // Interior architecture is a listed service. "Ergonomic chairs, plush seating areas, and
    // textures like soft fabrics and warm wood invite relaxation and productivity" and
    // "Incorporating eco-friendly materials and designs … contributes to a healthier, more serene
    // atmosphere." — journal.
    body: "The concept becomes specific. Interior architecture and finishes are resolved, furnishings are chosen for comfort as much as for how they look, and eco-friendly materials are used wherever they serve the room.",
  },
  {
    number: "04",
    title: "Installation and styling",
    // Home staging is a listed service. "Thoughtful touches like aromatherapy, soundscapes, and
    // curated art make a … space more immersive and memorable." — journal.
    body: "Everything comes together on site. The room is installed and then styled down to the last considered detail — the curated art and the finishing touches that make a space feel resolved rather than assembled.",
  },
] as const;

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
      <Section tone="dark" aria-labelledby="process-title" className="pb-6 md:pb-8 lg:pb-12" data-section="process">
        <Container>
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-4 xl:gap-6">
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
            className="mt-10 pb-4 [--stack-offset:10px] md:mt-14 md:pb-6 md:[--stack-offset:14px] lg:mt-16 lg:pb-8"
            role="list"
            data-process-stack
          >
            {PROCESS_PHASES.map((phase, i) => (
              <li
                key={phase.number}
                data-process-card
                className="flex min-h-[44svh] flex-col rounded-xs border border-taupe bg-bone p-3 text-ink motion-on:sticky md:min-h-[52svh] md:p-6 lg:p-8"
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

                  <div className="grid flex-1 content-center gap-3 pt-4 md:grid-cols-12 md:gap-4 md:pt-6 lg:gap-6" data-reveal>
                    <span
                      className="font-display text-display leading-none text-brass tabular-nums md:col-span-4 lg:col-span-3"
                      aria-hidden
                    >
                      {phase.number}
                    </span>
                    <div className="md:col-span-8 lg:col-span-7">
                      <h3 className="font-display text-h2">
                        <span className="visually-hidden">Phase {phase.number}: </span>
                        {phase.title}
                      </h3>
                      <p className="measure mt-3 text-lead text-olive">
                        {phase.body}
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
