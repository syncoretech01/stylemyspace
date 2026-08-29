import type { Project, ProjectImage } from "@/lib/content.schema";
import { cn } from "@/components/ui/cn";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";
import { CaseBlocksMotionRoot } from "./CaseBlocksMotionRoot";
import { focal, getCaseImages, orientation, pad2 } from "./images";

/** Column span + frame ratio per orientation (12-col grid at lg). */
const FRAME = {
  landscape: { span: "lg:col-span-8", ratio: "aspect-[3/2]", sizes: "(max-width: 1023px) 100vw, 67vw" },
  portrait: { span: "lg:col-span-5", ratio: "aspect-[4/5]", sizes: "(max-width: 1023px) 100vw, 45vw" },
  square: { span: "lg:col-span-6", ratio: "aspect-square", sizes: "(max-width: 1023px) 100vw, 50vw" },
} as const;

function Block({ img, index, total, title }: { img: ProjectImage; index: number; total: number; title: string }) {
  const frame = FRAME[orientation(img)];
  const imageLeft = index % 2 === 0;
  return (
    <div className="grid grid-cols-12 gap-x-4 gap-y-3">
      <figure className={cn("col-span-12", frame.span, imageLeft ? "lg:col-start-1" : "lg:col-end-13")} data-reveal>
        <SmartImage image={img} sizes={frame.sizes} objectPosition={focal(img)} className={cn("w-full", frame.ratio)} />
        {img.caption && <figcaption className="mt-2 text-small text-olive">{img.caption}</figcaption>}
      </figure>

      {/* Sticky running title — decorative (the h1 already names the project). */}
      <div
        aria-hidden
        className={cn(
          "sticky top-[calc(var(--header-h)+1rem)] hidden self-start lg:col-span-3 lg:row-start-1 lg:block",
          imageLeft ? "lg:col-start-10" : "lg:col-start-1",
        )}
      >
        <p className="eyebrow text-olive tabular-nums">
          {pad2(index + 1)} <span className="text-taupe">/</span> {pad2(total)}
        </p>
        <p className="mt-2 font-display text-h3 text-ink">{title}</p>
      </div>
    </div>
  );
}

/**
 * Editorial alternating image/text blocks. Cover-only projects get the cover again at its full
 * frame (the hero crops the square masters to 16:9).
 */
export function CaseBlocks({ project }: { project: Project }) {
  const { cover, blocks } = getCaseImages(project);

  if (!blocks.length) {
    if (!cover) return null;
    return (
      <Section flush className="pb-12 md:pb-16 lg:pb-24">
        <CaseBlocksMotionRoot>
          <Container>
            <figure className="mx-auto lg:w-8/12" data-reveal>
              <SmartImage
                image={cover}
                alt=""
                sizes="(max-width: 1023px) 100vw, 67vw"
                className={cn("w-full", FRAME[orientation(cover)].ratio)}
              />
              <figcaption className="mt-2 text-small text-olive">Full frame</figcaption>
            </figure>
          </Container>
        </CaseBlocksMotionRoot>
      </Section>
    );
  }

  return (
    <Section flush className="pb-12 md:pb-16 lg:pb-24">
      <CaseBlocksMotionRoot>
        <Container className="flex flex-col gap-10 md:gap-12 lg:gap-16">
          {blocks.map((img, i) => (
            <Block key={img.mediaId} img={img} index={i} total={blocks.length} title={project.title} />
          ))}
        </Container>
      </CaseBlocksMotionRoot>
    </Section>
  );
}
