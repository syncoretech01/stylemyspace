import type { Route } from "next";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { CtaBlockMotionRoot } from "./CtaBlockMotionRoot";

/**
 * End-of-page "let's talk" block (GKC structure), rendered before the footer on every page.
 * The primary button is wrapped in [data-magnet]: CtaBlock.motion.ts gives it the magnetic pull
 * on the full tier with a fine pointer, and this markup is the final state everywhere else.
 */
export function CtaBlock() {
  return (
    <Section tone="sand" aria-labelledby="cta-title" data-section="cta">
      <CtaBlockMotionRoot>
        <Container>
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
            <div className="lg:col-span-8">
              <Eyebrow data-reveal>Start a project</Eyebrow>
              <Heading id="cta-title" size="h1" className="mt-3 max-w-[14ch]" data-reveal>
                Let&rsquo;s talk about your&nbsp;space.
              </Heading>
              <p className="measure mt-4 text-lead text-olive lg:mt-6" data-reveal>
                {SITE.approach}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:col-span-4 lg:justify-end lg:pb-1" data-reveal>
              <span data-magnet className="inline-block">
                <Button href="/contact" cursor="Open">
                  Get in touch
                </Button>
              </span>
              <Button href={SITE.phoneHref as Route} variant="outline" aria-label={`Call ${SITE.phone}`}>
                {SITE.phone}
              </Button>
            </div>
          </div>
        </Container>
      </CtaBlockMotionRoot>
    </Section>
  );
}
