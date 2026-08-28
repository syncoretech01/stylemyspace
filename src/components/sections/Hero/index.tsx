import type { ProjectImage } from "@/lib/content.schema";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = { headline: string; lede: string; image: ProjectImage | null };

/** STUB (P0). Owner ①: full-bleed hero with the three.js displacement plane, masked line reveal, scroll cue. */
export function Hero({ headline, lede, image }: Props) {
  return (
    <section aria-labelledby="hero-title" className="relative min-h-svh bg-olive-deep text-bone" data-theme="dark">
      <SmartImage
        image={image}
        sizes="100vw"
        quality={85}
        lcp
        className="absolute inset-0"
        placeholderTodo="hero photograph (Oceanside dining) — pending image pipeline"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-olive-deep/80 via-olive-deep/30 to-transparent" />
      <Container className="relative flex min-h-svh flex-col justify-end pb-12 pt-24">
        <Eyebrow>Interior design · New York</Eyebrow>
        <Heading as="h1" id="hero-title" size="display" className="mt-2 max-w-[14ch]">
          {headline}
        </Heading>
        <p className="measure mt-4 text-lead text-sand">{lede}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button href="/portfolio" cursor="View">
            View the work
          </Button>
          <Button href="/contact" variant="outline">
            Start a project
          </Button>
        </div>
      </Container>
    </section>
  );
}
