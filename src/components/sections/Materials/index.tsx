import type { Material } from "@/lib/content.schema";
import { getProject, resolveImage } from "@/lib/content";
import { cn } from "@/components/ui/cn";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { CroppedImage, type Crop } from "@/components/ui/CroppedImage";
import { MaterialsMotionRoot } from "./MaterialsMotionRoot";

/**
 * Intro line: verbatim from the firm's blog post "Tranquil and Functional Interior Design:
 * Creating Spaces That Soothe and Serve" (content/projects.json → blog[0].body).
 */
const INTRO_QUOTE =
  "Thoughtfully chosen elements such as soft lighting, neutral palettes, natural textures, and comfortable furnishings can transform a room into a haven.";
const INTRO_SOURCE = "Tranquil and Functional Interior Design";

const WHOLE: Crop = [0.5, 0.5, 1];

/** Rendered swatch width, in vw: two columns of the 7-column stage from lg, half the page below it. */
const FRAME = [
  [1024, 26],
  [0, 48],
] as const;

/**
 * "Materials": four tight square details cut from the project photography, two by two, the right-hand
 * column stepped down. Heading and source quote hold still beside them. This markup is the end state;
 * Materials.motion.ts adds the assembled start (the swatches stacked at the stage centre) and scrubs
 * them out to these positions.
 */
export function Materials({ materials }: { materials: Material[] }) {
  const items = materials.slice(0, 4);
  if (!items.length) return null;

  return (
    <Section id="materials" aria-labelledby="materials-title">
      <MaterialsMotionRoot>
        <Container>
          <div className="grid gap-7 lg:grid-cols-12 lg:gap-4">
            <div className="lg:col-span-5 lg:pr-4">
              <div className="lg:sticky lg:top-[calc(var(--header-h)+4rem)]">
                <Heading id="materials-title" className="max-w-[12ch]" data-reveal>
                  Warm wood, stone, soft textiles and a <em>note of brass.</em>
                </Heading>
                <blockquote className="mt-4 max-w-[38ch] lg:mt-5" data-reveal>
                  <p>“{INTRO_QUOTE}”</p>
                  <footer className="mt-1.5 text-small text-olive">
                    From the Style My Space Design journal, <cite>{INTRO_SOURCE}</cite>
                  </footer>
                </blockquote>
              </div>
            </div>

            <div
              className="relative grid grid-cols-2 gap-x-2 gap-y-5 md:gap-x-4 md:gap-y-6 lg:col-span-7 lg:gap-x-5 lg:gap-y-7 lg:pb-8"
              data-materials-stage
            >
              {items.map((m, i) => {
                const image = resolveImage(m.image);
                const credit = m.image ? getProject(m.image.slug)?.title : null;
                return (
                  <figure
                    key={m.id}
                    className={cn("relative", i % 2 === 1 && "lg:top-8")}
                    data-reveal
                    data-materials-swatch={m.id}
                  >
                    <CroppedImage image={image} crop={m.crop ?? WHOLE} frame={FRAME} alt={m.alt} />
                    <figcaption className="mt-2">
                      <span className="block font-display text-h3 text-ink">{m.label}</span>
                      {m.quote && <p className="mt-0.5 text-small text-olive text-pretty">“{m.quote}”</p>}
                      {credit && <span className="mt-1 block text-small text-olive">From {credit}</span>}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </Container>
      </MaterialsMotionRoot>
    </Section>
  );
}
