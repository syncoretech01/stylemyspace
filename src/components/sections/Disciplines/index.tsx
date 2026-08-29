import { DISCIPLINES } from "@/lib/disciplines";
import { resolveImage } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { DisciplinesMotionRoot } from "./DisciplinesMotionRoot";
import { DisciplineRow } from "./DisciplineRow";
import styles from "./Disciplines.module.css";

/**
 * Four disciplines as full-height photographic columns (≥ xl) — hover / focus expands
 * a column, siblings dim, the blurb reveals. Below xl the same markup stacks into rows;
 * everything is visible without JS and, after hydration, each row's blurb becomes an aria-expanded
 * accordion panel (DisciplineRow). Interaction is pure CSS (Disciplines.module.css); the motion module
 * (Disciplines.motion.ts) only adds the staggered entrance on motion tiers.
 */
export function Disciplines() {
  return (
    <Section aria-labelledby="disciplines-title" className="overflow-x-clip">
      <DisciplinesMotionRoot>
        <Container>
          <div className="grid gap-4 md:grid-cols-12 md:items-end">
            <div className="md:col-span-8">
              <Eyebrow data-reveal>Disciplines</Eyebrow>
              <Heading id="disciplines-title" className="mt-2 max-w-[20ch]" data-reveal>
                Residential, hospitality, wellness and commercial interiors.
              </Heading>
            </div>
            <div className="md:col-span-4 md:justify-self-end" data-reveal>
              <Button href="/services" variant="ghost" cursor="Open">
                All services
              </Button>
            </div>
          </div>

          <ul className={`${styles.row} mt-6 -mx-3 md:mt-8 md:-mx-6 xl:mx-0`} role="list" data-theme="dark">
            {DISCIPLINES.map((d, i) => (
              <DisciplineRow key={d.id} discipline={d} image={resolveImage(d.image)} index={i} />
            ))}
          </ul>
        </Container>
      </DisciplinesMotionRoot>
    </Section>
  );
}
