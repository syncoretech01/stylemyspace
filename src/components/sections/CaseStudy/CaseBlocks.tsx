import type { Project, ProjectImage } from "@/lib/content.schema";
import { cn } from "@/components/ui/cn";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";
import { CaseBlocksMotionRoot } from "./CaseBlocksMotionRoot";
import { focal, getCaseImages, orientation, pad2 } from "./images";

/**
 * Column span + frame ratio per orientation (12-col grid at lg).
 * The column gap only applies from lg, where the grid actually places things side by side: at 390
 * the container is 342px and eleven 32px gaps alone would be 352px, so every track would collapse
 * to zero and each col-span-12 child would overhang the container by 10px.
 */
const FRAME = {
  landscape: { span: "lg:col-span-8", ratio: "aspect-[3/2]", sizes: "(max-width: 1023px) 100vw, 67vw" },
  portrait: { span: "lg:col-span-5", ratio: "aspect-[4/5]", sizes: "(max-width: 1023px) 100vw, 45vw" },
  square: { span: "lg:col-span-6", ratio: "aspect-square", sizes: "(max-width: 1023px) 100vw, 50vw" },
} as const;

/** A lone block has no alternating partner: it takes a wider frame and hangs from the left edge. */
const SOLO = { span: "lg:col-span-8 lg:col-start-1", sizes: "(max-width: 1023px) 100vw, 67vw" } as const;

function Block({ img, index, total }: { img: ProjectImage; index: number; total: number }) {
  const frame = FRAME[orientation(img)];
  const imageLeft = index % 2 === 0;
  const solo = total === 1;
  // The counter is the block's own label; with a single block it could only ever read "01 / 01".
  const counter = total > 1 ? `${pad2(index + 1)} / ${pad2(total)}` : null;

  return (
    <div className="grid grid-cols-12 gap-y-3 lg:gap-x-4" data-block>
      <figure
        className={cn(
          "col-span-12",
          solo ? SOLO.span : cn(frame.span, imageLeft ? "lg:col-start-1" : "lg:col-end-13"),
        )}
        data-reveal
      >
        <div className={cn("overflow-clip", frame.ratio)} data-parallax-frame>
          {/* The parallax layer is scaled up by CaseBlocks.motion.ts on motion tiers so the scrubbed
              travel can never expose an edge; the static markup is an exact fit. */}
          <SmartImage
            image={img}
            sizes={solo ? SOLO.sizes : frame.sizes}
            objectPosition={focal(img)}
            className="h-full w-full"
          />
        </div>
        {/* Caption line at every width (the counter used to live in an lg-only sticky rail that also
            repeated the h1 verbatim on every block and left its column empty below the first line). */}
        {(counter || img.caption) && (
          <figcaption className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-small text-olive">
            {counter && (
              <span className="eyebrow tabular-nums" aria-hidden>
                {counter}
              </span>
            )}
            {img.caption && <span>{img.caption}</span>}
          </figcaption>
        )}
      </figure>
    </div>
  );
}

/**
 * Editorial alternating image/text blocks. Cover-only projects get the cover again at its full
 * frame — the hero crops the square masters to 16:9, so this is the only place the whole photograph
 * is shown. It hangs from the container's left edge like everything else on the page.
 */
export function CaseBlocks({ project }: { project: Project }) {
  const { cover, blocks } = getCaseImages(project);

  if (!blocks.length) {
    if (!cover) return null;
    return (
      <Section flush className="pb-10 md:pb-12 lg:pb-16">
        <CaseBlocksMotionRoot>
          <Container>
            <figure className="w-full lg:max-w-[53rem]" data-reveal>
              <SmartImage
                image={cover}
                alt=""
                sizes="(max-width: 1023px) 100vw, 848px"
                className={cn("w-full", FRAME[orientation(cover)].ratio)}
              />
            </figure>
          </Container>
        </CaseBlocksMotionRoot>
      </Section>
    );
  }

  return (
    <Section flush className="pb-10 md:pb-12 lg:pb-16">
      <CaseBlocksMotionRoot>
        <Container className="flex flex-col gap-10 md:gap-12 lg:gap-16">
          {blocks.map((img, i) => (
            <Block key={img.mediaId} img={img} index={i} total={blocks.length} />
          ))}
        </Container>
      </CaseBlocksMotionRoot>
    </Section>
  );
}
