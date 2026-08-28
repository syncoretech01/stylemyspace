import Link from "next/link";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import styles from "./ServiceAreas.module.css";

/** The four Section 2 regions as a quiet typographic list; each row links to /contact. */
export function ServiceAreas() {
  return (
    <Section aria-labelledby="areas-title">
      <Container className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Eyebrow data-reveal>Service areas</Eyebrow>
          <Heading id="areas-title" size="h3" className="mt-2" data-reveal>
            Where we work
          </Heading>
          <p className="mt-3 max-w-[32ch] text-body text-olive" data-reveal>
            Serving the {SITE.serviceAreas[0]}, {SITE.serviceAreas[1]}, {SITE.serviceAreas[2]} and{" "}
            {SITE.serviceAreas[3]}.
          </p>
        </div>

        <ul className="border-t border-taupe lg:col-span-8" role="list">
          {SITE.serviceAreas.map((area, i) => (
            <li key={area} className="border-b border-taupe" data-reveal>
              <Link
                href="/contact"
                className={`${styles.link} group flex min-h-6 items-baseline gap-3 py-3 md:gap-4 md:py-4`}
                data-cursor="Open"
              >
                <span aria-hidden className="eyebrow w-[2.5ch] shrink-0 text-brass">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`${styles.word} font-display text-h2 text-ink`}>{area}</span>
                <span className="visually-hidden md:hidden">— get in touch</span>
                <span className={`${styles.hint} eyebrow ml-auto hidden shrink-0 self-center text-olive md:inline`}>
                  Get in touch
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
