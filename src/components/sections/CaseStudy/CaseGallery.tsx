import type { Project } from "@/lib/content.schema";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";
import { CaseGalleryMotionRoot } from "./CaseGalleryMotionRoot";
import { GalleryControls } from "./GalleryControls";
import { focal, getCaseImages } from "./images";

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
      data-theme="dark"
      className="relative bg-olive-deep py-9 text-bone motion-full:overflow-x-clip md:py-11 lg:py-13 [--gutter:1.5rem] md:[--gutter:3rem] lg:[--gutter:max(5rem,calc((100%-90rem)/2+5rem))]"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 ps-(--gutter) pe-(--gutter)">
        {/* "Gallery", not the project title: the h1 two screens up already names the project. */}
        <Heading size="h2" data-reveal>
          Gallery
        </Heading>
        <GalleryControls scrollerId={scrollerId} total={gallery.length} />
      </div>

      <ul
        id={scrollerId}
        role="list"
        data-gallery-track
        data-lenis-prevent
        className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain py-1 ps-(--gutter) pe-(--gutter) scroll-ps-(--gutter) [scrollbar-width:none] [touch-action:pan-x_pan-y] md:gap-4 lg:mt-5 [&::-webkit-scrollbar]:hidden"
      >
        {gallery.map((img, i) => (
          <li
            key={img.mediaId}
            data-gallery-slide
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${gallery.length}`}
            className="w-[84vw] shrink-0 snap-start [scroll-snap-stop:always] sm:w-[60vw] lg:w-[44vw] lg:max-w-[56rem]"
          >
            <figure tabIndex={0} aria-label={img.alt} className="rounded-xs" data-reveal>
              <SmartImage
                image={img}
                sizes="(max-width: 639px) 84vw, (max-width: 1023px) 60vw, 44vw"
                objectPosition={focal(img)}
                className="aspect-[4/3] w-full"
              />
              {img.caption && <figcaption className="mt-1.5 text-small text-sand">{img.caption}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>
    </CaseGalleryMotionRoot>
  );
}
