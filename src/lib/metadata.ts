import type { Metadata } from "next";
import { SITE } from "@/lib/site";

/** The generated share card (src/app/opengraph-image.tsx). */
const DEFAULT_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE.name}, interior design in New York`,
};

export const OG_DEFAULTS = {
  type: "website" as const,
  siteName: SITE.name,
  locale: "en_US",
  images: [DEFAULT_IMAGE],
};

type PageMeta = {
  /** Omit on the home page to use the root layout's default title. */
  title?: string;
  description: string;
  path: string;
  image?: { url: string; width: number; height: number; alt: string };
};

/**
 * Metadata for one route. Next merges `openGraph` SHALLOWLY between segments: a page that sets only
 * `openGraph: { url }` replaces the layout's whole object and silently loses its site name, locale,
 * type and share image. Building the full object here keeps every route's link preview complete.
 */
export function pageMetadata({ title, description, path, image }: PageMeta): Metadata {
  const images = [image ?? DEFAULT_IMAGE];
  const shareTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} | Interior Design, New York`;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: { ...OG_DEFAULTS, url: path, title: shareTitle, description, images },
    twitter: { card: "summary_large_image", title: shareTitle, description, images },
  };
}
