/**
 * Content sanity check for content/projects.json.
 *
 *   pnpm content:check [--strict]
 *
 * - validates the file with the zod contract in src/lib/content.schema.ts (invalid → exit 1 always)
 * - lists todos[] and counts {{TODO …}} tokens in alt fields
 * - checks that every referenced image file exists under public/
 * - checks that every project has ≥1 image or is flagged (todo entry / unpublished)
 * - checks cover indices and the home/material image references
 * - verifies the project slugs against the 7-project sitemap fixed in the plan
 *
 * --strict: exit 1 when any alt is still a {{TODO}} or any image file is missing.
 * A slug set that differs from the sitemap is an error in both modes.
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ProjectsFileSchema, type ProjectsFile } from "../src/lib/content.schema";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_FILE = path.join(ROOT, "content", "projects.json");
const PUBLIC_DIR = path.join(ROOT, "public");

/** The live sitemap's 7 projects in the brief's order (plan §1, verified against portfolio-projects-sitemap.xml). */
export const EXPECTED_SLUGS = [
  "oceanside",
  "las-olas",
  "aromatherapy-and-natural-elements",
  "wellness-space-with-city-view",
  "classroom-designs",
  "wellness-space-designs",
  "modern-interior-design",
] as const;

const TODO_RE = /\{\{TODO/;

type Level = "error" | "warn" | "info";
type Finding = { level: Level; where: string; message: string };

const findings: Finding[] = [];
const add = (level: Level, where: string, message: string) => findings.push({ level, where, message });

async function fileExists(publicPath: string): Promise<boolean> {
  try {
    const s = await stat(path.join(PUBLIC_DIR, publicPath));
    return s.isFile();
  } catch {
    return false;
  }
}

/** Every string containing a {{TODO token, with its JSON path. */
function collectTodoTokens(value: unknown, at = "$", out: { path: string; token: string }[] = []): { path: string; token: string }[] {
  if (typeof value === "string") {
    if (TODO_RE.test(value)) out.push({ path: at, token: value });
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => collectTodoTokens(v, `${at}[${i}]`, out));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) if (k !== "todos") collectTodoTokens(v, `${at}.${k}`, out);
  }
  return out;
}

type Row = {
  slug: string;
  title: string;
  category: string;
  images: number;
  cover: string;
  todoAlts: number;
  missing: number;
  sitemap: string;
  status: string;
};

function printTable(rows: Row[]) {
  const header: (keyof Row)[] = ["slug", "title", "category", "images", "cover", "todoAlts", "missing", "sitemap", "status"];
  const cells = [header.map(String), ...rows.map((r) => header.map((h) => String(r[h])))];
  const widths = header.map((_, i) => Math.max(...cells.map((c) => (c[i] ?? "").length)));
  const line = (c: string[]) => "  " + c.map((v, i) => (i >= 3 && i <= 6 ? v.padStart(widths[i] ?? 0) : v.padEnd(widths[i] ?? 0))).join("  ");
  console.log(line(cells[0] ?? []));
  console.log("  " + widths.map((w) => "-".repeat(w)).join("  "));
  for (const c of cells.slice(1)) console.log(line(c));
}

