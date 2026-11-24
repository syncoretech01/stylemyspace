import type { Project } from "@/lib/content.schema";
import { cn } from "@/components/ui/cn";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";
import { CaseHeroMotionRoot } from "./CaseHeroMotionRoot";
import { focal, getCaseImages, hasBakedArtefact } from "./images";

type Props = { project: Project };

/**
 * Case-study opener: the cover (the Flip target for the portfolio → case transition), then the title (h1)
 * with its category, beside the live-site description verbatim.
 *
 * No meta rail: the two rows it used to carry (an asset tally and a "Source" link back to the legacy
 * Wix page) are build provenance, not visitor copy. Both facts stay in content/projects.json for the
 * team; project.categoryNote likewise is internal and is reported in OPEN-ITEMS.md.
 */
export function CaseHero({ project }: Props) {
  return getCaseImages(project).blocks.length ? <FullBleedHero project={project} /> : <SinglePhotoHero project={project} />;
}

/** Projects with more photographs to come: the cover crops full-bleed across the page. */
function FullBleedHero({ project }: Props) {
  const { cover } = getCaseImages(project);
  const artefact = !!cover && hasBakedArtefact(cover);

  return (
    <CaseHeroMotionRoot aria-labelledby="case-title" className="bg-bone">
      <div className="relative">
        <SmartImage
          image={cover}
          sizes="100vw"
          quality={85}
          lcp
          objectPosition={cover ? focal(cover) : undefined}
          className={cn(
            "w-full md:aspect-[16/9] lg:aspect-auto lg:h-[clamp(26rem,68svh,54rem)]",
            artefact ? "aspect-[7/5]" : "aspect-[4/5]",
          )}
          placeholderTodo={`${project.title} cover image`}
          imgProps={{ "data-flip-target": project.slug }}
        />
      </div>

      <Container className="py-7 md:py-9 lg:py-11">
        <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
          <div className="lg:col-span-6">
            <Title project={project} size="display" className="max-w-[11ch]" />
          </div>
          <p className="lede max-w-[40ch] lg:col-span-6 lg:col-start-7 lg:pt-1.5" data-reveal>
            {project.description}
          </p>
        </div>
      </Container>
    </CaseHeroMotionRoot>
  );
}

/**
 * Projects with one photograph: it is shown once and as nearly whole as the screen allows. From xl it
 * bleeds off the left edge with the words beside it; below that it runs the full width above them. (A
 * full-bleed crop followed by the uncropped original put the same picture on the page twice.)
 */
function SinglePhotoHero({ project }: Props) {
  const { cover } = getCaseImages(project);
  const artefact = !!cover && hasBakedArtefact(cover);

  return (
    <CaseHeroMotionRoot aria-labelledby="case-title" className="grid bg-bone xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
      <SmartImage
        image={cover}
        sizes="(min-width: 1280px) 56vw, 100vw"
        quality={85}
        lcp
        objectPosition={cover ? focal(cover) : undefined}
        className={cn(
          "w-full",
          artefact
            ? "aspect-[7/5] max-h-[70svh] xl:max-h-none xl:self-start"
            : "aspect-square max-h-[70svh] xl:aspect-auto xl:h-[clamp(34rem,calc(100svh-var(--header-h)),56rem)] xl:max-h-none",
        )}
        placeholderTodo={`${project.title} cover image`}
        imgProps={{ "data-flip-target": project.slug }}
      />
      <div className="flex flex-col justify-center px-3 py-7 md:px-6 md:py-9 lg:px-10 xl:py-6 xl:pr-[calc(max(0px,(100vw-90rem)/2)+3rem)] xl:pl-7">
        <Title project={project} size="h1" />
        <p className="lede mt-4 max-w-[36ch] lg:mt-5" data-reveal>
          {project.description}
        </p>
      </div>
    </CaseHeroMotionRoot>
  );
}

function Title({ project, size, className }: Props & { size: "display" | "h1"; className?: string }) {
  return (
    <>
      <Heading as="h1" id="case-title" size={size} className={className} tabIndex={-1} data-reveal data-reveal-lcp>
        {project.title}
      </Heading>
      {project.category && (
        <Eyebrow className="mt-2 lg:mt-3" data-reveal>
          {project.category}
        </Eyebrow>
      )}
    </>
  );
}
