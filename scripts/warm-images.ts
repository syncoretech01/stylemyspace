/**
 * Warm every route and every next/image variant it references.
 *
 * next/image serves optimized files from /_next/image?url=…&w=…&q=…; the first request for a
 * given (url, w, q) is a cold resize (hundreds of ms for a 2400px master). Lighthouse must never
 * measure that, so this script requests every variant once before an audit.
 *
 *   pnpm tsx scripts/warm-images.ts [baseUrl] [--routes=/,/about] [--concurrency=4]
 *
 * Also exported as `warm(baseUrl, options)` for scripts/lighthouse.ts.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getQaRoutes, STATIC_EXTRAS } from "../qa/routes";

export type WarmOptions = {
  /** Routes to warm; defaults to every site route (the intentional 404 probe is excluded). */
  routes?: string[];
  /** Parallel image requests. Default 4. */
  concurrency?: number;
  /** Progress sink. Default console.log; pass () => {} to silence. */
  log?: (line: string) => void;
};

export type WarmedRoute = { route: string; status: number; ms: number; images: number };
export type WarmedImage = { url: string; status: number; ms: number; bytes: number; error?: string };

export type WarmResult = {
  baseUrl: string;
  /** True when the HTML came from `next dev` (HMR client present) rather than `next start`. */
  dev: boolean;
  routes: WarmedRoute[];
  images: WarmedImage[];
  failedRoutes: number;
  failedImages: number;
  ms: number;
};

/** Matches the /_next/image?… part of src/srcset/imagesrcset values (and the inline RSC payload). */
const IMAGE_URL_RE = /\/_next\/image\?[^\s"'<>,\\]+/g;

/** Site routes for QA minus the intentional 404 probe. */
export const siteRoutes = (): string[] => getQaRoutes().filter((r) => !STATIC_EXTRAS.includes(r));

/** `next dev` injects its HMR client and devtools chunks; `next start` never does. */
export const isNextDevHtml = (html: string): boolean => /hmr-client|next-devtools|_next\/static\/chunks\/%5Bturbopack%5D_browser_dev/.test(html);

/**
 * Every unique /_next/image URL in an HTML document. Handles `&amp;` (attributes) and `&`
 * (React's escaped inline RSC payload) so both spellings dedupe to the same request.
 */
export function extractImageUrls(html: string): string[] {
  const normalized = html.replace(/\\u0026/g, "&").replace(/&amp;|&#x26;|&#38;/gi, "&");
  const found = new Set<string>();
  for (const match of normalized.matchAll(IMAGE_URL_RE)) {
    const url = match[0];
    // Every optimizer request needs url, w and q; anything else is a truncated match.
    if (/[?&]url=/.test(url) && /[?&]w=\d+/.test(url) && /[?&]q=\d+/.test(url)) found.add(url);
  }
  return [...found];
}

const joinUrl = (baseUrl: string, pathname: string) => `${baseUrl.replace(/\/$/, "")}${pathname}`;

async function fetchText(url: string): Promise<{ status: number; text: string; ms: number }> {
  const started = performance.now();
  const res = await fetch(url, { headers: { accept: "text/html" }, signal: AbortSignal.timeout(120_000) });
  const text = await res.text();
  return { status: res.status, text, ms: performance.now() - started };
}

async function fetchImage(url: string): Promise<WarmedImage> {
  const started = performance.now();
  try {
    const res = await fetch(url, {
      headers: { accept: "image/webp,image/*,*/*;q=0.8" },
      signal: AbortSignal.timeout(120_000),
    });
    const bytes = (await res.arrayBuffer()).byteLength;
    return { url, status: res.status, ms: performance.now() - started, bytes };
  } catch (error) {
    return { url, status: 0, ms: performance.now() - started, bytes: 0, error: String(error) };
  }
}

/** Minimal worker pool: runs `fn` over `items` with at most `limit` in flight, preserving order. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index] as T, index);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return results;
}

export async function warm(baseUrl: string, options: WarmOptions = {}): Promise<WarmResult> {
  const log = options.log ?? console.log;
  const routes = options.routes ?? siteRoutes();
  const concurrency = options.concurrency ?? 4;
  const started = performance.now();

  const imageUrls = new Set<string>();
  const warmedRoutes: WarmedRoute[] = [];
  let dev = false;

  for (const route of routes) {
    const url = joinUrl(baseUrl, route);
    try {
      const { status, text, ms } = await fetchText(url);
      const urls = status < 400 ? extractImageUrls(text) : [];
      urls.forEach((u) => imageUrls.add(u));
      if (status < 400 && isNextDevHtml(text)) dev = true;
      warmedRoutes.push({ route, status, ms, images: urls.length });
      log(`[warm] ${status} ${route} — ${urls.length} image variant(s), ${ms.toFixed(0)} ms`);
    } catch (error) {
      warmedRoutes.push({ route, status: 0, ms: 0, images: 0 });
      log(`[warm] ERR ${route} — ${String(error)}`);
    }
  }

  const list = [...imageUrls];
  const images = await mapLimit(list, concurrency, async (u, i) => {
    const result = await fetchImage(joinUrl(baseUrl, u));
    const flag = result.status >= 200 && result.status < 400 ? "ok " : "ERR";
    log(`[warm] ${flag} image ${i + 1}/${list.length} ${result.status} ${result.ms.toFixed(0)} ms ${u}`);
    return result;
  });

  const ms = performance.now() - started;
  const failedRoutes = warmedRoutes.filter((r) => r.status === 0 || r.status >= 400).length;
  const failedImages = images.filter((i) => i.status === 0 || i.status >= 400).length;
  log(
    `[warm] done: ${routes.length} route(s) (${failedRoutes} failed), ${images.length} image variant(s) (${failedImages} failed) in ${ms.toFixed(0)} ms${dev ? " — next dev detected" : ""}`,
  );
  return { baseUrl, dev, routes: warmedRoutes, images, failedRoutes, failedImages, ms };
}

function parseArgs(argv: string[]) {
  let baseUrl = "http://localhost:3000";
  let routes: string[] | undefined;
  let concurrency = 4;
  for (const arg of argv) {
    if (arg.startsWith("--routes=")) routes = arg.slice("--routes=".length).split(",").map((s) => s.trim()).filter(Boolean);
    else if (arg.startsWith("--concurrency=")) concurrency = Math.max(1, Number(arg.slice("--concurrency=".length)) || 4);
    else if (arg.startsWith("--base-url=")) baseUrl = arg.slice("--base-url=".length);
    else if (!arg.startsWith("--")) baseUrl = arg;
    else throw new Error(`Unknown flag: ${arg}`);
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), routes, concurrency };
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const { baseUrl, routes, concurrency } = parseArgs(process.argv.slice(2));
  warm(baseUrl, { routes, concurrency })
    .then((result) => {
      process.exitCode = result.failedRoutes > 0 || result.failedImages > 0 ? 1 : 0;
    })
    .catch((error: unknown) => {
      console.error(`[warm] fatal: ${String(error)}`);
      process.exitCode = 1;
    });
}
