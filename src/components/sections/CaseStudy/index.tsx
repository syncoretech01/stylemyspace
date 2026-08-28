import Link from "next/link";
import type { Route } from "next";
import type { Project } from "@/lib/content.schema";
import { getCover } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";

/** STUB (P0). Owner ⑤: full-bleed hero (Flip target), sticky title, parallax blocks, 3D gallery, next-project reveal. */
export function CaseHero({ project }: { project: Project }) {
  const cover = getCover(project);
  return (
    <header aria-labelledby="case-title" className="bg-bone">
      <SmartImage image={cover} sizes="100vw" quality={85} lcp className="aspect-[4/5] md:aspect-[16/9]" placeholderTodo={`${project.title} hero — pending image pipeline`} />
      <Container className="py-8 md:py-12">
        <Eyebrow>{project.category ?? "Project"}</Eyebrow>
        <Heading as="h1" id="case-title" size="h1" className="mt-2" tabIndex={-1}>
          {project.title}
        </Heading>
        <p className="measure mt-4 text-lead">{project.description}</p>
      </Container>
    </header>
  );
}

export function CaseBlocks({ project }: { project: Project }) {
  const blocks = project.images.filter((_, i) => i !== project.cover).slice(0, 4);
  if (!blocks.length) return null;
  return (
    <Section flush className="pb-8">
      <Container className="grid gap-6 md:grid-cols-2">
        {blocks.map((img) => (
          <figure key={img.mediaId}>
            <SmartImage image={img} sizes="(max-width: 768px) 100vw, 50vw" className="aspect-[4/3]" />
            {img.caption && <figcaption className="mt-2 text-small text-olive">{img.caption}</figcaption>}
          </figure>
        ))}
      </Container>
    </Section>
  );
}

export function CaseGallery({ project }: { project: Project }) {
  const gallery = project.images.filter((_, i) => i !== project.cover).slice(4);
  if (!gallery.length) return null;
  return (
    <Section tone="sand" aria-labelledby="gallery-title">
      <Container>
        <Eyebrow>Gallery</Eyebrow>
        <Heading id="gallery-title" className="mt-2">
          More from {project.title}
        </Heading>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {gallery.map((img) => (
            <li key={img.mediaId}>
              <figure>
                <SmartImage image={img} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="aspect-[4/3]" />
                {img.caption && <figcaption className="mt-2 text-small text-olive">{img.caption}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/** prev/next follow portfolio order and are null at the ends (like the live site). */
export function NextProject({ next, prev }: { next: Project | null; prev: Project | null }) {
  return (
    <Section tone="dark" aria-label="Project navigation" flush className="py-8">
      <Container className="flex flex-wrap items-center justify-between gap-4">
        {prev ? (
          <Link href={`/portfolio/${prev.slug}` as Route} className="eyebrow rounded-xs py-1 hover:underline">
            ← {prev.title}
          </Link>
        ) : (
          <Link href="/portfolio" className="eyebrow rounded-xs py-1 hover:underline">
            ← All projects
          </Link>
        )}
        {next ? (
          <Link href={`/portfolio/${next.slug}` as Route} className="group rounded-xs" data-cursor="Open">
            <Eyebrow>Next project</Eyebrow>
            <span className="mt-1 block font-display text-h2">{next.title} →</span>
          </Link>
        ) : (
          <Link href="/portfolio" className="group rounded-xs" data-cursor="View">
            <Eyebrow>End of the portfolio</Eyebrow>
            <span className="mt-1 block font-display text-h2">Back to all projects →</span>
          </Link>
        )}
      </Container>
    </Section>
  );
}
