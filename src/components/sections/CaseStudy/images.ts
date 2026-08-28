import type { Project, ProjectImage } from "@/lib/content.schema";
import { getCover } from "@/lib/content";
// SERVER-ONLY: importing this file from a "use client" component would ship zod + projects.json to the browser.

/** How many non-cover images the editorial blocks take before the gallery strip begins. */
export const BLOCK_COUNT = 4;

export type CaseImages = {
  cover: ProjectImage | null;
  /** Editorial alternating blocks (JSON order, cover excluded). */
  blocks: ProjectImage[];
  /** Everything after the blocks → horizontal gallery strip. */
  gallery: ProjectImage[];
};

export function getCaseImages(project: Project): CaseImages {
  const rest = project.images.filter((_, i) => i !== project.cover);
  return { cover: getCover(project), blocks: rest.slice(0, BLOCK_COUNT), gallery: rest.slice(BLOCK_COUNT) };
}

export type Orientation = "landscape" | "portrait" | "square";

export function orientation(img: ProjectImage): Orientation {
  const r = img.width / img.height;
  if (r > 1.1) return "landscape";
  if (r < 0.9) return "portrait";
  return "square";
}

/** object-position from the stored focal point (defaults to centre). */
export function focal(img: ProjectImage): string {
  const [x, y] = img.focalPoint ?? [0.5, 0.5];
  return `${Math.round(x * 100)}% ${Math.round(y * 100)}%`;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
