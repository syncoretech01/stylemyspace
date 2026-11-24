import { SITE } from "@/lib/site";
import { getContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { ContactForm as ContactFormFields } from "./ContactForm";
import { ContactMotionRoot } from "./ContactMotionRoot";

const link =
  "inline-flex min-h-[2.75rem] items-center rounded-xs text-body decoration-1 underline-offset-6 transition-colors duration-(--dur-micro) hover:underline focus-visible:underline [overflow-wrap:anywhere]";

/**
 * The page statement (the only h1 on /contact) beside the form itself, so the first field is on the
 * first screen. The statement used to fill the fold alone, with the form two scrolls below it.
 */
export function ContactMain() {
  return (
    <Section aria-labelledby="contact-title" className="lg:pt-12" data-section="contact-form">
      <ContactMotionRoot>
        <Container>
          <div className="grid gap-7 lg:grid-cols-12 lg:gap-4">
            <div className="lg:col-span-5">
              <Heading as="h1" id="contact-title" size="display" className="max-w-[8ch]" data-reveal data-reveal-lcp>
                Tell us about <em>your&nbsp;space.</em>
              </Heading>
              {/* On phones this paragraph can outmeasure the h1 as the LCP element, so it rises but never fades. */}
              <p className="lede mt-4 max-w-[32ch]" data-reveal data-reveal-lcp>
                {SITE.approach}
              </p>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-1.5">
              <Heading id="form-title" size="h3" className="mb-4 text-olive" data-reveal>
                Start with a&nbsp;few details
              </Heading>
              <ContactFormFields />
            </div>
          </div>
        </Container>
      </ContactMotionRoot>
    </Section>
  );
}

/** NAP + direct lines + socials + regions (Pelizzari-style NAP block). Facts from site.ts and the live footer. */
export function ContactDetails() {
  const { site } = getContent();
  const socials = [SITE.social.instagram, SITE.social.facebook, SITE.social.linkedin];
  return (
    <Section tone="sand" aria-labelledby="details-title" className="md:pt-10 md:pb-10 lg:pt-12 lg:pb-13" data-section="contact-details">
      <ContactMotionRoot>
        <Container>
          <Heading id="details-title" data-reveal>
            The <em>studio</em>
          </Heading>
          <div className="mt-4 grid gap-x-4 gap-y-5 border-t border-olive/25 pt-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0" data-reveal>
              <Eyebrow>Address</Eyebrow>
              <address className="mt-1.5 leading-relaxed not-italic">
                {SITE.address.street}
                <br />
                {SITE.address.locality}, {SITE.address.region} {SITE.address.postalCode}
              </address>
            </div>

            <div className="min-w-0" data-reveal>
              <Eyebrow>Reach us</Eyebrow>
              <ul className="mt-0.5" role="list">
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

            <div className="min-w-0" data-reveal>
              <Eyebrow>Follow</Eyebrow>
              <ul className="mt-0.5" role="list">
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

            <div className="min-w-0" data-reveal>
              <Eyebrow>Where we work</Eyebrow>
              <ul className="mt-1.5 leading-relaxed" role="list">
                {SITE.serviceAreas.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </ContactMotionRoot>
    </Section>
  );
}
