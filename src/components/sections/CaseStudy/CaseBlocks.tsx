import type { Project, ProjectImage } from "@/lib/content.schema";
import { cn } from "@/components/ui/cn";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";
import { CaseBlocksMotionRoot } from "./CaseBlocksMotionRoot";
import { focal, getCaseImages, hasBakedArtefact, orientation, type Orientation } from "./images";

/** Frame ratio per orientation. */
const RATIO: Record<Orientation, string> = {
  landscape: "aspect-[3/2]",
  portrait: "aspect-[4/5]",
  square: "aspect-square",
};

/** One frame's placement in a spread (12-col grid from md). */
type Cell = { span: string; sizes: string };

const WIDE: Cell = { span: "md:col-span-7", sizes: "(min-width: 768px) 56vw, 100vw" };
const NARROW: Cell = { span: "md:col-span-5", sizes: "(min-width: 768px) 40vw, 100vw" };
const SOLO: Cell = { span: "md:col-span-8", sizes: "(min-width: 768px) 67vw, 100vw" };

type Spread = { img: ProjectImage; cell: Cell }[];

/**
 * Lays two images out as a facing spread. A landscape takes the wide side and a portrait the narrow
 * one, and the narrow side alternates left and right down the page, so no two spreads share a rhythm.
 * An odd image out gets a wide frame of its own, hung from alternating edges.
 */
function layoutSpread([a, b]: ProjectImage[], index: number): Spread {
  if (!a) return [];
  if (!b) return [{ img: a, cell: index % 2 === 0 ? SOLO : { ...SOLO, span: "md:col-span-8 md:col-start-5" } }];
  // Of a mixed pair, the portrait is the narrow one; of a matched pair, whichever the rhythm calls for.
  const narrowFirst = index % 2 === 0;
  const [narrow, wide] =
    orientation(a) === "portrait" && orientation(b) !== "portrait"
      ? [a, b]
      : orientation(b) === "portrait" && orientation(a) !== "portrait"
        ? [b, a]
        : narrowFirst
          ? [a, b]
          : [b, a];
  const n = { img: narrow, cell: NARROW };
  const w = { img: wide, cell: WIDE };
  return narrowFirst ? [n, w] : [w, n];
}

/** `reserve` keeps a caption's line free under an uncaptioned neighbour, so both frames end level. */
function Frame({ img, cell, reserve }: { img: ProjectImage; cell: Cell; reserve: boolean }) {
  const artefact = hasBakedArtefact(img);
  return (
    <figure className={cn("col-span-12", cell.span)} data-reveal>
      <div className={cn("overflow-clip", artefact ? "aspect-[7/5]" : RATIO[orientation(img)])} data-parallax-frame={artefact ? undefined : ""}>
        {/* The parallax layer is scaled up by CaseBlocks.motion.ts on motion tiers so the scrubbed
            travel can never expose an edge; the static markup is an exact fit. */}
        <SmartImage image={img} sizes={cell.sizes} objectPosition={focal(img)} className="h-full w-full" />
      </div>
      {img.caption ? (
        <figcaption className="mt-1.5 text-small text-olive">{img.caption}</figcaption>
      ) : (
        reserve && (
          <div aria-hidden className="mt-1.5 hidden text-small md:block">
            &nbsp;
          </div>
        )
      )}
    </figure>
  );
}

/**
 * Editorial spreads: the images after the cover, two to a row. A project with a single photograph has
 * none: CaseHero shows that photograph whole, once.
 */
export function CaseBlocks({ project }: { project: Project }) {
  const { blocks } = getCaseImages(project);
  if (!blocks.length) return null;

  const spreads: ProjectImage[][] = [];
  for (let i = 0; i < blocks.length; i += 2) spreads.push(blocks.slice(i, i + 2));

  return (
    <Section flush className="pb-9 md:pb-11 lg:pb-13">
      <CaseBlocksMotionRoot>
        <Container className="flex flex-col gap-4 md:gap-5 lg:gap-7">
          {spreads.map((pair, i) => {
            const spread = layoutSpread(pair, i);
            const reserve = pair.some((img) => img.caption);
            return (
              // The column gap only applies from md: at 390 eleven gaps would be wider than the container.
              <div key={pair[0]!.mediaId} className="grid grid-cols-12 items-end gap-y-4 md:gap-x-3 lg:gap-x-4" data-block>
                {spread.map(({ img, cell }) => (
                  <Frame key={img.mediaId} img={img} cell={cell} reserve={reserve} />
                ))}
              </div>
            );
          })}
        </Container>
      </CaseBlocksMotionRoot>
    </Section>
  );
}