async function checkProjects(data: ProjectsFile): Promise<Row[]> {
  const rows: Row[] = [];
  const flaggedSlugs = new Set<string>();
  for (const todo of data.todos) {
    for (const p of data.projects) if (todo.path.includes(p.slug) || todo.token.includes(p.slug) || todo.token.includes(p.title)) flaggedSlugs.add(p.slug);
  }
  // Index-based todo paths (projects[3].…) flag by position.
  for (const todo of data.todos) {
    const m = /projects\[(\d+)\]/.exec(todo.path);
    const project = m ? data.projects[Number(m[1])] : undefined;
    if (project) flaggedSlugs.add(project.slug);
  }

  const expected = new Set<string>(EXPECTED_SLUGS);
  for (const project of data.projects) {
    const where = `projects.${project.slug}`;
    const problems: string[] = [];
    let todoAlts = 0;
    let missing = 0;

    for (const [i, image] of project.images.entries()) {
      if (TODO_RE.test(image.alt)) {
        todoAlts++;
        add("warn", `${where}.images[${i}].alt`, `alt is a TODO: ${image.alt}`);
      }
      if (!(await fileExists(image.file))) {
        missing++;
        add("error", `${where}.images[${i}].file`, `missing under public/: ${image.file}`);
      }
      if (i === project.cover && image.role !== "cover") add("info", `${where}.images[${i}]`, `cover index points at a "${image.role}" image (role is informational)`);
    }

    if (project.images.length === 0) {
      const flagged = flaggedSlugs.has(project.slug) || !project.published;
      if (flagged) add("info", where, `no images (flagged: ${!project.published ? "unpublished" : "todo entry present"})`);
      else {
        add("warn", where, "no images and not flagged (no todos[] entry mentions this project, published=true)");
        problems.push("no-images");
      }
    }

    let coverLabel: string;
    if (project.cover === null) {
      coverLabel = "null";
      if (project.images.length > 0) {
        add("warn", `${where}.cover`, `null although ${project.images.length} image(s) exist — tile/hero/OG will render the placeholder`);
        problems.push("no-cover");
      }
    } else if (project.cover >= project.images.length) {
      coverLabel = `${project.cover}!`;
      add("error", `${where}.cover`, `index ${project.cover} out of range (${project.images.length} images)`);
      problems.push("cover-range");
    } else {
      coverLabel = String(project.cover);
      if (!(await fileExists(`/projects/${project.slug}/og.jpg`))) add("warn", `${where}`, `cover set but public/projects/${project.slug}/og.jpg is missing (generateMetadata references it)`);
    }

    const inSitemap = expected.has(project.slug);
    if (!inSitemap) {
      add("error", where, `slug is not one of the 7 sitemap projects: ${EXPECTED_SLUGS.join(", ")}`);
      problems.push("not-in-sitemap");
    } else {
      const expectedOrder = EXPECTED_SLUGS.indexOf(project.slug as (typeof EXPECTED_SLUGS)[number]);
      if (project.order !== expectedOrder) add("warn", `${where}.order`, `order ${project.order} differs from the sitemap position ${expectedOrder}`);
    }

    if (todoAlts) problems.push(`${todoAlts} todo alt${todoAlts === 1 ? "" : "s"}`);
    if (missing) problems.push(`${missing} missing file${missing === 1 ? "" : "s"}`);

    rows.push({
      slug: project.slug,
      title: project.title.length > 34 ? `${project.title.slice(0, 33)}…` : project.title,
      category: project.category ?? "—",
      images: project.images.length,
      cover: coverLabel,
      todoAlts,
      missing,
      sitemap: inSitemap ? "yes" : "NO",
      status: problems.length ? problems.join(", ") : "ok",
    });
  }

  const present = new Set(data.projects.map((p) => p.slug));
  for (const slug of EXPECTED_SLUGS) if (!present.has(slug)) add("error", "projects", `sitemap project "${slug}" is missing from projects.json`);
  const dupes = data.projects.map((p) => p.slug).filter((s, i, arr) => arr.indexOf(s) !== i);
  for (const slug of new Set(dupes)) add("error", "projects", `duplicate slug "${slug}"`);
  return rows;
}

async function checkSiteImages(data: ProjectsFile) {
  const resolve = (ref: { slug: string; mediaId: string } | null, where: string) => {
    if (!ref) {
      add("warn", where, "not set (renders the placeholder)");
      return;
    }
    const project = data.projects.find((p) => p.slug === ref.slug);
    const image = project?.images.find((img) => img.mediaId === ref.mediaId);
    if (!image) add("error", where, `reference ${ref.slug}/${ref.mediaId} does not resolve to a project image`);
  };
  resolve(data.home.hero, "home.hero");
  resolve(data.home.manifesto, "home.manifesto");
  data.home.materials.forEach((m, i) => resolve(m.image, `home.materials[${i}] (${m.id})`));
  if (data.home.materials.length === 0) add("info", "home.materials", "empty");

  const portrait = data.home.meetTheDesigner.portrait;
  let todoAlts = 0;
  let missing = 0;
  if (!portrait) add("warn", "home.meetTheDesigner.portrait", "not set (renders the placeholder)");
  else {
    if (TODO_RE.test(portrait.alt)) {
      todoAlts++;
      add("warn", "home.meetTheDesigner.portrait.alt", `alt is a TODO: ${portrait.alt}`);
    }
    if (!(await fileExists(portrait.file))) {
      missing++;
      add("error", "home.meetTheDesigner.portrait.file", `missing under public/: ${portrait.file}`);
    }
  }
  for (const [i, post] of data.blog.entries()) {
    if (!post.cover) continue;
    if (TODO_RE.test(post.cover.alt)) {
      todoAlts++;
      add("warn", `blog[${i}].cover.alt`, `alt is a TODO: ${post.cover.alt}`);
    }
    if (!(await fileExists(post.cover.file))) {
      missing++;
      add("error", `blog[${i}].cover.file`, `missing under public/: ${post.cover.file}`);
    }
  }
  const slugs = new Set(data.projects.map((p) => p.slug));
  for (const slug of data.home.recentProjects) if (!slugs.has(slug)) add("error", "home.recentProjects", `unknown slug "${slug}"`);
  if (data.home.meetTheDesigner.pressMention && !data.home.meetTheDesigner.pressConfirmed) add("info", "home.meetTheDesigner.pressMention", "unconfirmed — stays hidden until pressConfirmed=true");
  return { todoAlts, missing };
}

