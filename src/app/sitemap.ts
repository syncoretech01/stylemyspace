import type { MetadataRoute } from "next";
import { getProjects, getRoutes, getCover } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const projects = new Map(getProjects().map((p) => [`/portfolio/${p.slug}`, p]));
  return getRoutes().map((route) => {
    const project = projects.get(route);
    const cover = project ? getCover(project) : null;
    return {
      url: absoluteUrl(route),
      lastModified,
      changeFrequency: route === "/" ? "weekly" : "monthly",
      priority: route === "/" ? 1 : route.startsWith("/portfolio/") ? 0.7 : 0.8,
      ...(cover ? { images: [absoluteUrl(cover.file)] } : {}),
    };
  });
}
