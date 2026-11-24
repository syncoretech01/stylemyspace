import Link from "next/link";
import type { Route } from "next";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { ServiceAreasMotionRoot } from "./ServiceAreasMotionRoot";
import styles from "./ServiceAreas.module.css";

/**
 * The four Section 2 regions as a quiet typographic list. Rows point at the contact form's own heading.
 * (The section no longer runs on /contact, where those rows could only have linked to the page you were
 * already on; ContactDetails states the regions there instead.)
 *
 * Motion (ServiceAreas.motion.ts) is a staggered reveal only; hover/focus effects are CSS.
 */
const FORM_HREF = "/contact#form-title" as Route;

export function ServiceAreas() {
  return (
    <Section aria-labelledby="areas-title">
      <ServiceAreasMotionRoot>
        <Container className="grid gap-5 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Heading id="areas-title" data-reveal>
              Where we <em>work</em>
            </Heading>
            {/* The list is the statement of the regions; this line adds the studio's own location
                instead of repeating the four names. */}
            <p className="mt-2 max-w-[32ch] text-olive" data-reveal>
              The studio is based in {SITE.address.locality}, New York.
            </p>
          </div>

          <ul className="border-t border-taupe lg:col-span-8" role="list">
            {SITE.serviceAreas.map((area) => (
              <li key={area} className="border-b border-taupe" data-reveal>
                <Link
                  href={FORM_HREF}
                  className={`${styles.link} group flex min-h-6 items-baseline gap-3 rounded-xs py-2 md:py-2.5`}
                >
                  <span className={`${styles.word} font-display text-h2 text-ink`}>{area}</span>
                  <span className={`${styles.hint} eyebrow ml-auto hidden shrink-0 self-center text-olive md:inline`}>
                    Start a project
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
