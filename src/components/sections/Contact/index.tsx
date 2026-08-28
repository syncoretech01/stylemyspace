import { SITE } from "@/lib/site";
import { getContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { ContactForm as ContactFormFields } from "./ContactForm";

/** "a, b, c and d" — prose join for Section 2 lists. */
function proseList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1] ?? ""}`;
}

const link =
  "inline-flex min-h-[2.75rem] items-center rounded-xs text-body decoration-1 underline-offset-6 transition-colors duration-(--dur-micro) hover:underline focus-visible:underline";

/** Page statement — the only h1 on /contact. Copy is Section 2 facts from src/lib/site.ts. */
export function ContactIntro() {
  return (
    <Section aria-labelledby="contact-title" className="pb-8 md:pb-10 lg:pt-32 lg:pb-12" data-section="contact-intro">
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-10">
            <Eyebrow data-reveal>Contact</Eyebrow>
            <Heading as="h1" id="contact-title" size="display" className="mt-3 max-w-[12ch]" data-reveal>
              Tell us about your&nbsp;space.
            </Heading>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <p className="measure text-lead" data-reveal>
              {SITE.approach}
            </p>
            <p className="measure mt-4 text-olive" data-reveal>
              {`Serving the ${proseList(SITE.serviceAreas)}.`}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/** The form, beside a short aside with the direct lines. */
export function ContactForm() {
  return (
    <Section flush aria-labelledby="form-title" className="pb-12 md:pb-16 lg:pb-24" data-section="contact-form">
      <Container>
        <div className="grid gap-8 border-t border-taupe pt-8 lg:grid-cols-12 lg:gap-8 lg:pt-10">
          <div className="lg:col-span-4">
            <Eyebrow data-reveal>Send a message</Eyebrow>
            <Heading id="form-title" size="h3" className="mt-2 max-w-[16ch]" data-reveal>
              Start with a few details.
            </Heading>
            <p className="mt-3 text-body text-olive" data-reveal>
              Prefer to talk?
            </p>
            <ul className="mt-1" role="list" data-reveal>
              <li>
                <a href={SITE.phoneHref} className={`${link} text-ink`}>
                  {SITE.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className={`${link} text-ink`}>
                  {SITE.email}
                </a>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <ContactFormFields />
          </div>
        </div>
      </Container>
    </Section>
  );
}

/** NAP + direct lines + socials (Pelizzari-style NAP block). Facts from site.ts and the live footer. */
export function ContactDetails() {
  const { site } = getContent();
  const socials = [SITE.social.instagram, SITE.social.facebook, SITE.social.linkedin];
  return (
    <Section tone="sand" aria-labelledby="details-title" data-section="contact-details">
      <Container className="grid gap-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Eyebrow data-reveal>Studio</Eyebrow>
          <Heading id="details-title" size="h3" className="mt-2 max-w-[14ch]" data-reveal>
            {SITE.address.locality}, {SITE.address.region}
          </Heading>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 lg:col-span-8">
          <div data-reveal>
            <Eyebrow>Address</Eyebrow>
            <address className="mt-2 text-body not-italic leading-relaxed">
              {SITE.address.street}
              <br />
              {SITE.address.locality}, {SITE.address.region} {SITE.address.postalCode}
            </address>
          </div>

          <div data-reveal>
            <Eyebrow>Reach us</Eyebrow>
            <ul className="mt-1" role="list">
              <li>
                <a href={SITE.phoneHref} className={link}>
                  {SITE.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.emailDisplayed}`} className={link}>
                  {site.emailDisplayed}
                </a>
              </li>
            </ul>
          </div>

          <div data-reveal>
            <Eyebrow>Follow</Eyebrow>
            <ul className="mt-1" role="list">
              {socials.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className={link}>
                    {s.label}
                    <span className="visually-hidden"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
