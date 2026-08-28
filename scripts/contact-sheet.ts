/**
 * Contact-sheet helper: composites labelled thumbnails into one (or several) PNG montages with sharp.
 *
 *   import { makeContactSheet } from "./contact-sheet";
 *   await makeContactSheet({ images: [{ path, label }], out: "qa/contact-sheets/x.png", title: "…" });
 *
 * CLI:
 *   pnpm tsx scripts/contact-sheet.ts <dir> [--out=<png>] [--pattern=<glob-ish>] [--columns=6] [--thumb=320] [--max=2000]
 *   pnpm tsx scripts/contact-sheet.ts            # no <dir>: rebuilds qa/contact-sheets/images/* from content/projects.json
 *
 * - Thumbnails are resized to `thumbWidth` (fit inside thumbWidth × thumbWidth·1.5, top-aligned) so tall full-page
 *   screenshots stay readable; labels are rendered as SVG text (word-wrapped, ≤3 lines, XML-escaped).
 * - When the sheet would exceed `maxLongEdge` on its long side it is split into <out>.png, <out>-part2.png, … .
 * - Returns the list of written files.
 */
import { mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp, { type OverlayOptions } from "sharp";

export interface SheetImage {
  /** absolute or cwd-relative path to a raster sharp can read */
  path: string;
  label: string;
}

export interface ContactSheetOptions {
  images: SheetImage[];
  /** output PNG path; parts get a "-partN" suffix before the extension */
  out: string;
  /** optional title band at the top of every part */
  title?: string;
  thumbWidth?: number;
  columns?: number;
  /** maximum long-edge size of each written sheet (px) */
  maxLongEdge?: number;
}

export interface ContactSheetResult {
  files: string[];
  parts: number;
  images: number;
  skipped: { path: string; reason: string }[];
}

const GAP = 8;
const LABEL_FONT = 12;
const LABEL_LINE = 15;
const LABEL_LINES = 3;
const LABEL_H = LABEL_LINES * LABEL_LINE + 6;
const TITLE_H = 34;
const BG = { r: 24, g: 24, b: 26, alpha: 1 };
const CELL_BG = { r: 38, g: 38, b: 42, alpha: 1 };

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** Greedy word-wrap to `maxChars` per line (long tokens are hard-broken); ellipsis on the last line. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const raw of words) {
    let word = raw;
    while (word.length > maxChars) {
      if (cur) {
        lines.push(cur);
        cur = "";
      }
      lines.push(word.slice(0, maxChars));
      word = word.slice(maxChars);
    }
    const candidate = cur ? `${cur} ${word}` : word;
    if (candidate.length <= maxChars) cur = candidate;
    else {
      if (cur) lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const last = kept[maxLines - 1] ?? "";
    kept[maxLines - 1] = `${last.slice(0, Math.max(0, maxChars - 1))}…`;
    return kept;
  }
  return lines;
}

