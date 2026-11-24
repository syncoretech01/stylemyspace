import type { Metadata } from "next";
import { SITE } from "@/lib/site";

/**
 * Where link previews fetch their picture. It has to be an address that serves this build today, which
 * SITE.url is not until the client's domain points here. On Vercel the project's production domain is,
 * and it becomes the client's own domain once that is attached. An explicit NEXT_PUBLIC_SITE_URL wins.
 * Canonical URLs keep using SITE.url.
 */
const IMAGE_ORIGIN =
  !process.env.NEXT_PUBLIC_SITE_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : SITE.url;

/** The generated share card (src/app/opengraph-image.tsx). */
const DEFAULT_IMAGE = {
  url: `${IMAGE_ORIGIN}/opengraph-image`,
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
  const images = [image ? { ...image, url: `${IMAGE_ORIGIN}${image.url}` } : DEFAULT_IMAGE];
  const shareTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} | Interior Design, New York`;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: { ...OG_DEFAULTS, url: path, title: shareTitle, description, images },
    twitter: { card: "summary_large_image", title: shareTitle, description, images },
  };
}
