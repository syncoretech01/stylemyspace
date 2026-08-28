/**
 * Assert that the initial JS of every route contains none of the lazy-only libraries.
 *
 *   pnpm qa:bundle [baseUrl] [--routes=/,/about] [--strict]
 *
 * For each route: fetch the HTML, collect every <script src> and <link rel="modulepreload">
 * (and <link rel="preload" as="script">) under /_next/static, fetch each chunk once and scan it
 * for three.js / gsap / Lenis markers. Exit 1 on any violation (offending chunk + marker printed).
 *
 * Against `next dev` the chunks are not the production bundle (unminified, HMR-instrumented, and
 * lazy modules may be inlined), so a dev run is informational: violations are printed but the exit
 * code stays 0 unless --strict is passed. Run it against `pnpm build && pnpm start` for the real check.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isNextDevHtml, mapLimit, siteRoutes } from "./warm-images";

export const MARKERS = [
  { lib: "three", marker: "WebGLRenderer", re: /WebGLRenderer/ },
  { lib: "gsap", marker: "ScrollTrigger | gsap.registerPlugin | _gsap", re: /ScrollTrigger|gsap\.registerPlugin|\b_gsap\b/ },
  { lib: "lenis", marker: "lenis", re: /lenis/ },
  // The content loader (zod + content/projects.json) is server-only; a client import ships ~100 KB gz.
  { lib: "content loader (zod + projects.json)", marker: "ZodError | 6af838_<mediaId>", re: /ZodError|6af838_[0-9a-f]{32}/ },
] as const;

export type InitialScript = { url: string; kind: "script" | "modulepreload" | "preload" };

const TAG_RE = /<(script|link)\b([^>]*)>/gi;
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

const decodeAttr = (value: string) => value.replace(/&amp;|&#x26;|&#38;/gi, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of raw.matchAll(ATTR_RE)) {
    const name = (m[1] ?? "").toLowerCase();
    attrs[name] = decodeAttr(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}

/** Every /_next/static script the browser loads before any user interaction, from one HTML document. */
export function collectInitialScripts(html: string, baseUrl: string): InitialScript[] {
  const out = new Map<string, InitialScript>();
  for (const m of html.matchAll(TAG_RE)) {
    const tag = (m[1] ?? "").toLowerCase();
    const attrs = parseAttrs(m[2] ?? "");
    let ref: string | undefined;
    let kind: InitialScript["kind"] | undefined;
    if (tag === "script" && attrs.src) {
      ref = attrs.src;
      kind = "script";
    } else if (tag === "link" && attrs.href) {
      const rel = (attrs.rel ?? "").toLowerCase().split(/\s+/);
      if (rel.includes("modulepreload")) kind = "modulepreload";
      else if (rel.includes("preload") && (attrs.as ?? "").toLowerCase() === "script") kind = "preload";
      if (kind) ref = attrs.href;
    }
    if (!ref || !kind) continue;
    let url: URL;
    try {
      url = new URL(ref, baseUrl);
    } catch {
      continue;
    }
    if (!url.pathname.includes("/_next/static/")) continue;
    const key = url.href;
    if (!out.has(key)) out.set(key, { url: key, kind });
  }
  return [...out.values()];
}

type ChunkResult = {
  url: string;
  name: string;
  status: number;
  bytes: number;
  routes: string[];
  hits: { lib: string; marker: string; context: string }[];
  error?: string;
};

const chunkName = (url: string) => {
  const pathname = decodeURIComponent(new URL(url).pathname);
  return pathname.slice(pathname.indexOf("/_next/static/"));
};

const snippet = (source: string, index: number, radius = 70) => {
  const start = Math.max(0, index - radius);
  const end = Math.min(source.length, index + radius);
  return `${start > 0 ? "…" : ""}${source.slice(start, end).replace(/\s+/g, " ")}${end < source.length ? "…" : ""}`;
};

export function scanChunk(source: string): ChunkResult["hits"] {
  const hits: ChunkResult["hits"] = [];
  for (const { lib, marker, re } of MARKERS) {
    const m = re.exec(source);
    if (m) hits.push({ lib, marker: m[0] === marker ? marker : `${m[0]} (${marker})`, context: snippet(source, m.index) });
  }
  return hits;
}

const fmtKb = (bytes: number) => `${(bytes / 1024).toFixed(1).padStart(7)} kB`;

function parseArgs(argv: string[]) {
  let baseUrl = "http://localhost:3000";
  let routes = siteRoutes();
  let strict = false;
  for (const arg of argv) {
    if (arg === "--strict") strict = true;
    else if (arg.startsWith("--routes=")) routes = arg.slice("--routes=".length).split(",").map((s) => s.trim()).filter(Boolean).map((r) => (r.startsWith("/") ? r : `/${r}`));
    else if (arg.startsWith("--base-url=")) baseUrl = arg.slice("--base-url=".length);
    else if (!arg.startsWith("--")) baseUrl = arg;
    else throw new Error(`Unknown flag: ${arg}`);
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), routes, strict };
}

