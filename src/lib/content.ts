import raw from "../../content/projects.json";
import { ProjectsFileSchema, type ImageRef, type Project, type ProjectImage } from "./content.schema";

const parsed = ProjectsFileSchema.safeParse(raw);
if (!parsed.success) {
  throw new Error(
    "content/projects.json is invalid:\n" +
      parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n"),
  );
}
if (process.env.CONTENT_STRICT === "1" && parsed.data.todos.length > 0) {
  throw new Error(`CONTENT_STRICT: ${parsed.data.todos.length} unresolved {{TODO}} tokens in content/projects.json`);
}

const data = parsed.data;
const sorted = [...data.projects].filter((p) => p.published).sort((a, b) => a.order - b.order);

export const getContent = () => data;
export const getProjects = (): Project[] => sorted;
export const getProject = (slug: string): Project | null => sorted.find((p) => p.slug === slug) ?? null;

/**
 * Previous/next in portfolio order. NOT circular — the live site's "Previous / Next Project" buttons
 * stop at the first and last project (verified in content/scrape/pages/<slug>.json → text.hasPrevNext).
 */
export function getAdjacentProjects(slug: string): { prev: Project | null; next: Project | null } | null {
  const i = sorted.findIndex((p) => p.slug === slug);
  if (i < 0) return null;
  return { prev: sorted[i - 1] ?? null, next: sorted[i + 1] ?? null };
}

export const getCover = (p: Project): ProjectImage | null => (p.cover === null ? null : (p.images[p.cover] ?? null));

export function resolveImage(ref: ImageRef | null | undefined): ProjectImage | null {
  if (!ref) return null;
  const project = data.projects.find((p) => p.slug === ref.slug);
  return project?.images.find((img) => img.mediaId === ref.mediaId) ?? null;
}

/** Every routable path on the site (used by sitemap, QA and Lighthouse). */
export const getRoutes = (): string[] => [
  "/",
  "/portfolio",
  ...sorted.map((p) => `/portfolio/${p.slug}`),
  "/services",
  "/about",
  "/contact",
];

export const getProjectsByCategory = (category: Project["category"]) => sorted.filter((p) => p.category === category);
