import type { Project, ProjectImage } from "@/lib/content.schema";
import { getCover } from "@/lib/content";
// SERVER-ONLY: importing this file from a "use client" component would ship zod + projects.json to the browser.

/**
 * How many non-cover images the editorial spreads take before the gallery strip begins.
 * No photograph is ever shown twice on a case study: the cover is left out of both, and so is any frame
 * listed as a near-duplicate of another (content/overrides.json).
 */
export const BLOCK_COUNT = 4;

export type CaseImages = {
  cover: ProjectImage | null;
  /** Editorial spreads: the project's lead images, then JSON order. */
  blocks: ProjectImage[];
  /** Everything after the spreads → horizontal gallery strip. */
  gallery: ProjectImage[];
};

export function getCaseImages(project: Project): CaseImages {
  const pool = project.images.filter((img, i) => i !== project.cover && !project.nearDuplicates.includes(img.mediaId));
  const lead = project.lead.flatMap((m) => pool.find((img) => img.mediaId === m) ?? []);
  const rest = [...lead, ...pool.filter((img) => !lead.includes(img))];
  return { cover: getCover(project), blocks: rest.slice(0, BLOCK_COUNT), gallery: rest.slice(BLOCK_COUNT) };
}

/**
 * Masters with the old site's scroll button burned into their top band (y 17%–25%). Any frame of 7:5 or
 * wider, anchored to the bottom edge by the image's focal point, leaves it out. Remove the entry once a
 * clean export is supplied (OPEN-ITEMS OI-09).
 */
const BAKED_ARTEFACT = new Set(["6af838_7627bb561c774b9f911e7b3d935a69e0"]);
export const hasBakedArtefact = (img: ProjectImage) => BAKED_ARTEFACT.has(img.mediaId);

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
