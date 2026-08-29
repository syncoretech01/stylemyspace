import type { Project } from "@/lib/content.schema";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";
import { CaseGalleryMotionRoot } from "./CaseGalleryMotionRoot";
import { GalleryControls } from "./GalleryControls";
import { focal, getCaseImages, pad2 } from "./images";

/**
 * The remaining images as a native horizontal scroll-snap strip — the final state under reduced
 * motion and on the mobile tier. Announced as a carousel; every slide is reachable by keyboard.
 * On the full tier CaseGallery.motion.ts re-stages this same markup as a 3D perspective slider:
 * [data-gallery-track] becomes the perspective stage and [data-gallery-slide] the slides. The
 * section clips the x-axis there because the stage itself must never clip a rotated slide.
 */
export function CaseGallery({ project }: { project: Project }) {
  const { gallery } = getCaseImages(project);
  if (!gallery.length) return null;
  const scrollerId = `gallery-${project.slug}`;

  return (
    <CaseGalleryMotionRoot
      role="region"
      aria-roledescription="carousel"
      aria-label="Project gallery"
      className="relative bg-sand py-12 text-ink motion-full:overflow-x-clip md:py-16 lg:py-24 [--gutter:1.5rem] md:[--gutter:3rem] lg:[--gutter:max(5rem,calc((100%-90rem)/2+5rem))]"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 ps-(--gutter) pe-(--gutter)">
        <div>
          <Eyebrow data-reveal>Gallery</Eyebrow>
          <Heading size="h2" className="mt-2" data-reveal>
            {project.title}
          </Heading>
        </div>
        <GalleryControls scrollerId={scrollerId} total={gallery.length} />
      </div>

      <ul
        id={scrollerId}
        role="list"
        data-gallery-track
        data-lenis-prevent
        className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain py-1 ps-(--gutter) pe-(--gutter) scroll-ps-(--gutter) [scrollbar-width:none] [touch-action:pan-x_pan-y] md:gap-4 lg:mt-10 [&::-webkit-scrollbar]:hidden"
      >
        {gallery.map((img, i) => (
          <li
            key={img.mediaId}
            data-gallery-slide
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${gallery.length}`}
            className="w-[84vw] shrink-0 snap-start sm:w-[60vw] lg:w-[44vw] lg:max-w-[56rem]"
          >
            <figure tabIndex={0} aria-label={img.alt} className="rounded-xs" data-reveal>
              <SmartImage
                image={img}
                sizes="(max-width: 639px) 84vw, (max-width: 1023px) 60vw, 44vw"
                objectPosition={focal(img)}
                className="aspect-[4/3] w-full"
              />
              <figcaption className="mt-2 flex items-baseline gap-2 text-small text-olive">
                <span className="eyebrow tabular-nums" aria-hidden>
                  {pad2(i + 1)}
                </span>
                {img.caption && <span>{img.caption}</span>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </CaseGalleryMotionRoot>
  );
}
