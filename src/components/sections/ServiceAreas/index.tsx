import Link from "next/link";
import type { Route } from "next";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { ServiceAreasMotionRoot } from "./ServiceAreasMotionRoot";
import styles from "./ServiceAreas.module.css";

/**
 * The four Section 2 regions as a quiet typographic list.
 *
 * Each row points at the contact form itself rather than at `/contact`: the section also runs on
 * `/contact`, where a bare `/contact` link is a tab stop that does nothing. The hash target is the
 * form's own heading, so the row always performs a visible action wherever the section is used.
 *
 * Motion (ServiceAreas.motion.ts) is a staggered reveal only; hover/focus effects are CSS.
 */
const FORM_HREF = "/contact#form-title" as Route;

export function ServiceAreas() {
  return (
    <Section aria-labelledby="areas-title">
      <ServiceAreasMotionRoot>
        <Container className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Eyebrow data-reveal>Service areas</Eyebrow>
            <Heading id="areas-title" className="mt-2" data-reveal>
              Where we work
            </Heading>
            {/* The list below is the statement of the regions; this line adds the studio's own
                location instead of repeating the four names a third time on the page. */}
            <p className="mt-3 max-w-[32ch] text-body text-olive" data-reveal>
              The studio is based in {SITE.address.locality}, New York.
            </p>
          </div>

          <ul className="border-t border-taupe lg:col-span-8" role="list">
            {SITE.serviceAreas.map((area, i) => (
              <li key={area} className="border-b border-taupe" data-reveal>
                <Link
                  href={FORM_HREF}
                  className={`${styles.link} group flex min-h-6 items-baseline gap-3 py-3 md:gap-4 md:py-4`}
                  data-cursor="Open"
                >
                  <span aria-hidden className="eyebrow w-[2.5ch] shrink-0 text-olive">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`${styles.word} font-display text-h2 text-ink`}>{area}</span>
                  <span className={`${styles.hint} eyebrow ml-auto hidden shrink-0 self-center text-olive md:inline`}>
                    Get in touch
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </ServiceAreasMotionRoot>
    </Section>
  );
}
