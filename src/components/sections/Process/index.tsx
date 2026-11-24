import type { CSSProperties } from "react";
import type { ImageRef } from "@/lib/content.schema";
import { resolveImage } from "@/lib/content";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";
import { ProcessMotionRoot } from "./ProcessMotionRoot";

type Phase = { number: string; title: string; body: string; image: ImageRef; objectPosition: string };

/**
 * DRAFT COPY, awaiting the client's sign-off (OPEN-ITEMS OI-03).
 *
 * The live site documents no process anywhere, so rather than invent a methodology these four
 * phases follow the sequence an interior design project genuinely runs in, and every claim inside
 * them is drawn from words Style My Space Design has already published or from the services the
 * firm lists. Nothing here asserts a duration, a price, a deliverable count or a guarantee: none
 * of that is known. Sources are noted per phase; replace freely once Eve Jean confirms her wording.
 *
 * The photographs illustrate the phase; they do not claim to document it. None of them appears anywhere
 * else on the home page (qa.ts fails a page that shows one photograph twice).
 */
export const PROCESS_PHASES: readonly Phase[] = [
  {
    number: "1",
    title: "Consultation",
    // "We work with you to understand how you use your space and design solutions that make your
    // life easier." (Style My Space Design journal, "Tranquil and Functional Interior Design".)
    // Budgets / styles / timelines: the firm's own description of how it works.
    body: "We start with how you actually use the space. That conversation sets the brief: the way you live or work in the room, the budget you have in mind, the style you are drawn to and the timeline you are working to.",
    image: { slug: "oceanside", mediaId: "6af838_6d3b289efb6f4a62b65ecbe1bf0cf28f" },
    objectPosition: "38% 50%",
  },
  {
    number: "2",
    title: "Concept and space planning",
    // Space planning is one of the firm's listed services. "Every color, texture, and material is
    // selected to evoke calm and balance." (Journal, "Tranquil and Functional Interior Design".)
    // Natural light and a connection to nature: journal, "Elegant Wellness Space Designs".
    body: "Layout comes first: how the room should flow, where the natural light falls, what each area has to do. From there a direction takes shape, with a palette and a set of materials chosen to evoke calm and balance.",
    image: { slug: "modern-interior-design", mediaId: "6af838_0228055ad54f44fdad311044856820a7" },
    objectPosition: "50% 50%",
  },
  {
    number: "3",
    title: "Design development",
    // Interior architecture is a listed service. "Ergonomic chairs, plush seating areas, and
    // textures like soft fabrics and warm wood invite relaxation and productivity" and
    // "Incorporating eco-friendly materials and designs … contributes to a healthier, more serene
    // atmosphere." (Journal.)
    body: "The concept becomes specific. Interior architecture and finishes are resolved, furnishings are chosen for comfort as much as for how they look, and eco-friendly materials are used wherever they serve the room.",
    image: { slug: "oceanside", mediaId: "6af838_507d25f787e84a56a893d6cec6b1ce4d" },
    objectPosition: "72% 50%",
  },
  {
    number: "4",
    title: "Installation and styling",
    // Home staging is a listed service. "Thoughtful touches like aromatherapy, soundscapes, and
    // curated art make a … space more immersive and memorable." (Journal.)
    body: "Everything comes together on site. The room is installed, then styled down to the last considered detail: the curated art and finishing touches that make a space feel resolved rather than assembled.",
    image: { slug: "wellness-space-designs", mediaId: "6af838_6a3ac52f7536496eaa3c50b75be96de1" },
    objectPosition: "60% 20%",
  },
];

/**
 * Sticky stacked cards (Pelizzari "Know How" structure). On motion tiers each card sticks at
 * header height + i × --stack-offset (10px mobile / 14px md+) so earlier cards peek out above the
 * current one, and Process.motion.ts scales the covered cards down as the next one arrives.
 * Reduced motion / no JS: position stays static and the stack is a plain, fully readable list.
 */
export function Process() {
  return (
    <ProcessMotionRoot>
      <Section tone="dark" aria-labelledby="process-title" className="pb-6 md:pb-8 lg:pb-10" data-section="process">
        <Container>
          <Heading id="process-title" className="max-w-[18ch]" data-reveal>
            Guided through every <em>phase</em> of the design process.
          </Heading>
          <p className="lede mt-3 max-w-[40ch] text-sand md:mt-4" data-reveal>
            {SITE.approach}
          </p>

          <ol
            className="mt-7 pb-2 [--stack-offset:10px] md:mt-8 md:[--stack-offset:14px] lg:mt-9"
            role="list"
            data-process-stack
          >
            {PROCESS_PHASES.map((phase, i) => (
              <li
                key={phase.number}
                data-process-card
                className="overflow-clip rounded-xs bg-bone text-ink motion-on:sticky"
                style={
                  {
                    top: "calc(var(--header-h) + 1rem + var(--i) * var(--stack-offset))",
                    marginTop: i === 0 ? undefined : "var(--stack-offset)",
                    "--i": i,
                  } as CSSProperties
                }
              >
                {/* The dim lives on this wrapper, not the card: the bone background stays opaque so covered cards never bleed through. */}
                <div
                  className="grid min-h-[44svh] md:min-h-[26rem] md:grid-cols-12 lg:min-h-[clamp(24rem,56svh,32rem)]"
                  data-process-card-body
                >
                  <div className="flex flex-col justify-between gap-4 p-3 md:col-span-7 md:p-5 lg:p-7" data-reveal>
                    <span className="font-display text-h1 leading-none text-brass italic" aria-hidden>
                      {phase.number}
                    </span>
                    <div>
                      <h3 className="font-display text-h2">
                        <span className="visually-hidden">Phase {phase.number}: </span>
                        {phase.title}
                      </h3>
                      <p className="mt-2 max-w-[50ch] text-olive md:mt-2.5">{phase.body}</p>
                    </div>
                  </div>
                  <div className="relative hidden md:col-span-5 md:block">
                    <SmartImage
                      image={resolveImage(phase.image)}
                      alt=""
                      sizes="(min-width: 768px) 40vw, 1px"
                      className="absolute inset-0"
                      objectPosition={phase.objectPosition}
                    />
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
