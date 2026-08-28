import Link from "next/link";
import type { Route } from "next";
import { DISCIPLINES } from "@/lib/disciplines";
import { resolveImage } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import styles from "./Disciplines.module.css";

/**
 * Four disciplines as full-height photographic columns (≥ lg) — hover / focus expands a column,
 * siblings dim, the blurb reveals. Below lg the same markup stacks into rows with everything visible.
 * Interaction is pure CSS (see Disciplines.module.css); nothing here depends on JS.
 */
export function Disciplines() {
  return (
    <Section aria-labelledby="disciplines-title" className="overflow-x-clip">
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

        <ul className={`${styles.row} mt-6 -mx-3 md:mt-8 md:-mx-6 lg:mx-0`} role="list" data-theme="dark">
          {DISCIPLINES.map((d, i) => {
            const image = resolveImage(d.image);
            const labelId = `discipline-${d.id}-label`;
            const index = String(i + 1).padStart(2, "0");
            return (
              <li key={d.id} className={styles.col} data-reveal>
                <Link
                  href={`/services#${d.id}` as Route}
                  className={styles.link}
                  aria-labelledby={labelId}
                  data-cursor="Open"
                >
                  <SmartImage
                    image={image}
                    sizes="(min-width: 64rem) 50vw, 100vw"
                    className={styles.media}
                    placeholderTodo={`${d.label} discipline image — pending image pipeline`}
                  />
                  <div aria-hidden className={styles.scrim} />

                  <div className={`${styles.content} p-3 lg:p-4`}>
                    <div className={styles.label}>
                      <span aria-hidden className="eyebrow text-brass">
                        {index}
                      </span>
                      <h3 id={labelId} className="font-display text-h2 text-bone">
                        {d.label}
                      </h3>
                    </div>
                    <div className={`${styles.blurb} mt-2 lg:mt-0`}>
                      <p className="text-body text-bone">{d.blurb}</p>
                      {d.note ? <p className="mt-1 text-small text-sand">{d.note}</p> : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
