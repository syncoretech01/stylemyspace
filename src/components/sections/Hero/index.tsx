import { Fragment } from "react";
import type { ProjectImage } from "@/lib/content.schema";
import { bindDashes } from "@/lib/prose";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { HeroCanvasSlot } from "./HeroCanvasSlot";
import { HeroMotionRoot } from "./HeroMotionRoot";

type Props = {
  /** Live-site h1, verbatim (content.home.headline). */
  headline: string;
  /** Brief positioning sentence (SITE.positioning). */
  lede: string;
  /** content.home.hero: Oceanside "Dining". */
  image: ProjectImage | null;
};

/** Vertical focus of the crop: the cabinetry-to-rug band, with the empty ceiling left to the type. */
const FOCUS = "58% 66%";

/**
 * The headline verbatim, with its closing word and its ampersand in the true italic. The split only
 * adds emphasis: the text content is exactly the string it was given. From md it breaks before the
 * ampersand by rule rather than by measurement, so a late italic can never move a word between lines.
 * The rule is a block-level row, not a <br> hidden on phones: SplitText breaks at a <br> whether or not
 * it is displayed, which cost a first visit on a phone a fourth line.
 */
function Headline({ text }: { text: string }) {
  const words = text.split(" ");
  const amp = words.indexOf("&");
  const rows = amp > 0 ? [words.slice(0, amp), words.slice(amp)] : [words];
  return rows.map((row, r) => (
    <Fragment key={r}>
      {r > 0 && " "}
      <span className="md:block">
        {row.map((word, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            {word === "&" || (r === rows.length - 1 && i === row.length - 1) ? <em>{word}</em> : word}
          </Fragment>
        ))}
      </span>
    </Fragment>
  ));
}

/**
 * Home hero. The type is set on the photograph's own white ceiling, which dissolves upward into the
 * bone page, so nothing is ever laid over the room itself: no scrim, no darkened picture. The lede and
 * calls to action sit in a notch cut from the next (olive) section, on screen at every laptop height.
 *
 * DOM contract (Hero.motion.ts and HeroCanvas depend on it):
 *  - <section data-hero-root data-motion-root> … the motion scope (HeroMotionRoot)
 *  - img[data-lcp]            … the plane texture for <HeroCanvas /> and the LCP element
 *  - <HeroCanvasSlot />       … directly after the image; absolute inset-0 host, full tier only
 *  - h1[data-hero="title"]    … SplitText lines (mask:'lines'), data-reveal
 *  - [data-hero="lede"], [data-hero="ctas"] … data-reveal
 */
export function Hero({ headline, lede, image }: Props) {
  return (
    <HeroMotionRoot
      id="hero"
      aria-labelledby="hero-title"
      data-hero-root=""
      className="relative isolate flex min-h-[calc(100svh-var(--header-h))] flex-col overflow-clip bg-bone text-ink"
    >
      <Container className="relative z-10 pt-2 pb-2 md:pt-4 lg:pt-[clamp(1rem,3.4svh,2.5rem)]">
        <Heading
          as="h1"
          id="hero-title"
          size="hero"
          data-reveal=""
          data-reveal-lcp=""
          data-hero="title"
          className="text-balance md:text-wrap"
        >
          <Headline text={headline} />
        </Heading>
      </Container>

      {/*
        Photograph. From lg it is absolute, starts behind the headline and runs to the fold; its top
        edge is masked so the white ceiling becomes the page. Below lg it is a block in the column.
        -z-10 inside the isolated section keeps the image and the canvas beneath the copy.
      */}
      <div className="relative -z-10 -mt-3 min-h-[27svh] flex-1 [mask-image:linear-gradient(to_bottom,transparent,#000_4.5rem)] lg:absolute lg:inset-x-0 lg:top-[21%] lg:bottom-0 lg:mt-0 lg:[mask-image:linear-gradient(to_bottom,transparent,#000_30%)]">
        <div className="absolute inset-0">
          <SmartImage
            image={image}
            sizes="100vw"
            quality={85}
            lcp
            objectPosition={FOCUS}
            className="h-full w-full"
            placeholderTodo="hero photograph (Oceanside dining)"
          />
          {/*
            WebGL displacement plane over the photograph: full tier only, after the preloader, when
            hardware GL is available. Its host is absolute inset-0 and fades in once the plane is ready.
          */}
          <HeroCanvasSlot />
        </div>
      </div>

      {/* Notch: flush with the fold and the page edge, so it reads as the olive section arriving. */}
      <div
        data-theme="dark"
        className="bg-olive-deep px-3 pt-4 pb-5 text-bone md:px-6 lg:absolute lg:bottom-0 lg:left-0 lg:w-[calc(max(0px,(100%-90rem)/2)+36rem)] lg:pt-5 lg:pr-5 lg:pb-5 lg:pl-[calc(max(0px,(100%-90rem)/2)+5rem)]"
      >
        <p data-reveal="" data-hero="lede" className="lede max-w-[36ch] text-balance text-bone">
          {bindDashes(lede)}
        </p>
        <div data-reveal="" data-hero="ctas" className="mt-3 grid gap-1.5 *:px-1 *:tracking-[0.1em] min-[360px]:grid-cols-2 sm:flex sm:flex-wrap sm:*:px-3.5 sm:*:tracking-[0.16em] md:gap-2">
          <Button href="/portfolio">View the work</Button>
          <Button href="/contact" variant="outline">
            Start a project
          </Button>
        </div>
      </div>
    </HeroMotionRoot>
  );
}
