import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";

/** STUB (P0). Owner ⑦: magnetic CTA button. */
export function CtaBlock() {
  return (
    <Section tone="sand" aria-labelledby="cta-title">
      <Container className="grid gap-6 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <Eyebrow>Start a project</Eyebrow>
          <Heading id="cta-title" className="mt-2 max-w-[18ch]">
            Let&rsquo;s talk about your space.
          </Heading>
          <p className="measure mt-4">{SITE.approach}</p>
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-4 md:justify-end">
          <Button href="/contact" cursor="Open">
            Get in touch
          </Button>
          <Button href={SITE.phoneHref as never} variant="outline">
            {SITE.phone}
          </Button>
        </div>
      </Container>
    </Section>
  );
}
