import type { Project } from "@/lib/content.schema";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";
import { CaseHeroMotionRoot } from "./CaseHeroMotionRoot";
import { focal, getCaseImages } from "./images";

/**
 * Case-study opener: full-bleed cover (the Flip target for the portfolio → case transition),
 * then category, title (h1) and the live-site description verbatim.
 *
 * No meta rail: the two rows it used to carry — an asset tally ("Images 3", which contradicted the
 * per-block counters) and a "Source" link back to the legacy Wix collection page — are build
 * provenance, not visitor copy, and the link left the site in the same tab with no external-link
 * affordance. Both facts stay in content/projects.json for the team; project.categoryNote likewise
 * is internal and is reported in OPEN-ITEMS.md instead of being rendered.
 */
export function CaseHero({ project }: { project: Project }) {
  const { cover } = getCaseImages(project);

  return (
    <CaseHeroMotionRoot slug={project.slug} aria-labelledby="case-title" className="bg-bone">
      <div className="relative">
        <SmartImage
          image={cover}
          sizes="100vw"
          quality={85}
          lcp
          objectPosition={cover ? focal(cover) : undefined}
          className="aspect-[4/5] w-full md:aspect-[16/9]"
          placeholderTodo={`${project.title} cover image`}
          imgProps={{ "data-flip-target": project.slug }}
        />
      </div>

      <Container className="py-10 md:py-12 lg:py-16">
        <Eyebrow data-reveal>{project.category ?? "Project"}</Eyebrow>
        <Heading as="h1" id="case-title" size="h1" className="mt-3 max-w-[14ch]" tabIndex={-1} data-reveal data-reveal-lcp>
          {project.title}
        </Heading>
        <p className="measure mt-6 text-lead" data-reveal>
          {project.description}
        </p>
      </Container>
    </CaseHeroMotionRoot>
  );
}
