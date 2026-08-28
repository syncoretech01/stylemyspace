import type { ProjectImage } from "@/lib/content.schema";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { ScrollCue } from "./ScrollCue";

type Props = {
  /** Live-site h1, verbatim (content.home.headline). */
  headline: string;
  /** Brief positioning sentence (SITE.positioning). */
  lede: string;
  /** content.home.hero — Oceanside "Dining". */
  image: ProjectImage | null;
};

/**
 * Home hero. Full-bleed photograph, text anchored bottom-left, scroll cue bottom-right.
 *
 * DOM contract for P3 (do not restructure):
 *  - <section data-hero-root> … the motion scope
 *  - img[data-lcp]            … the plane texture for <HeroCanvas /> and the LCP element
 *  - h1[data-hero="title"]    … SplitText lines (mask:'lines'), data-reveal
 *  - [data-hero="lede"], [data-hero="ctas"] … data-reveal
 *  - a[data-hero="cue"]       … fades after the first 50 px of scroll
 *
 * The photograph is bright (white stone, white cabinetry), so the scrim is a pair of gradients
 * anchored where the type sits — bottom and (from lg) left — leaving the olive wall, brass
 * pendants and velvet chairs on the right untouched.
 */
export function Hero({ headline, lede, image }: Props) {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      data-hero-root=""
      data-theme="dark"
      className="relative isolate overflow-clip bg-olive-deep text-bone"
    >
      {/* ---- Photograph ------------------------------------------------ */}
      <div aria-hidden={image ? undefined : true} className="absolute inset-x-0 top-0 -z-10 h-[62svh] lg:inset-0 lg:h-auto">
        {/*
          P3 SLOT — <HeroCanvas /> mounts here, ABOVE the image (it lifts img[data-lcp] onto a
          displacement plane on the "full" tier only). Do not import it before P3.
        */}
        <SmartImage
          image={image}
          sizes="100vw"
          quality={85}
          lcp
          objectPosition="62% 55%"
          className="h-full w-full"
          placeholderTodo="hero photograph (Oceanside dining) — pending image pipeline"
        />
        {/*
          Scrim. Below lg the photograph is a top band that dissolves into the olive-deep ground
          the type sits on; from lg it is full-bleed and the vertical fade only weights the floor.
        */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-olive-deep from-0% via-olive-deep/90 via-30% to-transparent to-64% lg:via-olive-deep/50 lg:via-28% lg:to-transparent lg:to-68%"
        />
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-linear-to-r from-olive-deep/95 from-0% via-olive-deep/88 via-55% to-transparent to-92% lg:block"
        />
      </div>

      {/* ---- Composition ----------------------------------------------- */}
      <Container className="relative flex min-h-[calc(100svh-var(--header-h))] flex-col justify-end pt-[46svh] pb-5 md:pb-6 lg:pt-20 lg:pb-8">
        <div className="grid grid-cols-12 items-end gap-x-3 gap-y-4">
          <div className="col-span-12 lg:col-span-9 xl:col-span-8">
            <Eyebrow data-reveal="" data-hero="eyebrow" className="text-bone">
              Interior design · New York
            </Eyebrow>
            <Heading
              as="h1"
              id="hero-title"
              size="display"
              data-reveal=""
              data-hero="title"
              className="mt-3 max-w-[14ch] text-bone"
            >
              {headline}
            </Heading>
            <p data-reveal="" data-hero="lede" className="mt-4 max-w-[46ch] text-lead text-sand md:mt-5">
              {lede}
            </p>
            <div data-reveal="" data-hero="ctas" className="mt-5 flex flex-wrap gap-2 md:mt-6">
              <Button href="/portfolio" cursor="View">
                View the work
              </Button>
              <Button href="/contact" variant="outline" cursor="Open">
                Start a project
              </Button>
            </div>
          </div>

          {/* Scroll cue: desktop counterweight to the bottom-left type. Hidden below lg. */}
          <div className="hidden lg:col-span-3 lg:flex lg:justify-end xl:col-span-4">
            <ScrollCue className="-mr-2 -mb-2 pr-2 pb-2" />
          </div>
        </div>
      </Container>
    </section>
  );
}
