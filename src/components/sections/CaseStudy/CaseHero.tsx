import type { Project } from "@/lib/content.schema";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";
import { CaseHeroMotionRoot } from "./CaseHeroMotionRoot";
import { focal, getCaseImages } from "./images";

const SOURCE_HOST = "stylemyspacedesign.com";

/**
 * Case-study opener: full-bleed cover (the Flip target for the portfolio → case transition),
 * then category, title (h1), the live-site description verbatim and a small factual meta row.
 */
export function CaseHero({ project }: { project: Project }) {
  const { cover } = getCaseImages(project);
  const imageCount = project.images.length;

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
        <div className="grid grid-cols-12 gap-x-4 gap-y-8">
          <div className="col-span-12 lg:col-span-8">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Eyebrow data-reveal>{project.category ?? "Project"}</Eyebrow>
            </div>
            <Heading as="h1" id="case-title" size="h1" className="mt-3 max-w-[14ch]" tabIndex={-1} data-reveal>
              {project.title}
            </Heading>
            <p className="measure mt-6 text-lead" data-reveal>
              {project.description}
            </p>
            {project.categoryNote && (
              <p className="measure mt-4 text-small text-olive" data-reveal>
                {project.categoryNote}
              </p>
            )}
          </div>

          <dl
            className="col-span-12 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-taupe pt-3 lg:col-span-3 lg:col-start-10 lg:grid-cols-1 lg:pt-4"
            data-reveal
          >
            <div>
              <dt className="eyebrow text-olive">Images</dt>
              <dd className="mt-1 font-display text-h3 tabular-nums">{imageCount}</dd>
            </div>
            <div>
              <dt className="eyebrow text-olive">Source</dt>
              <dd className="mt-1 text-small">
                <a
                  href={project.sourceUrl}
                  rel="noopener"
                  className="inline-flex min-h-6 items-center rounded-xs underline decoration-taupe underline-offset-4 transition-colors duration-(--dur-micro) hover:decoration-olive"
                >
                  {SOURCE_HOST}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </Container>
    </CaseHeroMotionRoot>
  );
}
