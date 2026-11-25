import { DISCIPLINES } from "@/lib/disciplines";
import { resolveImage } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { DisciplinesMotionRoot } from "./DisciplinesMotionRoot";
import { DisciplineRow } from "./DisciplineRow";
import styles from "./Disciplines.module.css";

/**
 * Four disciplines as photographic columns: one stands open with its blurb, and hovering or focusing
 * another opens that one instead. Below 80rem, and on any touch screen, the same markup stacks into
 * rows with an aria-expanded accordion (DisciplineRow). Interaction is pure CSS
 * (Disciplines.module.css); Disciplines.motion.ts only adds the staggered entrance on motion tiers.
 */
export function Disciplines() {
  return (
    <Section aria-labelledby="disciplines-title" className="overflow-x-clip">
      <DisciplinesMotionRoot>
        <Container>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
            <Heading id="disciplines-title" className="max-w-[23ch]" data-reveal>
              Residential, hospitality, wellness and <em>commercial</em> interiors.
            </Heading>
            <div className="md:pb-1" data-reveal>
              <Button href="/services" variant="ghost">
                All services
              </Button>
            </div>
          </div>

          <ul className={`${styles.row} mt-5 -mx-3 md:mt-7 md:mx-0`} role="list" data-theme="dark">
            {DISCIPLINES.map((d) => (
              <DisciplineRow key={d.id} discipline={d} image={resolveImage(d.image)} />
            ))}
          </ul>
        </Container>
      </DisciplinesMotionRoot>
    </Section>
  );
}
