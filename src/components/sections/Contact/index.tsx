import { SITE } from "@/lib/site";
import { getContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { ContactForm } from "./ContactForm";

export { ContactForm };

/** STUB (P0). Owner ⑦. */
export function ContactIntro() {
  return (
    <Section flush className="pt-12 md:pt-16 lg:pt-24" aria-labelledby="contact-title">
      <Container>
        <Eyebrow>Contact</Eyebrow>
        <Heading as="h1" id="contact-title" size="h1" className="mt-2 max-w-[16ch]">
          Tell us about your space.
        </Heading>
        <p className="measure mt-4 text-lead">{SITE.approach}</p>
      </Container>
    </Section>
  );
}

export function ContactDetails() {
  const { site } = getContent();
  const socials = [SITE.social.instagram, SITE.social.facebook, SITE.social.linkedin];
  return (
    <Section tone="sand" aria-labelledby="details-title">
      <Container className="grid gap-8 md:grid-cols-3">
        <div>
          <Eyebrow>Studio</Eyebrow>
          <h2 id="details-title" className="visually-hidden">
            Studio details
          </h2>
          <address className="mt-2 not-italic leading-relaxed">
            {SITE.address.street}
            <br />
            {SITE.address.locality}, {SITE.address.region} {SITE.address.postalCode}
          </address>
        </div>
        <div>
          <Eyebrow>Reach us</Eyebrow>
          <p className="mt-2 leading-relaxed">
            <a href={SITE.phoneHref} className="underline-offset-4 hover:underline">
              {SITE.phone}
            </a>
            <br />
            <a href={`mailto:${site.emailDisplayed}`} className="underline-offset-4 hover:underline">
              {site.emailDisplayed}
            </a>
          </p>
        </div>
        <div>
          <Eyebrow>Follow</Eyebrow>
          <ul className="mt-2 space-y-1">
            {socials.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