function labelSvg(text: string, width: number, height: number, fontSize: number, lineHeight: number, maxLines: number): Buffer {
  const maxChars = Math.max(8, Math.floor(width / (fontSize * 0.58)));
  const lines = wrap(text, maxChars, maxLines);
  const tspans = lines
    .map((l, i) => `<tspan x="4" y="${fontSize + 2 + i * lineHeight}">${escapeXml(l)}</tspan>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="rgb(38,38,42)"/><text font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" fill="#e8e6df">${tspans}</text></svg>`;
  return Buffer.from(svg);
}

function partPath(out: string, part: number): string {
  if (part === 1) return out;
  const ext = path.extname(out) || ".png";
  return `${out.slice(0, out.length - ext.length)}-part${part}${ext}`;
}

interface Thumb {
  buffer: Buffer;
  width: number;
  height: number;
  label: string;
}

export async function makeContactSheet(opts: ContactSheetOptions): Promise<ContactSheetResult> {
  const thumbWidth = Math.max(64, Math.floor(opts.thumbWidth ?? 320));
  const maxLongEdge = Math.max(256, Math.floor(opts.maxLongEdge ?? 2000));
  const maxThumbH = Math.floor(thumbWidth * 1.5);
  // Fit the requested columns inside maxLongEdge.
  let columns = Math.max(1, Math.floor(opts.columns ?? 6));
  while (columns > 1 && columns * (thumbWidth + GAP) + GAP > maxLongEdge) columns--;
  const sheetW = columns * (thumbWidth + GAP) + GAP;

  const skipped: ContactSheetResult["skipped"] = [];
  const thumbs: Thumb[] = [];
  for (const img of opts.images) {
    try {
      const buffer = await sharp(img.path, { limitInputPixels: false })
        .rotate()
        .resize({ width: thumbWidth, height: maxThumbH, fit: "inside", withoutEnlargement: false })
        .png()
        .toBuffer();
      const meta = await sharp(buffer).metadata();
      thumbs.push({ buffer, width: meta.width ?? thumbWidth, height: meta.height ?? maxThumbH, label: img.label });
    } catch (err) {
      skipped.push({ path: img.path, reason: err instanceof Error ? err.message : String(err) });
    }
  }
  if (!thumbs.length) throw new Error(`makeContactSheet: no readable images for ${opts.out}`);

  const cellH = Math.max(...thumbs.map((t) => t.height));
  const rowH = cellH + LABEL_H + GAP;
  const headerH = (opts.title ? TITLE_H : 0) + GAP;
  const rowsPerPart = Math.max(1, Math.floor((maxLongEdge - headerH) / rowH));
  const perPart = rowsPerPart * columns;
  const parts = Math.ceil(thumbs.length / perPart);

  await mkdir(path.dirname(opts.out), { recursive: true });
  const files: string[] = [];
  for (let p = 0; p < parts; p++) {
    const slice = thumbs.slice(p * perPart, (p + 1) * perPart);
    const rows = Math.ceil(slice.length / columns);
    const sheetH = headerH + rows * rowH;
    const composites: OverlayOptions[] = [];
    if (opts.title) {
      const title = parts > 1 ? `${opts.title}  (part ${p + 1}/${parts})` : opts.title;
      composites.push({ input: labelSvg(title, sheetW, TITLE_H, 16, 20, 1), left: 0, top: 0 });
    }
    slice.forEach((t, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = GAP + col * (thumbWidth + GAP);
      const y = headerH + row * rowH;
      composites.push({
        input: { create: { width: thumbWidth, height: cellH, channels: 4, background: CELL_BG } },
        left: x,
        top: y,
      });
      composites.push({ input: t.buffer, left: x + Math.floor((thumbWidth - t.width) / 2), top: y });
      composites.push({ input: labelSvg(t.label, thumbWidth, LABEL_H, LABEL_FONT, LABEL_LINE, LABEL_LINES), left: x, top: y + cellH });
    });
    const file = partPath(opts.out, p + 1);
    await sharp({ create: { width: sheetW, height: sheetH, channels: 4, background: BG } })
      .composite(composites)
      .png({ compressionLevel: 8 })
      .toFile(file);
    files.push(file);
  }
  return { files, parts, images: thumbs.length, skipped };
}

// ----------------------------------------------------------------------------
// CLI
// ----------------------------------------------------------------------------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RASTER_RE = /\.(png|jpe?g|webp|gif|avif|tiff?)$/i;

/** Very small glob: `*` → any chars, `?` → one char; matched against the file name. */
function globToRegExp(pattern: string): RegExp {
  const esc = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${esc}$`, "i");
}

function parseArgs(argv: string[]): { dir: string | null; out: string | null; pattern: string | null; columns?: number; thumb?: number; max?: number } {
  const res: ReturnType<typeof parseArgs> = { dir: null, out: null, pattern: null };
  for (const a of argv) {
    if (a.startsWith("--out=")) res.out = a.slice(6);
    else if (a.startsWith("--pattern=")) res.pattern = a.slice(10);
    else if (a.startsWith("--columns=")) res.columns = Number(a.slice(10));
    else if (a.startsWith("--thumb=")) res.thumb = Number(a.slice(8));
    else if (a.startsWith("--max=")) res.max = Number(a.slice(6));
    else if (a.startsWith("--")) throw new Error(`unknown flag ${a}`);
    else if (!res.dir) res.dir = a;
  }
  return res;
}

async function sheetForDirectory(dir: string, out: string | null, pattern: string | null, extra: Partial<ContactSheetOptions>) {
  const abs = path.resolve(dir);
  const re = pattern ? globToRegExp(pattern) : null;
  const names = (await readdir(abs)).filter((n) => RASTER_RE.test(n) && (!re || re.test(n))).sort();
  const images: SheetImage[] = [];
  for (const n of names) {
    const file = path.join(abs, n);
    if (!(await stat(file)).isFile()) continue;
    images.push({ path: file, label: n });
  }
  if (!images.length) throw new Error(`no images in ${abs}${pattern ? ` matching ${pattern}` : ""}`);
  const outFile = out ? path.resolve(out) : path.join(ROOT, "qa", "contact-sheets", `${path.basename(abs)}.png`);
  const res = await makeContactSheet({ images, out: outFile, title: `${path.relative(ROOT, abs) || abs} (${images.length} images)`, ...extra });
  for (const f of res.files) console.log(`wrote ${path.relative(ROOT, f)}`);
  for (const s of res.skipped) console.error(`skipped ${s.path}: ${s.reason}`);
}

/** Default mode: per-project image sheets (+ site.png) from content/projects.json, mirroring optimize-images.ts. */
async function sheetsFromProjectsJson(extra: Partial<ContactSheetOptions>) {
  const file = path.join(ROOT, "content", "projects.json");
  const data = JSON.parse(await readFile(file, "utf8")) as {
    projects: { slug: string; images: { file: string; mediaId: string; width: number; height: number; alt: string }[] }[];
    home: { meetTheDesigner: { portrait: { file: string; mediaId: string; width: number; height: number; alt: string } | null } };
    blog: { slug: string; cover: { file: string; mediaId: string; width: number; height: number; alt: string } | null }[];
  };
  const outDir = path.join(ROOT, "qa", "contact-sheets", "images");
  const label = (i: number, img: { mediaId: string; width: number; height: number; alt: string }) =>
    `${String(i).padStart(2, "0")} · ${img.mediaId} · ${img.width}x${img.height} · ${img.alt.slice(0, 70)}`;
  for (const p of data.projects) {
    if (!p.images.length) continue;
    const images = p.images.map((img, i) => ({ path: path.join(ROOT, "public", img.file), label: label(i, img) }));
    const res = await makeContactSheet({ images, out: path.join(outDir, `${p.slug}.png`), title: `${p.slug} (${images.length} images)`, ...extra });
    for (const f of res.files) console.log(`wrote ${path.relative(ROOT, f)}`);
  }
  const site: SheetImage[] = [];
  const portrait = data.home.meetTheDesigner.portrait;
  if (portrait) site.push({ path: path.join(ROOT, "public", portrait.file), label: `portrait · ${portrait.mediaId} · ${portrait.width}x${portrait.height} · ${portrait.alt.slice(0, 70)}` });
  data.blog.forEach((b, i) => {
    if (b.cover) site.push({ path: path.join(ROOT, "public", b.cover.file), label: label(i, b.cover) + ` · blog/${b.slug}` });
  });
  if (site.length) {
    const res = await makeContactSheet({ images: site, out: path.join(outDir, "site.png"), title: `site assets (${site.length})`, ...extra });
    for (const f of res.files) console.log(`wrote ${path.relative(ROOT, f)}`);
  }
}

const isMain = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url : false;
if (isMain) {
  (async () => {
    const args = parseArgs(process.argv.slice(2));
    const extra: Partial<ContactSheetOptions> = {};
    if (args.columns && Number.isFinite(args.columns)) extra.columns = args.columns;
    if (args.thumb && Number.isFinite(args.thumb)) extra.thumbWidth = args.thumb;
    if (args.max && Number.isFinite(args.max)) extra.maxLongEdge = args.max;
    if (args.dir) await sheetForDirectory(args.dir, args.out, args.pattern, extra);
    else await sheetsFromProjectsJson(extra);
  })().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
