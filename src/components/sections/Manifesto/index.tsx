import type { ProjectImage } from "@/lib/content.schema";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SmartImage } from "@/components/ui/SmartImage";

/** Statement assembled from the brief's Section 2 positioning and approach (no new claims). */
export const MANIFESTO =
  "We design spaces that balance elegance with ease, and sophistication with warmth — across a range of budgets, styles and timelines, guiding you through every phase.";

/** STUB (P0). Owner ②: pinned scroll-storytelling, word-by-word reveal, background scale 1→1.08. */
export function Manifesto({ image }: { image: ProjectImage | null }) {
  return (
    <section id="manifesto" aria-labelledby="manifesto-title" className="relative bg-olive-deep text-bone" data-theme="dark">
      <SmartImage image={image} sizes="100vw" className="absolute inset-0 opacity-40" alt="" placeholderTodo="manifesto background (Oceanside kitchen) — pending image pipeline" />
      <Container className="relative py-24 md:py-32">
        <h2 id="manifesto-title" className="visually-hidden">
          Our approach
        </h2>
        <Eyebrow>Manifesto</Eyebrow>
        <p className="mt-4 max-w-[22ch] font-display text-h1">{MANIFESTO}</p>
      </Container>
    </section>
  );
}