async function main() {
  const { baseUrl, routes, strict } = parseArgs(process.argv.slice(2));
  const started = performance.now();
  const byUrl = new Map<string, { kind: InitialScript["kind"]; routes: string[] }>();
  const perRoute = new Map<string, string[]>();
  let dev = false;
  let routeErrors = 0;

  for (const route of routes) {
    const url = `${baseUrl}${route}`;
    try {
      const res = await fetch(url, { headers: { accept: "text/html" }, signal: AbortSignal.timeout(120_000) });
      const html = await res.text();
      if (res.status >= 400) {
        routeErrors++;
        console.log(`[bundle] ${res.status} ${route} — skipped`);
        continue;
      }
      if (isNextDevHtml(html)) dev = true;
      const scripts = collectInitialScripts(html, baseUrl);
      perRoute.set(route, scripts.map((s) => s.url));
      for (const s of scripts) {
        const entry = byUrl.get(s.url) ?? { kind: s.kind, routes: [] };
        entry.routes.push(route);
        byUrl.set(s.url, entry);
      }
      console.log(`[bundle] ${res.status} ${route} — ${scripts.length} initial script(s)`);
    } catch (error) {
      routeErrors++;
      console.log(`[bundle] ERR ${route} — ${String(error)}`);
    }
  }

  const urls = [...byUrl.keys()];
  const chunks = await mapLimit(urls, 4, async (url): Promise<ChunkResult> => {
    const meta = byUrl.get(url);
    const base = { url, name: chunkName(url), routes: meta?.routes ?? [] };
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      const source = await res.text();
      if (res.status >= 400) return { ...base, status: res.status, bytes: source.length, hits: [], error: `HTTP ${res.status}` };
      return { ...base, status: res.status, bytes: Buffer.byteLength(source), hits: scanChunk(source) };
    } catch (error) {
      return { ...base, status: 0, bytes: 0, hits: [], error: String(error) };
    }
  });

  console.log("");
  console.log(`Checked ${chunks.length} unique chunk(s) across ${perRoute.size} route(s)${dev ? " — next dev detected (informational run)" : ""}:`);
  const sorted = [...chunks].sort((a, b) => a.name.localeCompare(b.name));
  for (const c of sorted) {
    const flag = c.error ? "ERR " : c.hits.length ? "FAIL" : "ok  ";
    console.log(`  ${flag} ${fmtKb(c.bytes)}  ${c.name}  (${c.routes.length} route${c.routes.length === 1 ? "" : "s"})${c.error ? `  ${c.error}` : ""}`);
  }

  console.log("");
  console.log("Initial JS per route (uncompressed bytes of the chunks above):");
  for (const [route, list] of perRoute) {
    const bytes = list.reduce((sum, u) => sum + (chunks.find((c) => c.url === u)?.bytes ?? 0), 0);
    console.log(`  ${fmtKb(bytes)}  ${route}  (${list.length} chunks)`);
  }

  const violations = chunks.filter((c) => c.hits.length);
  const fetchErrors = chunks.filter((c) => c.error);
  console.log("");
  for (const c of violations) {
    for (const h of c.hits) {
      console.log(`VIOLATION: ${h.lib} marker "${h.marker}" found in ${c.name}`);
      console.log(`  routes: ${c.routes.join(", ")}`);
      console.log(`  context: ${h.context}`);
    }
  }
  for (const c of fetchErrors) console.log(`ERROR: could not fetch ${c.name} — ${c.error}`);

  const ms = performance.now() - started;
  if (fetchErrors.length || routeErrors) {
    console.log(`\n[bundle] FAIL — ${fetchErrors.length} chunk(s) and ${routeErrors} route(s) could not be fetched (${ms.toFixed(0)} ms)`);
    process.exitCode = 1;
  } else if (violations.length && (!dev || strict)) {
    console.log(`\n[bundle] FAIL — ${violations.length} chunk(s) contain lazy-only library code (${ms.toFixed(0)} ms)`);
    process.exitCode = 1;
  } else if (violations.length) {
    console.log(`\n[bundle] INFO — ${violations.length} chunk(s) matched markers on a next dev server; dev chunks are not the production bundle. Re-run against \`pnpm build && pnpm start\` (or pass --strict) for a real verdict (${ms.toFixed(0)} ms)`);
    process.exitCode = 0;
  } else {
    console.log(`\n[bundle] PASS — no three.js / gsap / Lenis markers in the initial bundle of ${perRoute.size} route(s)${dev ? " (dev server — informational)" : ""} (${ms.toFixed(0)} ms)`);
    process.exitCode = 0;
  }
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((error: unknown) => {
    console.error(`[bundle] fatal: ${String(error)}`);
    process.exitCode = 1;
  });
}
