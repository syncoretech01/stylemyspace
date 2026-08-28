import type { Material } from "@/lib/content.schema";
import { resolveImage } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";

const FALLBACK: Array<Pick<Material, "id" | "label">> = [
  { id: "wood", label: "Wood" },
  { id: "stone", label: "Stone" },
  { id: "textile", label: "Textile" },
  { id: "brass", label: "Brass" },
];

/** STUB (P0). Owner ②: "exploding object" swatch stack with SVG connector lines on scroll. */
export function Materials({ materials }: { materials: Material[] }) {
  const items = materials.length ? materials : FALLBACK.map((f) => ({ ...f, quote: "", quoteSource: "", image: null, objectPosition: "50% 50%" }));
  return (
    <Section aria-labelledby="materials-title">
      <Container>
        <Eyebrow>Materials &amp; palette</Eyebrow>
        <Heading id="materials-title" className="mt-2 max-w-[20ch]">
          Warm wood, honed stone, soft textiles and a note of brass.
        </Heading>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="list">
          {items.map((m) => (
            <li key={m.id}>
              <figure>
                <SmartImage image={resolveImage(m.image)} sizes="(max-width: 640px) 100vw, 25vw" className="aspect-square" objectPosition={m.objectPosition} placeholderTodo={`${m.label} swatch — pending image pipeline`} />
                <figcaption className="mt-2">
                  <span className="font-display text-h3">{m.label}</span>
                  {m.quote && <p className="mt-1 text-small text-olive">“{m.quote}”</p>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
