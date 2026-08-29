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
 * Heading and buttons only: the block carried SITE.approach, which every route it appears on already
 * prints in its own body copy, so the closing plate would restate a sentence the visitor just read.
 * The primary button is wrapped in [data-magnet]: CtaBlock.motion.ts gives it the magnetic pull
 * on the full tier with a fine pointer, and this markup is the final state everywhere else.
 */
export function CtaBlock() {
  return (
    <Section tone="sand" aria-labelledby="cta-title" data-section="cta">
      <CtaBlockMotionRoot>
        <Container>
          <div className="grid gap-6 xl:grid-cols-12 xl:items-end xl:gap-8">
            <div className="xl:col-span-8">
              <Eyebrow data-reveal>Start a project</Eyebrow>
              {/* One break opportunity, so the pair of lines is the same at every width. The global
                  h1-h3 text-wrap:balance does not get there on its own: at 390 Chrome balanced this
                  to "Let's talk" over "about your space." — 161px over 314px in a 342px column. */}
              <Heading id="cta-title" size="h1" className="mt-3 max-w-[14ch]" data-reveal>
                Let&rsquo;s talk&nbsp;about your&nbsp;space.
              </Heading>
            </div>
            <div className="flex flex-wrap items-center gap-3 xl:col-span-4 xl:justify-end xl:pb-1" data-reveal>
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