async function main() {
  const strict = process.argv.includes("--strict");
  const unknown = process.argv.slice(2).filter((a) => a !== "--strict");
  if (unknown.length) throw new Error(`Unknown argument(s): ${unknown.join(" ")}`);

  const raw = JSON.parse(await readFile(CONTENT_FILE, "utf8")) as unknown;
  const parsed = ProjectsFileSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[content] content/projects.json fails the schema (${parsed.error.issues.length} issue(s)):`);
    for (const issue of parsed.error.issues) console.error(`  ${issue.path.join(".") || "$"}: ${issue.message}`);
    process.exitCode = 1;
    return;
  }
  const data = parsed.data;
  console.log(`[content] ${path.relative(ROOT, CONTENT_FILE)} — schema OK · generated ${data.generatedAt} · ${data.projects.length} project(s)${strict ? " · --strict" : ""}`);
  console.log(`[content] _generated: ${data._generated}`);
  console.log("");

  const rows = await checkProjects(data);
  const site = await checkSiteImages(data);
  printTable(rows);

  const projectTodoAlts = rows.reduce((n, r) => n + r.todoAlts, 0);
  const projectMissing = rows.reduce((n, r) => n + r.missing, 0);
  const totalImages = data.projects.reduce((n, p) => n + p.images.length, 0);
  const todoAlts = projectTodoAlts + site.todoAlts;
  const missing = projectMissing + site.missing;

  console.log("");
  console.log(`[content] images: ${totalImages} project image(s) + ${data.home.meetTheDesigner.portrait ? 1 : 0} portrait + ${data.blog.filter((b) => b.cover).length} blog cover(s)`);
  console.log(`[content] TODO alts: ${todoAlts} · missing files: ${missing}`);

  const tokens = collectTodoTokens(data);
  console.log(`[content] todos[]: ${data.todos.length} entr${data.todos.length === 1 ? "y" : "ies"} · {{TODO tokens found in the file: ${tokens.length}`);
  for (const t of data.todos) console.log(`  - ${t.path}: ${t.token}`);
  const listed = new Set(data.todos.map((t) => t.token));
  const unlisted = tokens.filter((t) => !listed.has(t.token));
  for (const t of unlisted) add("warn", t.path, `{{TODO token not listed in todos[]: ${t.token}`);

  const byLevel = (level: Level) => findings.filter((f) => f.level === level);
  console.log("");
  for (const level of ["error", "warn", "info"] as const) {
    const list = byLevel(level);
    if (!list.length) continue;
    console.log(`${level.toUpperCase()} (${list.length}):`);
    for (const f of list) console.log(`  ${f.where}: ${f.message}`);
  }

  const errors = byLevel("error").filter((f) => !f.message.startsWith("missing under public/")).length;
  const strictFail = strict && (todoAlts > 0 || missing > 0);
  console.log("");
  if (errors) {
    console.log(`[content] FAIL — ${errors} content error(s)`);
    process.exitCode = 1;
  } else if (strictFail) {
    console.log(`[content] FAIL (--strict) — ${todoAlts} TODO alt(s), ${missing} missing file(s)`);
    process.exitCode = 1;
  } else if (missing > 0) {
    console.log(`[content] PASS with ${missing} missing file(s) — would fail under --strict`);
    process.exitCode = 0;
  } else {
    console.log(`[content] PASS${todoAlts ? ` with ${todoAlts} TODO alt(s) — would fail under --strict` : ""}`);
    process.exitCode = 0;
  }
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((error: unknown) => {
    console.error(`[content] fatal: ${String(error)}`);
    process.exitCode = 1;
  });
}
