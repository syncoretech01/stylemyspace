import type { Route } from "next";
import { resolveImage } from "@/lib/content";
import type { ImageRef } from "@/lib/content.schema";
import { SITE } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { CtaBlockMotionRoot } from "./CtaBlockMotionRoot";

/** Modern Interior Design: two armchairs drawn up to each other. Used nowhere else the block appears. */
const IMAGE: ImageRef = { slug: "modern-interior-design", mediaId: "6af838_ba2abbe26a564beba851b82a87e0bf8d" };

/**
 * End-of-page block (GKC structure), rendered before the footer on most pages: the invitation on the
 * left, a photograph bleeding off the right edge. Heading and buttons only: SITE.approach is already
 * printed in the body copy of every route this appears on.
 * The primary button is wrapped in [data-magnet]: CtaBlock.motion.ts gives it the magnetic pull
 * on the full tier with a fine pointer, and this markup is the final state everywhere else.
 */
export function CtaBlock() {
  return (
    <Section tone="sand" flush aria-labelledby="cta-title" data-section="cta" className="overflow-x-clip">
      <CtaBlockMotionRoot className="grid lg:min-h-[clamp(30rem,72svh,44rem)] lg:grid-cols-2">
        <div className="relative order-first aspect-[3/2] overflow-clip lg:order-last lg:aspect-auto">
          {/* A shade taller than its frame, so the stray blue reflection on the photograph's bottom edge
              stays out of every crop, including the portrait frames where the full height shows. */}
          <SmartImage
            image={resolveImage(IMAGE)}
            alt=""
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="absolute inset-x-0 top-0 h-[104%]"
            objectPosition="50% 45%"
          />
        </div>
        <div className="flex flex-col justify-center px-3 py-8 md:px-6 md:py-10 lg:pr-6 lg:pl-[calc(max(0px,(100vw-90rem)/2)+5rem)]">
          <Heading id="cta-title" size="h1" className="max-w-[13ch]" data-reveal>
            Let&rsquo;s talk about <em>your&nbsp;space.</em>
          </Heading>
          <div className="mt-4 flex flex-wrap items-center gap-1.5 md:gap-2 lg:mt-5" data-reveal>
            <span data-magnet className="inline-block">
              <Button href="/contact">Start a project</Button>
            </span>
            <Button href={SITE.phoneHref as Route} variant="outline" aria-label={`Call ${SITE.phone}`}>
              {SITE.phone}
            </Button>
          </div>
        </div>
      </CtaBlockMotionRoot>
    </Section>
  );
}
