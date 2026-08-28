/**
 * Style My Space Design — Wix site scraper.
 *
 *   pnpm content:scrape [--only=slug,slug] [--skip-download] [--headed] [--channel=chrome]
 *
 * Extracts copy + image inventories from the live Wix site into content/scrape/pages/<slug>.json, downloads the
 * owner originals into content/raw/** and writes content/scrape/scrape-report.json. Nothing is fabricated: missing
 * content is logged, never invented. Wix stock media (11062b_/nsplsh_) is never downloaded.
 */
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { downloadFile, TerminalDownloadError, type DownloadResult } from "./lib/download";
import { createLogger, errorMessage } from "./lib/log";
import { pLimit, sleep } from "./lib/plimit";
import {
  classifyMediaUrl,
  findGalleryData,
  findWixSDKItems,
  parseWixImageSrc,
  type GalleryData,
  type MediaClassification,
  type WarmupGallery,
  type WixMedia,
} from "./lib/wix";

/* ------------------------------------------------------------------------------------------------ config */

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SITE = "https://www.stylemyspacedesign.com";
const SCRAPE_DIR = path.join(ROOT, "content", "scrape");
const PAGES_DIR = path.join(SCRAPE_DIR, "pages");
const RAW_DIR = path.join(ROOT, "content", "raw");
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";
const VIEWPORT = { width: 1440, height: 900 };
const TRACKER_HOSTS = ["google-analytics", "googletagmanager", "facebook.net", "hotjar", "clarity", "doubleclick"];
const PROJECT_SLUGS = [
  "oceanside",
  "las-olas",
  "aromatherapy-and-natural-elements",
  "wellness-space-with-city-view",
  "classroom-designs",
  "wellness-space-designs",
  "modern-interior-design",
] as const;
const PORTRAIT_MEDIA_ID = "6af838_4d01f15bb9ea4ccd89b8e4ad6b43b7a7";
const PLACEHOLDER_RE = /Create Your First Project|Manage Projects/i;
const DOWNLOAD_CONCURRENCY = 3;
const DOWNLOAD_DELAY_MS = 250;
const DOWNLOAD_TIMEOUT_MS = 180_000;
const PAGE_RETRIES = 2;

const log = createLogger("scrape");

/* ------------------------------------------------------------------------------------------------ CLI */

interface CliOptions {
  only: string[] | null;
  skipDownload: boolean;
  headed: boolean;
  channel: string | null;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { only: null, skipDownload: false, headed: false, channel: null };
  for (const arg of argv) {
    if (arg.startsWith("--only=")) {
      opts.only = arg
        .slice("--only=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg === "--skip-download") opts.skipDownload = true;
    else if (arg === "--headed") opts.headed = true;
    else if (arg.startsWith("--channel=")) opts.channel = arg.slice("--channel=".length) || null;
    else log.warn(`ignoring unknown argument ${arg}`);
  }
  return opts;
}

/* ------------------------------------------------------------------------------------------------ types */

type PageKind = "home" | "portfolio" | "blog" | "post" | "book-online" | "project";

interface PageTarget {
  slug: string;
  url: string;
  kind: PageKind;
}

/** Raw hit collected in the browser (one per element/attribute). */
interface DomImageHit {
  url: string;
  tag: string;
  attr: string;
  alt: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TextBlock {
  tag: string;
  text: string;
  y: number;
  inFooter: boolean;
  inHeader: boolean;
}

interface LinkRec {
  text: string;
  href: string;
}

interface BlogCard {
  title: string | null;
  href: string | null;
  excerpt: string | null;
  readTime: string | null;
  author: string | null;
  date: string | null;
  imageUrl: string | null;
}

interface ServiceCard {
  title: string | null;
  href: string | null;
  duration: string | null;
  price: string | null;
  priceSrOnly: string | null;
  details: string[];
  imageUrl: string | null;
}

interface PostBody {
  title: string | null;
  author: string | null;
  date: string | null;
  readTime: string | null;
  heroImageUrl: string | null;
  blocks: Array<{ tag: string; text: string }>;
  text: string;
}

interface DomText {
  title: string;
  canonical: string | null;
  lang: string | null;
  meta: {
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    publishedTime: string | null;
  };
  h1: string[];
  headings: TextBlock[];
  paragraphs: TextBlock[];
  textBlocks: TextBlock[];
  category: string | null;
  nav: LinkRec[];
  links: {
    mailto: string[];
    tel: string[];
    social: LinkRec[];
    internal: string[];
    external: string[];
  };
  blogCards: BlogCard[];
  serviceCards: ServiceCard[];
  hasPrevNext: { prev: boolean; next: boolean; prevHref: string | null; nextHref: string | null };
  post: PostBody | null;
  placeholderVisible: string[];
  documentHeight: number;
}

type ImageRole = "cover" | "gallery" | "portrait" | "blog-cover" | "page";
type ImageSource = "warmup" | "warmup+dom" | "dom-only";

interface DownloadInfo {
  path: string;
  bytes: number;
  sha1: string;
  width: number | null;
  height: number | null;
  format: string | null;
  orientation: number | null;
  skipped: boolean;
  attempts: number;
}

interface ImageRecord {
  index: number;
  mediaId: string;
  file: string;
  ext: string;
  sourceUrl: string;
  originalWidth: number | null;
  originalHeight: number | null;
  /** where originalWidth/Height came from */
  dimsSource: "warmup" | "file" | null;
  caption: string | null;
  description: string | null;
  alt: string | null;
  focalPoint: [number, number] | null;
  role: ImageRole;
  source: ImageSource;
  galleryCompId: string | null;
  domBeforeScroll: boolean;
  domAfterScroll: boolean;
  domY: number | null;
  /** post slug for blog covers */
  postSlug?: string;
  download: DownloadInfo | null;
  downloadError: string | null;
}

interface DomImageSummary {
  file: string;
  mediaId: string | null;
  kind: MediaClassification["kind"];
  reason: string;
  sourceUrl: string | null;
  firstSeen: "before" | "after";
  y: number | null;
  alt: string | null;
  sampleUrl: string;
  hits: number;
}

interface ExcludedRec {
  mediaId: string;
  reason: string;
  url: string;
}

interface WarmupGallerySummary {
  compId: string;
  jsonIndex: number;
  domY: number | null;
  itemCount: number;
  role: "cover" | "gallery" | "other";
}

interface PageExtraction {
  slug: string;
  url: string;
  finalUrl: string | null;
  kind: PageKind;
  status: number | null;
  attempts: number;
  ms: number;
  scrapedAt: string;
  error: string | null;
  text: DomText | null;
  description: { chosen: string | null; meta: string | null; matches: boolean | null; metaIsPrefix: boolean | null } | null;
  warmup: {
    present: boolean;
    galleries: WarmupGallerySummary[];
    galleryData: GalleryData[];
  };
  images: ImageRecord[];
  domImages: DomImageSummary[];
  ignoredUrls: { count: number; sample: string[] };
  excluded: ExcludedRec[];
  discrepancies: string[];
  failures: string[];
  counts: PageCounts;
  zeroImages: boolean;
  coverOnly: boolean;
}

interface PageCounts {
  warmup: number;
  domBefore: number;
  domAfter: number;
  unionOwner: number;
  downloaded: number;
  skippedUpToDate: number;
  failed: number;
}

interface ReportPage {
  url: string;
  slug: string;
  kind: PageKind;
  status: number | null;
  attempts: number;
  ms: number;
  error?: string;
  counts: PageCounts;
  discrepancies: string[];
  excluded: ExcludedRec[];
  failures: string[];
  zeroImages: boolean;
  coverOnly: boolean;
}

interface UnreferencedUpload {
  mediaId: string;
  file: string;
  fileName: string | null;
  width: number | null;
  height: number | null;
  galleryCompId: string;
  /** pages whose DOM/warmup referenced the file (none of them is a project page) */
  seenOnPages: string[];
}

/* ------------------------------------------------------------------------------------------------ in-browser functions */

/** Collect every candidate image URL in the DOM (runs inside the page). */
function collectDomImagesInPage(): DomImageHit[] {
  const out: DomImageHit[] = [];
  const push = (el: Element, url: string | null | undefined, attr: string) => {
    if (!url) return;
    const u = url.trim();
    if (!u || u.startsWith("data:") || u.startsWith("blob:")) return;
    const r = el.getBoundingClientRect();
    out.push({
      url: u,
      tag: el.tagName.toLowerCase(),
      attr,
      alt: el.getAttribute("alt"),
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
    });
  };
  // Wix transform paths contain commas ("w_39,h_39,al_c"), so only split at commas that start a new URL candidate.
  const srcsetUrls = (s: string | null): string[] =>
    (s ?? "")
      .split(/\s*,\s*(?=https?:\/\/|\/\/|\/|data:|blob:)/)
      .map((p) => p.trim().split(/\s+/)[0] ?? "")
      .filter(Boolean);
  const cssUrls = (s: string | null): string[] => {
    const res: string[] = [];
    const re = /url\(\s*(['"]?)(.*?)\1\s*\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s ?? "")) !== null) if (m[2]) res.push(m[2]);
    return res;
  };

  for (const img of Array.from(document.querySelectorAll("img"))) {
    push(img, img.currentSrc, "currentSrc");
    push(img, img.getAttribute("src"), "src");
    for (const u of srcsetUrls(img.getAttribute("srcset"))) push(img, u, "srcset");
    push(img, img.getAttribute("data-src"), "data-src");
    for (const u of srcsetUrls(img.getAttribute("data-srcset"))) push(img, u, "data-srcset");
  }
  for (const source of Array.from(document.querySelectorAll("picture > source"))) {
    for (const u of srcsetUrls(source.getAttribute("srcset"))) push(source, u, "source-srcset");
    for (const u of srcsetUrls(source.getAttribute("data-srcset"))) push(source, u, "source-data-srcset");
  }
  const all = Array.from(document.querySelectorAll<HTMLElement>("*"));
  for (const el of all) {
    const inline = el.getAttribute("style");
    if (inline && inline.includes("url(")) for (const u of cssUrls(inline)) push(el, u, "inline-background");
    const info = el.getAttribute("data-image-info");
    if (info) {
      try {
        const parsed = JSON.parse(info) as { imageData?: { uri?: string } };
        push(el, parsed.imageData?.uri, "data-image-info");
      } catch {
        /* ignore malformed json */
      }
    }
    const dataBg = el.getAttribute("data-bg");
    if (dataBg) push(el, dataBg, "data-bg");
    if (el.tagName !== "IMG" && el.tagName !== "SOURCE") {
      const ds = el.getAttribute("data-src");
      if (ds) push(el, ds, "data-src");
    }
  }
  if (all.length <= 8000) {
    for (const el of all) {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== "none" && bg.includes("url(")) for (const u of cssUrls(bg)) push(el, u, "computed-background");
    }
  }
  return out;
}

/** Extract visible copy + structured hooks (runs inside the page). */
function extractTextInPage(): DomText {
  const norm = (s: string | null | undefined): string => (s ?? "").replace(/\s+/g, " ").trim();
  const isVisible = (el: Element): boolean => {
    const h = el as HTMLElement;
    if (typeof h.checkVisibility === "function" && !h.checkVisibility({ checkVisibilityCSS: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const yOf = (el: Element): number => Math.round(el.getBoundingClientRect().top + window.scrollY);
  const inFooter = (el: Element): boolean => !!el.closest('footer, #SITE_FOOTER, #SITE_FOOTER_WRAPPER, [data-testid="site-footer"]');
  const inHeader = (el: Element): boolean => !!el.closest("header, #SITE_HEADER, #SITE_HEADER_WRAPPER");
  const metaContent = (sel: string): string | null => {
    const el = document.querySelector<HTMLMetaElement>(sel);
    const c = el?.getAttribute("content");
    return c ? norm(c) : null;
  };
  const block = (el: Element): TextBlock => ({ tag: el.tagName.toLowerCase(), text: norm(el.textContent), y: yOf(el), inFooter: inFooter(el), inHeader: inHeader(el) });

  const headingEls = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).filter((el) => isVisible(el) && norm(el.textContent));
  const paragraphEls = Array.from(document.querySelectorAll("p")).filter((el) => isVisible(el) && norm(el.textContent));
  const blockEls = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote")).filter((el) => isVisible(el) && norm(el.textContent));

  // Category: <h2>Project type</h2> followed by a <p>.
  let category: string | null = null;
  const typeHeading = headingEls.find((h) => /^project type$/i.test(norm(h.textContent)));
  if (typeHeading) {
    const follower = paragraphEls.find((p) => typeHeading.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING);
    category = follower ? norm(follower.textContent) : null;
  }

  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
  const nav: LinkRec[] = Array.from(document.querySelectorAll<HTMLAnchorElement>('header a[href], nav a[href], [role="navigation"] a[href]'))
    .filter(isVisible)
    .map((a) => ({ text: norm(a.textContent) || norm(a.getAttribute("aria-label")), href: a.href }));
  const links: DomText["links"] = { mailto: [], tel: [], social: [], internal: [], external: [] };
  const socialRe = /(facebook|instagram|linkedin|pinterest|tiktok|youtube|twitter|x\.com|houzz|yelp|threads\.net)/i;
  const seen = new Set<string>();
  for (const a of anchors) {
    const href = a.getAttribute("href") ?? "";
    if (!href) continue;
    if (href.startsWith("mailto:")) {
      links.mailto.push(href);
      continue;
    }
    if (href.startsWith("tel:")) {
      links.tel.push(href);
      continue;
    }
    let abs: URL;
    try {
      abs = new URL(a.href);
    } catch {
      continue;
    }
    if (abs.protocol !== "http:" && abs.protocol !== "https:") continue;
    if (abs.host === location.host) {
      const p = abs.pathname + abs.search;
      if (!seen.has(`i:${p}`)) {
        seen.add(`i:${p}`);
        links.internal.push(p);
      }
    } else if (socialRe.test(abs.host)) {
      if (!seen.has(`s:${abs.href}`)) {
        seen.add(`s:${abs.href}`);
        links.social.push({ text: norm(a.textContent) || norm(a.getAttribute("aria-label")), href: abs.href });
      }
    } else if (!seen.has(`e:${abs.href}`)) {
      seen.add(`e:${abs.href}`);
      links.external.push(abs.href);
    }
  }
  links.mailto = Array.from(new Set(links.mailto));
  links.tel = Array.from(new Set(links.tel));

  const q = (root: ParentNode, sel: string): Element | null => root.querySelector(sel);
  const txt = (root: ParentNode, sel: string): string | null => {
    const el = q(root, sel);
    return el ? norm(el.textContent) || null : null;
  };
  const imgSrc = (img: HTMLImageElement | null): string | null => (img ? img.currentSrc || img.getAttribute("src") || img.getAttribute("data-src") : null);
  const imgUrl = (root: ParentNode, sel: string): string | null => imgSrc(q(root, sel) as HTMLImageElement | null);
  /** First image that is Wix media (skips e.g. Google-hosted author avatars). */
  const wixImgUrl = (root: ParentNode, preferSel: string): string | null => {
    const preferred = imgSrc(q(root, preferSel) as HTMLImageElement | null);
    if (preferred) return preferred;
    for (const img of Array.from(root.querySelectorAll("img"))) {
      const u = imgSrc(img);
      if (u && /wixstatic\.com\/media\//.test(u)) return u;
    }
    for (const el of Array.from(root.querySelectorAll("[data-image-info]"))) {
      try {
        const uri = (JSON.parse(el.getAttribute("data-image-info") ?? "{}") as { imageData?: { uri?: string } }).imageData?.uri ?? "";
        if (/^[0-9a-f]{6}_[0-9a-f]{32}~mv2\.[a-z]+$/i.test(uri)) return "https://static.wixstatic.com/media/" + uri;
      } catch {
        /* ignore */
      }
    }
    return null;
  };
  /** Blog cards are rendered inside a Pro Gallery item: the cover <img> is a sibling of the card, not a child. */
  const blogCardCover = (card: Element, title: string | null): string | null => {
    const container = card.closest('[data-hook="item-container"]') ?? card.parentElement?.parentElement?.parentElement ?? card;
    const hit = wixImgUrl(container, 'img[data-hook="gallery-item-image-img"]');
    if (hit) return hit;
    if (title) {
      const byAlt = Array.from(document.querySelectorAll("img")).find((img) => norm(img.getAttribute("alt")) === title && /wixstatic\.com\/media\//.test(imgSrc(img) ?? ""));
      if (byAlt) return imgSrc(byAlt);
    }
    return null;
  };

  const blogCards: BlogCard[] = Array.from(document.querySelectorAll('[data-hook="post-list-item"]')).map((card) => {
    const link = (q(card, 'a[href*="/post/"]') as HTMLAnchorElement | null) ?? (q(card, '[data-hook="post-list-item__title"] a, a[data-hook="post-list-item__title"]') as HTMLAnchorElement | null);
    const title = txt(card, '[data-hook="post-list-item__title"]');
    return {
      title,
      href: link?.href ?? null,
      excerpt: txt(card, '[data-hook="post-description"]'),
      readTime: txt(card, '[data-hook="time-to-read"]'),
      author: txt(card, '[data-hook="user-name"]'),
      date: txt(card, '[data-hook="time-ago"]'),
      imageUrl: blogCardCover(card, title),
    };
  });

  const serviceCards: ServiceCard[] = Array.from(document.querySelectorAll('[data-hook="service-card-default-card"]')).map((card) => ({
    title: txt(card, '[data-hook="service-info-title-text"]'),
    href: (q(card, 'a[data-hook="service-info-title-link"], a[data-hook="layout-image-link"]') as HTMLAnchorElement | null)?.href ?? null,
    duration: txt(card, '[data-hook="details-root"][data-type="duration"]'),
    price: txt(card, '[data-hook="details-root"][data-type="price"]'),
    priceSrOnly: txt(card, '[data-hook="service-info-sr-only-price"]'),
    details: Array.from(card.querySelectorAll('[data-hook="details-root"]')).map((d) => norm(d.textContent)).filter(Boolean),
    imageUrl: imgUrl(card, "img"),
  }));

  const clickable = Array.from(document.querySelectorAll<HTMLElement>("a, button")).filter(isVisible);
  const findBtn = (re: RegExp) => clickable.find((el) => re.test(norm(el.textContent)) || re.test(norm(el.getAttribute("aria-label"))));
  const prevBtn = findBtn(/^(previous|prev)( project)?$/i);
  const nextBtn = findBtn(/^next( project)?$/i);
  const hrefOf = (el: HTMLElement | undefined): string | null => {
    const a = el?.closest("a");
    return a instanceof HTMLAnchorElement && a.href ? a.href : null;
  };
  const hasPrevNext = { prev: !!prevBtn, next: !!nextBtn, prevHref: hrefOf(prevBtn), nextHref: hrefOf(nextBtn) };

  let post: PostBody | null = null;
  const article = document.querySelector('[data-hook="post"]');
  if (article) {
    const heroRoot = q(article, '[data-hook="post-hero-image"]') ?? q(document, '[data-hook="post-hero-image"]');
    const heroUrl = heroRoot ? wixImgUrl(heroRoot, "img") : null;
    post = {
      title: txt(article, 'h1[data-hook="post-title"], [data-hook="post-title"]'),
      author: txt(article, '[data-hook="user-name"]') ?? txt(document, '[data-hook="user-name"]'),
      date: txt(article, '[data-hook="time-ago"]') ?? txt(document, '[data-hook="time-ago"]'),
      readTime: txt(article, '[data-hook="time-to-read"]') ?? txt(document, '[data-hook="time-to-read"]'),
      heroImageUrl: heroUrl,
      blocks: Array.from(article.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote"))
        .filter((el) => isVisible(el) && norm(el.textContent))
        .map((el) => ({ tag: el.tagName.toLowerCase(), text: norm(el.textContent) })),
      text: norm((article as HTMLElement).innerText),
    };
  }

  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null;
  const placeholderVisible = blockEls.map((el) => norm(el.textContent)).filter((t) => /Create Your First Project|Manage Projects/i.test(t));

  return {
    title: norm(document.title),
    canonical,
    lang: document.documentElement.getAttribute("lang"),
    meta: {
      description: metaContent('meta[name="description"]'),
      ogTitle: metaContent('meta[property="og:title"]'),
      ogDescription: metaContent('meta[property="og:description"]'),
      ogImage: metaContent('meta[property="og:image"]'),
      publishedTime: metaContent('meta[property="article:published_time"]'),
    },
    h1: headingEls.filter((h) => h.tagName === "H1").map((h) => norm(h.textContent)),
    headings: headingEls.map(block),
    paragraphs: paragraphEls.map(block),
    textBlocks: blockEls.map(block),
    category,
    nav,
    links,
    blogCards,
    serviceCards,
    hasPrevNext,
    post,
    placeholderVisible,
    documentHeight: document.documentElement.scrollHeight,
  };
}

/* ------------------------------------------------------------------------------------------------ browser helpers */

/**
 * Serialise a zero-arg function for page.evaluate. tsx/esbuild compiles with keepNames, which injects `__name(...)`
 * calls into function bodies; those would be undefined inside the browser, so we ship the source with a no-op shim.
 */
function inPage(fn: () => unknown): string {
  return `(() => { const __name = (target) => target; return (${fn.toString()})(); })()`;
}

class HttpStatusError extends Error {
  constructor(
    public readonly status: number,
    url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = "HttpStatusError";
  }
}

function isRetryableNavError(err: unknown): boolean {
  if (err instanceof HttpStatusError) return false;
  const msg = errorMessage(err);
  return /Timeout|net::ERR_|ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|Navigation failed|frame was detached|Target closed/i.test(msg);
}

async function dismissConsent(page: Page): Promise<boolean> {
  const candidates = [
    '[data-hook="consent-banner-apply-button"]',
    '[data-hook="consent-banner-accept-button"]',
    "#consent-banner-apply-button",
    'button:has-text("Accept All")',
    'button:has-text("Accept")',
    'button:has-text("Got it")',
    'button:has-text("Allow")',
  ];
  for (const sel of candidates) {
    const loc = page.locator(sel).first();
    try {
      if (await loc.isVisible({ timeout: 300 })) {
        await loc.click({ timeout: 2000 });
        await sleep(300);
        return true;
      }
    } catch {
      /* not present */
    }
  }
  return false;
}

async function autoScroll(page: Page): Promise<{ iterations: number; finalHeight: number }> {
  let stable = 0;
  let lastHeight = -1;
  let i = 0;
  for (; i < 80; i += 1) {
    const state = await page.evaluate(() => {
      window.scrollBy(0, Math.round(window.innerHeight * 0.8));
      return { height: document.documentElement.scrollHeight, y: window.scrollY, inner: window.innerHeight };
    });
    await sleep(400);
    const atBottom = state.y + state.inner >= state.height - 2;
    if (state.height === lastHeight && atBottom) stable += 1;
    else stable = 0;
    lastHeight = state.height;
    if (stable >= 2) break;
  }
  return { iterations: i + 1, finalHeight: lastHeight };
}

async function waitForWixImages(page: Page): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => Array.from(document.images).filter((img) => img.src.includes("wixstatic")).every((img) => img.complete),
      undefined,
      { timeout: 15_000 },
    );
    return true;
  } catch {
    return false;
  }
}

interface RawPageCapture {
  status: number;
  finalUrl: string;
  warmupJson: unknown | null;
  galleryY: Record<string, number | null>;
  domBefore: DomImageHit[];
  domAfter: DomImageHit[];
  text: DomText;
  consentDismissed: boolean;
  scroll: { iterations: number; finalHeight: number };
  imagesComplete: boolean;
}

async function capturePage(context: BrowserContext, target: PageTarget): Promise<RawPageCapture> {
  const page = await context.newPage();
  try {
    const response = await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    const status = response?.status() ?? 0;
    if (status >= 400) throw new HttpStatusError(status, target.url);
    if (!response) throw new Error(`no response for ${target.url}`);
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
    const consentDismissed = await dismissConsent(page);
    log.debug(`[${target.slug}] loaded (status ${status}, consent=${consentDismissed})`);

    const warmupText = await page.evaluate(() => document.getElementById("wix-warmup-data")?.textContent ?? null);
    let warmupJson: unknown | null = null;
    if (warmupText) {
      try {
        warmupJson = JSON.parse(warmupText);
      } catch (err) {
        log.warn(`[${target.slug}] warmup JSON failed to parse: ${errorMessage(err)}`);
      }
    }
    const galleries = warmupJson ? findWixSDKItems(warmupJson) : [];
    const galleryY = await page.evaluate((ids: string[]) => {
      const out: Record<string, number | null> = {};
      for (const id of ids) {
        const el = document.getElementById(`pro-gallery-${id}`) ?? document.getElementById(`pro-gallery-container-${id}`) ?? document.getElementById(id);
        out[id] = el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
      }
      return out;
    }, galleries.map((g) => g.compId));

    const domBefore = (await page.evaluate(inPage(collectDomImagesInPage))) as DomImageHit[];
    log.debug(`[${target.slug}] dom-before ${domBefore.length} hits; scrolling`);
    const scroll = await autoScroll(page);
    const imagesComplete = await waitForWixImages(page);
    log.debug(`[${target.slug}] scrolled ${scroll.iterations} steps; imagesComplete=${imagesComplete}`);
    const domAfter = (await page.evaluate(inPage(collectDomImagesInPage))) as DomImageHit[];
    const text = (await page.evaluate(inPage(extractTextInPage))) as DomText;
    log.debug(`[${target.slug}] dom-after ${domAfter.length} hits; text blocks ${text.textBlocks.length}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    return { status, finalUrl: page.url(), warmupJson, galleryY, domBefore, domAfter, text, consentDismissed, scroll, imagesComplete };
  } finally {
    await page.close().catch(() => undefined);
  }
}

/* ------------------------------------------------------------------------------------------------ reconciliation */

interface WarmupItem {
  media: WixMedia;
  originWidth: number | null;
  originHeight: number | null;
  caption: string | null;
  description: string | null;
  alt: string | null;
  focalPoint: [number, number] | null;
  role: "cover" | "gallery";
  compId: string;
}

function summariseDom(hits: DomImageHit[], firstSeen: "before" | "after", into: Map<string, DomImageSummary>, ignored: { count: number; sample: string[] }): void {
  for (const hit of hits) {
    const c = classifyMediaUrl(hit.url);
    if (!c.file) {
      ignored.count += 1;
      if (ignored.sample.length < 12 && !ignored.sample.includes(hit.url)) ignored.sample.push(hit.url.slice(0, 200));
      continue;
    }
    const existing = into.get(c.file);
    if (existing) {
      existing.hits += 1;
      if (existing.y === null || (hit.y > 0 && hit.y < existing.y)) existing.y = hit.y > 0 ? hit.y : existing.y;
      if (!existing.alt && hit.alt) existing.alt = hit.alt;
    } else {
      into.set(c.file, {
        file: c.file,
        mediaId: c.media?.mediaId ?? null,
        kind: c.kind,
        reason: c.reason,
        sourceUrl: c.media?.sourceUrl ?? null,
        firstSeen,
        y: hit.y > 0 ? hit.y : null,
        alt: hit.alt,
        sampleUrl: hit.url.slice(0, 300),
        hits: 1,
      });
    }
  }
}

function warmupItemsForProject(galleries: WarmupGallery[], galleryY: Record<string, number | null>, discrepancies: string[], slug: string): { items: WarmupItem[]; summaries: WarmupGallerySummary[] } {
  const ordered = [...galleries].sort((a, b) => {
    const ya = galleryY[a.compId];
    const yb = galleryY[b.compId];
    if (ya !== null && ya !== undefined && yb !== null && yb !== undefined && ya !== yb) return ya - yb;
    if ((ya === null || ya === undefined) !== (yb === null || yb === undefined)) return ya === null || ya === undefined ? 1 : -1;
    return a.jsonIndex - b.jsonIndex;
  });
  for (const g of ordered) if (galleryY[g.compId] === null || galleryY[g.compId] === undefined) discrepancies.push(`gallery ${g.compId} has no #pro-gallery element in the DOM; JSON order used`);

  const items: WarmupItem[] = [];
  const summaries: WarmupGallerySummary[] = [];
  ordered.forEach((g, gi) => {
    const role: WarmupGallerySummary["role"] = gi === 0 ? "cover" : "gallery";
    summaries.push({ compId: g.compId, jsonIndex: g.jsonIndex, domY: galleryY[g.compId] ?? null, itemCount: g.items.length, role });
    if (gi === 0 && g.items.length !== 1) discrepancies.push(`top-most gallery ${g.compId} has ${g.items.length} items (expected a 1-item cover gallery)`);
    g.items.forEach((raw, ii) => {
      if (raw.type && raw.type !== "image") {
        discrepancies.push(`warmup item ${g.compId}[${ii}] has type "${raw.type}" (skipped)`);
        return;
      }
      const parsed = raw.src ? parseWixImageSrc(raw.src) : null;
      if (!parsed) {
        discrepancies.push(`warmup item ${g.compId}[${ii}] has an unparseable src ${JSON.stringify(raw.src ?? null)}`);
        return;
      }
      const c = classifyMediaUrl(parsed.file);
      if (c.kind !== "owner" || !c.media) {
        discrepancies.push(`warmup item ${g.compId}[${ii}] ${parsed.file} excluded: ${c.reason}`);
        return;
      }
      const fp = raw.settings?.focalPoint;
      const focalPoint: [number, number] | null = Array.isArray(fp) && fp.length >= 2 && typeof fp[0] === "number" && typeof fp[1] === "number" ? [fp[0], fp[1]] : null;
      const title = (raw.title ?? "").trim();
      const alt = (raw.alt ?? "").trim();
      const description = (raw.description ?? "").trim();
      items.push({
        media: c.media,
        originWidth: parsed.originWidth,
        originHeight: parsed.originHeight,
        caption: title || alt || null,
        description: description || null,
        alt: alt || null,
        focalPoint,
        role: gi === 0 && ii === 0 ? "cover" : "gallery",
        compId: g.compId,
      });
    });
  });
  if (galleries.length === 0) discrepancies.push(`no wixSDKItems galleries found in warmup JSON for ${slug}`);
  return { items, summaries };
}

/* ------------------------------------------------------------------------------------------------ per-page pipeline */

interface PipelineContext {
  opts: CliOptions;
  context: BrowserContext;
  limit: <T>(fn: () => Promise<T>) => Promise<T>;
  /** owner mediaId → slugs of the pages whose DOM/warmup referenced it */
  seenOwnerIds: Map<string, Set<string>>;
}

async function scrapeTarget(px: PipelineContext, target: PageTarget): Promise<PageExtraction> {
  const started = Date.now();
  const scrapedAt = new Date().toISOString();
  const base: PageExtraction = {
    slug: target.slug,
    url: target.url,
    finalUrl: null,
    kind: target.kind,
    status: null,
    attempts: 0,
    ms: 0,
    scrapedAt,
    error: null,
    text: null,
    description: null,
    warmup: { present: false, galleries: [], galleryData: [] },
    images: [],
    domImages: [],
    ignoredUrls: { count: 0, sample: [] },
    excluded: [],
    discrepancies: [],
    failures: [],
    counts: { warmup: 0, domBefore: 0, domAfter: 0, unionOwner: 0, downloaded: 0, skippedUpToDate: 0, failed: 0 },
    zeroImages: true,
    coverOnly: false,
  };

  let capture: RawPageCapture | null = null;
  for (let attempt = 1; attempt <= PAGE_RETRIES + 1; attempt += 1) {
    base.attempts = attempt;
    try {
      log.info(`[${target.slug}] GET ${target.url} (attempt ${attempt})`);
      capture = await capturePage(px.context, target);
      break;
    } catch (err) {
      const msg = errorMessage(err);
      if (err instanceof HttpStatusError) {
        base.status = err.status;
        base.error = msg;
        log.error(`[${target.slug}] ${msg} (terminal)`);
        break;
      }
      if (attempt <= PAGE_RETRIES && isRetryableNavError(err)) {
        const delay = 2000 * attempt;
        log.warn(`[${target.slug}] ${msg} → retry in ${delay}ms`);
        await sleep(delay);
        continue;
      }
      base.error = msg;
      log.error(`[${target.slug}] ${msg}`);
      break;
    }
  }
  if (!capture) {
    base.ms = Date.now() - started;
    base.failures.push(base.error ?? "unknown failure");
    return base;
  }

  base.status = capture.status;
  base.finalUrl = capture.finalUrl;
  base.text = capture.text;
  if (capture.text.placeholderVisible.length > 0) base.discrepancies.push(`Wix editor placeholder text is VISIBLE: ${capture.text.placeholderVisible.join(" | ")}`);
  if (!capture.imagesComplete) base.discrepancies.push("not every wixstatic <img> reported complete within 15s after scrolling");
  log.debug(`[${target.slug}] scrolled ${capture.scroll.iterations} steps to ${capture.scroll.finalHeight}px, consent=${capture.consentDismissed}`);

  // DOM image summaries
  const domMap = new Map<string, DomImageSummary>();
  summariseDom(capture.domBefore, "before", domMap, base.ignoredUrls);
  const beforeFiles = new Set(domMap.keys());
  summariseDom(capture.domAfter, "after", domMap, base.ignoredUrls);
  base.domImages = Array.from(domMap.values()).sort((a, b) => (a.y ?? Infinity) - (b.y ?? Infinity));
  const afterFiles = new Set(capture.domAfter.map((h) => classifyMediaUrl(h.url).file).filter((f): f is string => !!f));
  base.counts.domBefore = beforeFiles.size;
  base.counts.domAfter = afterFiles.size;
  for (const d of base.domImages) {
    if (d.kind !== "owner") base.excluded.push({ mediaId: d.mediaId ?? d.file, reason: d.reason, url: d.sampleUrl });
  }

  // Warmup
  const galleries = capture.warmupJson ? findWixSDKItems(capture.warmupJson) : [];
  const galleryData = capture.warmupJson ? findGalleryData(capture.warmupJson) : [];
  base.warmup.present = capture.warmupJson !== null;
  base.warmup.galleryData = galleryData;

  const images: ImageRecord[] = [];
  const pushImage = (rec: Omit<ImageRecord, "index" | "download" | "downloadError">) => {
    images.push({ ...rec, index: images.length, download: null, downloadError: null });
  };
  const domFor = (mediaId: string): DomImageSummary | undefined => base.domImages.find((d) => d.mediaId === mediaId);
  const ownerDom = base.domImages.filter((d) => d.kind === "owner" && d.mediaId);

  if (target.kind === "project") {
    const { items, summaries } = warmupItemsForProject(galleries, capture.galleryY, base.discrepancies, target.slug);
    base.warmup.galleries = summaries;
    base.counts.warmup = items.length;
    const warmupIds = new Set<string>();
    for (const it of items) {
      if (warmupIds.has(it.media.mediaId)) {
        base.discrepancies.push(`duplicate warmup item ${it.media.mediaId} (kept first occurrence)`);
        continue;
      }
      warmupIds.add(it.media.mediaId);
      const dom = domFor(it.media.mediaId);
      if (!dom) base.discrepancies.push(`inWarmupNotDom: ${it.media.mediaId}`);
      pushImage({
        mediaId: it.media.mediaId,
        file: it.media.file,
        ext: it.media.ext,
        sourceUrl: it.media.sourceUrl,
        originalWidth: it.originWidth,
        originalHeight: it.originHeight,
        dimsSource: it.originWidth && it.originHeight ? "warmup" : null,
        caption: it.caption,
        description: it.description,
        alt: it.alt ?? dom?.alt ?? null,
        focalPoint: it.focalPoint,
        role: it.role,
        source: dom ? "warmup+dom" : "warmup",
        galleryCompId: it.compId,
        domBeforeScroll: beforeFiles.has(it.media.file),
        domAfterScroll: afterFiles.has(it.media.file),
        domY: dom?.y ?? null,
      });
    }
    for (const d of ownerDom) {
      if (!d.mediaId || warmupIds.has(d.mediaId)) continue;
      base.discrepancies.push(`inDomNotWarmup: ${d.mediaId} (y=${d.y ?? "?"}, alt=${JSON.stringify(d.alt)})`);
      pushImage({
        mediaId: d.mediaId,
        file: d.file,
        ext: d.file.split(".").pop()?.toLowerCase() ?? "",
        sourceUrl: d.sourceUrl ?? "",
        originalWidth: null,
        originalHeight: null,
        dimsSource: null,
        caption: d.alt?.trim() || null,
        description: null,
        alt: d.alt,
        focalPoint: null,
        role: "gallery",
        source: "dom-only",
        galleryCompId: null,
        domBeforeScroll: beforeFiles.has(d.file),
        domAfterScroll: afterFiles.has(d.file),
        domY: d.y,
      });
    }
    base.coverOnly = images.length === 1 && images[0]?.role === "cover";

    // Description = longest visible non-footer <p>, cross-checked with meta description.
    const candidates = capture.text.paragraphs.filter((p) => !p.inFooter && !p.inHeader && !PLACEHOLDER_RE.test(p.text));
    const chosen = candidates.reduce<TextBlock | null>((best, p) => (best === null || p.text.length > best.text.length ? p : best), null);
    const meta = capture.text.meta.description;
    const squash = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
    const matches = chosen && meta ? squash(chosen.text) === squash(meta) : null;
    const metaIsPrefix = chosen && meta && !matches ? squash(chosen.text).startsWith(squash(meta).replace(/[.…]+$/, "")) : null;
    base.description = { chosen: chosen?.text ?? null, meta, matches, metaIsPrefix };
    if (chosen && meta && !matches) base.discrepancies.push(`descriptionVsMeta: visible description ${metaIsPrefix ? "extends" : "differs from"} meta description`);
    if (!chosen) base.discrepancies.push("no visible non-footer paragraph found for the description");
    if (!capture.text.category) base.discrepancies.push("no <h2>Project type</h2> + <p> category on the page");
  } else if (target.kind === "home") {
    base.counts.warmup = galleryData.reduce((n, g) => n + g.items.length, 0);
    for (const d of ownerDom) {
      if (!d.mediaId) continue;
      const isPortrait = d.mediaId === PORTRAIT_MEDIA_ID || /portrait/i.test(d.alt ?? "");
      pushImage({
        mediaId: d.mediaId,
        file: d.file,
        ext: d.file.split(".").pop()?.toLowerCase() ?? "",
        sourceUrl: d.sourceUrl ?? "",
        originalWidth: null,
        originalHeight: null,
        dimsSource: null,
        caption: d.alt?.trim() || null,
        description: null,
        alt: d.alt,
        focalPoint: null,
        role: isPortrait ? "portrait" : "page",
        source: "dom-only",
        galleryCompId: null,
        domBeforeScroll: beforeFiles.has(d.file),
        domAfterScroll: afterFiles.has(d.file),
        domY: d.y,
      });
    }
    if (!images.some((i) => i.role === "portrait")) base.discrepancies.push(`designer portrait ${PORTRAIT_MEDIA_ID} not found in the home DOM`);
    for (const g of galleryData) {
      if (g.totalItemsCount !== null && g.totalItemsCount !== g.items.length) {
        base.discrepancies.push(`gallery ${g.compId} warmup lists ${g.items.length} of totalItemsCount=${g.totalItemsCount} items`);
      }
    }
  } else if (target.kind === "blog" || target.kind === "post") {
    // Blog covers: from the post cards (blog index) or the hero/og image (post page).
    const covers: Array<{ mediaId: string; postSlug: string; url: string }> = [];
    if (target.kind === "blog") {
      for (const card of capture.text.blogCards) {
        const postSlug = card.href ? new URL(card.href).pathname.split("/").filter(Boolean).pop() ?? "" : "";
        const c = card.imageUrl ? classifyMediaUrl(card.imageUrl) : null;
        if (c?.kind === "owner" && c.media && postSlug) covers.push({ mediaId: c.media.mediaId, postSlug, url: card.imageUrl ?? "" });
        else base.discrepancies.push(`blog card ${JSON.stringify(card.title)} has no owner cover image (${card.imageUrl ?? "none"})`);
      }
      if (capture.text.blogCards.length === 0) base.discrepancies.push("no [data-hook=post-list-item] cards found on /blog");
    } else {
      const postSlug = target.slug.replace(/^post-/, "");
      const heroUrl = capture.text.post?.heroImageUrl ?? capture.text.meta.ogImage;
      const c = heroUrl ? classifyMediaUrl(heroUrl) : null;
      if (c?.kind === "owner" && c.media) covers.push({ mediaId: c.media.mediaId, postSlug, url: heroUrl ?? "" });
      else base.discrepancies.push(`post has no owner hero/og image (${heroUrl ?? "none"})`);
      if (!capture.text.post) base.discrepancies.push("no [data-hook=post] article body found");
    }
    const coverIds = new Set(covers.map((c) => c.mediaId));
    for (const cover of covers) {
      const d = domFor(cover.mediaId);
      const c = classifyMediaUrl(cover.url);
      if (!c.media) continue;
      pushImage({
        mediaId: c.media.mediaId,
        file: c.media.file,
        ext: c.media.ext,
        sourceUrl: c.media.sourceUrl,
        originalWidth: null,
        originalHeight: null,
        dimsSource: null,
        caption: d?.alt?.trim() || null,
        description: null,
        alt: d?.alt ?? null,
        focalPoint: null,
        role: "blog-cover",
        source: "dom-only",
        galleryCompId: null,
        domBeforeScroll: beforeFiles.has(c.media.file),
        domAfterScroll: afterFiles.has(c.media.file),
        domY: d?.y ?? null,
        postSlug: cover.postSlug,
      });
    }
    for (const d of ownerDom) {
      if (!d.mediaId || coverIds.has(d.mediaId)) continue;
      pushImage({
        mediaId: d.mediaId,
        file: d.file,
        ext: d.file.split(".").pop()?.toLowerCase() ?? "",
        sourceUrl: d.sourceUrl ?? "",
        originalWidth: null,
        originalHeight: null,
        dimsSource: null,
        caption: d.alt?.trim() || null,
        description: null,
        alt: d.alt,
        focalPoint: null,
        role: "page",
        source: "dom-only",
        galleryCompId: null,
        domBeforeScroll: beforeFiles.has(d.file),
        domAfterScroll: afterFiles.has(d.file),
        domY: d.y,
      });
    }
  } else {
    // portfolio / book-online: record every owner image seen, download nothing.
    base.counts.warmup = galleries.reduce((n, g) => n + g.items.length, 0) + galleryData.reduce((n, g) => n + g.items.length, 0);
    for (const d of ownerDom) {
      if (!d.mediaId) continue;
      pushImage({
        mediaId: d.mediaId,
        file: d.file,
        ext: d.file.split(".").pop()?.toLowerCase() ?? "",
        sourceUrl: d.sourceUrl ?? "",
        originalWidth: null,
        originalHeight: null,
        dimsSource: null,
        caption: d.alt?.trim() || null,
        description: null,
        alt: d.alt,
        focalPoint: null,
        role: "page",
        source: "dom-only",
        galleryCompId: null,
        domBeforeScroll: beforeFiles.has(d.file),
        domAfterScroll: afterFiles.has(d.file),
        domY: d.y,
      });
    }
    if (target.kind === "book-online" && capture.text.serviceCards.length === 0) base.discrepancies.push("no [data-hook=service-card-default-card] elements found on /book-online");
  }

  base.images = images;
  const markSeen = (id: string) => {
    const set = px.seenOwnerIds.get(id) ?? new Set<string>();
    set.add(target.slug);
    px.seenOwnerIds.set(id, set);
  };
  for (const img of images) markSeen(img.mediaId);
  for (const d of ownerDom) if (d.mediaId) markSeen(d.mediaId);
  base.counts.unionOwner = new Set([...images.map((i) => i.mediaId), ...ownerDom.map((d) => d.mediaId ?? "")].filter(Boolean)).size;
  base.zeroImages = images.length === 0;

  // Downloads
  if (!px.opts.skipDownload) {
    const jobs = images.filter((img) => {
      if (target.kind === "project") return true;
      if (target.kind === "home") return img.role === "portrait";
      if (target.kind === "blog" || target.kind === "post") return img.role === "blog-cover";
      return false;
    });
    await Promise.all(
      jobs.map((img) =>
        px.limit(async () => {
          const dest = destinationFor(target, img);
          try {
            const res = await downloadFile(img.sourceUrl, dest, { timeoutMs: DOWNLOAD_TIMEOUT_MS, log });
            applyDownload(base, img, res);
            if (res.skipped) base.counts.skippedUpToDate += 1;
            else base.counts.downloaded += 1;
            log.info(`[${target.slug}] ${res.skipped ? "up-to-date" : "downloaded"} ${path.relative(ROOT, dest)} (${res.bytes} bytes, ${res.probe.width}x${res.probe.height})`);
          } catch (err) {
            const msg = errorMessage(err);
            img.downloadError = msg;
            base.counts.failed += 1;
            base.failures.push(`${img.mediaId}: ${msg}${err instanceof TerminalDownloadError ? " (terminal)" : ""}`);
            log.error(`[${target.slug}] download failed ${img.sourceUrl}: ${msg}`);
          }
          await sleep(DOWNLOAD_DELAY_MS);
        }),
      ),
    );
  }

  base.ms = Date.now() - started;
  return base;
}

function destinationFor(target: PageTarget, img: ImageRecord): string {
  if (target.kind === "project") return path.join(RAW_DIR, target.slug, `${String(img.index).padStart(2, "0")}-${img.mediaId}.${img.ext}`);
  if (target.kind === "home") return path.join(RAW_DIR, "site", `portrait-${img.mediaId}.${img.ext}`);
  return path.join(RAW_DIR, "blog", `${img.postSlug ?? target.slug.replace(/^post-/, "")}-${img.mediaId}.${img.ext}`);
}

function applyDownload(page: PageExtraction, img: ImageRecord, res: DownloadResult): void {
  img.download = {
    path: path.relative(ROOT, res.path),
    bytes: res.bytes,
    sha1: res.sha1,
    width: res.probe.width,
    height: res.probe.height,
    format: res.probe.format,
    orientation: res.probe.orientation,
    skipped: res.skipped,
    attempts: res.attempts,
  };
  const w = res.probe.width;
  const h = res.probe.height;
  if (w && h) {
    const rotated = res.probe.orientation !== null && res.probe.orientation >= 5;
    const fw = rotated ? h : w;
    const fh = rotated ? w : h;
    if (img.originalWidth && img.originalHeight) {
      const same = (img.originalWidth === w && img.originalHeight === h) || (img.originalWidth === fw && img.originalHeight === fh);
      if (!same) page.discrepancies.push(`dimsMismatch: ${img.mediaId} warmup ${img.originalWidth}x${img.originalHeight} vs file ${w}x${h}${rotated ? ` (EXIF orientation ${res.probe.orientation})` : ""}`);
    } else {
      img.originalWidth = w;
      img.originalHeight = h;
      img.dimsSource = "file";
    }
  } else {
    page.discrepancies.push(`sharp could not read dimensions of ${img.mediaId} (${img.download.path})`);
  }
  if (res.probe.format && res.probe.format !== (img.ext === "jpg" ? "jpeg" : img.ext)) {
    page.discrepancies.push(`formatMismatch: ${img.mediaId} extension .${img.ext} but sharp reports ${res.probe.format}`);
  }
}

/* ------------------------------------------------------------------------------------------------ sitemap + discovery */

interface SitemapCheck {
  url: string;
  ok: boolean;
  error: string | null;
  sitemapSlugs: string[];
  expectedSlugs: string[];
  missingFromSitemap: string[];
  extraInSitemap: string[];
  orderMatches: boolean | null;
}

async function checkSitemap(): Promise<SitemapCheck> {
  const url = `${SITE}/portfolio-projects-sitemap.xml`;
  const expected = [...PROJECT_SLUGS];
  const out: SitemapCheck = { url, ok: false, error: null, sitemapSlugs: [], expectedSlugs: expected, missingFromSitemap: [], extraInSitemap: [], orderMatches: null };
  try {
    const res = await fetch(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const locs = Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)).map((m) => m[1] ?? "");
    out.sitemapSlugs = locs
      .filter((l) => l.includes("/portfolio-collections/my-portfolio/"))
      .map((l) => l.split("/").filter(Boolean).pop() ?? "")
      .filter(Boolean);
    out.missingFromSitemap = expected.filter((s) => !out.sitemapSlugs.includes(s));
    out.extraInSitemap = out.sitemapSlugs.filter((s) => !expected.includes(s as (typeof PROJECT_SLUGS)[number]));
    out.orderMatches = out.sitemapSlugs.join(",") === expected.join(",");
    out.ok = out.missingFromSitemap.length === 0 && out.extraInSitemap.length === 0;
  } catch (err) {
    out.error = errorMessage(err);
  }
  return out;
}

/** Discover /post/<slug> links from the blog index without a browser (used when /blog itself is filtered out). */
async function discoverPostsViaFetch(): Promise<string[]> {
  try {
    const res = await fetch(`${SITE}/blog`, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(45_000) });
    if (!res.ok) return [];
    const html = await res.text();
    const hrefs = Array.from(html.matchAll(/href="(https?:\/\/www\.stylemyspacedesign\.com\/post\/[^"?#]+)"/g)).map((m) => m[1] ?? "");
    return Array.from(new Set(hrefs));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------------------------------------ main */

async function launchBrowser(opts: CliOptions): Promise<Browser> {
  const launch = () => chromium.launch({ headless: !opts.headed, channel: opts.channel ?? undefined });
  try {
    return await launch();
  } catch (err) {
    log.warn(`chromium launch failed (${errorMessage(err)}); trying "pnpm exec playwright install chromium" once`);
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync("pnpm", ["exec", "playwright", "install", "chromium"], { cwd: ROOT, stdio: "inherit" });
    if (r.status !== 0) throw new Error(`playwright install chromium exited with ${r.status}`);
    return launch();
  }
}

function readPkgVersion(name: string): string | null {
  try {
    const p = path.join(ROOT, "node_modules", name, "package.json");
    return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as { version?: string }).version ?? null : null;
  } catch {
    return null;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main(): Promise<number> {
  const opts = parseArgs(process.argv.slice(2));
  const wanted = (slug: string) => opts.only === null || opts.only.includes(slug);
  const startedAt = new Date();
  log.info(`scrape start ${startedAt.toISOString()} only=${opts.only?.join(",") ?? "(all)"} skipDownload=${opts.skipDownload}`);

  await mkdir(PAGES_DIR, { recursive: true });
  await mkdir(RAW_DIR, { recursive: true });

  const sitemapCheck = await checkSitemap();
  if (sitemapCheck.error) log.warn(`sitemap check failed: ${sitemapCheck.error}`);
  else if (!sitemapCheck.ok || !sitemapCheck.orderMatches) log.warn(`sitemap mismatch: missing=${sitemapCheck.missingFromSitemap.join(",")} extra=${sitemapCheck.extraInSitemap.join(",")} order=${sitemapCheck.orderMatches}`);
  else log.info(`sitemap check ok: ${sitemapCheck.sitemapSlugs.length} projects, order matches`);

  const browser = await launchBrowser(opts);
  const chromiumVersion = browser.version();
  const context = await browser.newContext({ userAgent: USER_AGENT, viewport: VIEWPORT, locale: "en-US", deviceScaleFactor: 1 });
  await context.route("**/*", (route) => {
    const host = (() => {
      try {
        return new URL(route.request().url()).hostname;
      } catch {
        return "";
      }
    })();
    if (TRACKER_HOSTS.some((t) => host.includes(t))) return route.abort();
    return route.continue();
  });

  const px: PipelineContext = { opts, context, limit: pLimit(DOWNLOAD_CONCURRENCY), seenOwnerIds: new Map() };
  const results: PageExtraction[] = [];
  const filesWritten: string[] = [];

  const targets: PageTarget[] = [
    { slug: "home", url: `${SITE}/`, kind: "home" },
    { slug: "portfolio", url: `${SITE}/portfolio`, kind: "portfolio" },
    { slug: "blog", url: `${SITE}/blog`, kind: "blog" },
  ];

  const runTarget = async (t: PageTarget): Promise<PageExtraction | null> => {
    if (!wanted(t.slug)) return null;
    const res = await scrapeTarget(px, t);
    results.push(res);
    const file = path.join(PAGES_DIR, `${t.slug}.json`);
    await writeJson(file, res);
    filesWritten.push(path.relative(ROOT, file));
    return res;
  };

  try {
    let postUrls: string[] = [];
    for (const t of targets) {
      const res = await runTarget(t);
      if (t.kind === "blog" && res?.text) postUrls = res.text.blogCards.map((c) => c.href).filter((h): h is string => !!h);
    }
    if (postUrls.length === 0 && (opts.only === null || opts.only.some((s) => s.startsWith("post-")))) {
      postUrls = await discoverPostsViaFetch();
      if (postUrls.length === 0) log.warn("no blog posts discovered");
    }
    const postTargets: PageTarget[] = Array.from(new Set(postUrls)).map((href) => {
      const slug = new URL(href).pathname.split("/").filter(Boolean).pop() ?? "";
      return { slug: `post-${slug}`, url: `${SITE}/post/${slug}`, kind: "post" };
    });
    for (const t of postTargets) await runTarget(t);
    await runTarget({ slug: "book-online", url: `${SITE}/book-online`, kind: "book-online" });
    for (const slug of PROJECT_SLUGS) await runTarget({ slug, url: `${SITE}/portfolio-collections/my-portfolio/${slug}`, kind: "project" });
  } finally {
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }

  // Unreferenced uploads: media-manager items listed in the home warmup gallery data that no project page uses.
  // (The live "Our Recent Projects" slider on the home page cycles through them, so `seenOnPages` records that.)
  const home = results.find((r) => r.kind === "home");
  const projectSlugs = new Set<string>(PROJECT_SLUGS);
  const unreferencedUploads: UnreferencedUpload[] = [];
  if (home) {
    for (const g of home.warmup.galleryData) {
      for (const it of g.items) {
        const c = it.mediaUrl ? classifyMediaUrl(it.mediaUrl) : null;
        if (!c?.media || c.kind !== "owner") continue;
        const seenOn = Array.from(px.seenOwnerIds.get(c.media.mediaId) ?? []);
        if (seenOn.some((slug) => projectSlugs.has(slug))) continue;
        if (unreferencedUploads.some((u) => u.mediaId === c.media?.mediaId)) continue;
        unreferencedUploads.push({ mediaId: c.media.mediaId, file: c.media.file, fileName: it.fileName, width: it.width, height: it.height, galleryCompId: g.compId, seenOnPages: seenOn });
      }
    }
  }

  const projectPages = results.filter((r) => r.kind === "project");
  const totals = {
    pages: results.length,
    pagesOk: results.filter((r) => r.status !== null && r.status < 400 && !r.error).length,
    pagesFailed: results.filter((r) => r.status === null || r.status >= 400 || !!r.error).length,
    projectImages: projectPages.reduce((n, r) => n + r.images.length, 0),
    portrait: results.some((r) => r.kind === "home" && r.images.some((i) => i.role === "portrait" && (opts.skipDownload || i.download !== null))),
    blogCovers: new Set(results.filter((r) => r.kind === "blog" || r.kind === "post").flatMap((r) => r.images.filter((i) => i.role === "blog-cover").map((i) => i.mediaId))).size,
    downloaded: results.reduce((n, r) => n + r.counts.downloaded, 0),
    skippedUpToDate: results.reduce((n, r) => n + r.counts.skippedUpToDate, 0),
    downloadFailures: results.reduce((n, r) => n + r.counts.failed, 0),
    excluded: results.reduce((n, r) => n + r.excluded.length, 0),
    discrepancies: results.reduce((n, r) => n + r.discrepancies.length, 0),
  };

  // Cross-check the /portfolio grid order (cover mediaId → project slug) against the brief and the sitemap.
  const portfolio = results.find((r) => r.kind === "portfolio");
  const coverToSlug = new Map<string, string>();
  for (const r of projectPages) {
    const cover = r.images.find((i) => i.role === "cover");
    if (cover) coverToSlug.set(cover.mediaId, r.slug);
  }
  const portfolioOrder = portfolio ? portfolio.images.map((i) => coverToSlug.get(i.mediaId) ?? `?${i.mediaId}`) : null;
  const sitemapCheckWithPortfolio = {
    ...sitemapCheck,
    portfolioOrder,
    portfolioMatchesExpected: portfolioOrder ? portfolioOrder.join(",") === PROJECT_SLUGS.join(",") : null,
  };
  const report = {
    generatedAt: new Date().toISOString(),
    source: SITE,
    args: opts,
    versions: { node: process.version, playwright: readPkgVersion("playwright"), chromium: chromiumVersion, sharp: readPkgVersion("sharp") },
    pages: results.map<ReportPage>((r) => ({
      url: r.url,
      slug: r.slug,
      kind: r.kind,
      status: r.status,
      attempts: r.attempts,
      ms: r.ms,
      ...(r.error ? { error: r.error } : {}),
      counts: r.counts,
      discrepancies: r.discrepancies,
      excluded: r.excluded,
      failures: r.failures,
      zeroImages: r.zeroImages,
      coverOnly: r.coverOnly,
    })),
    totals,
    unreferencedUploads,
    sitemapCheck: sitemapCheckWithPortfolio,
    filesWritten,
  };
  const reportFile = path.join(SCRAPE_DIR, "scrape-report.json");
  await writeJson(reportFile, report);

  console.table(
    results.map((r) => ({
      slug: r.slug,
      status: r.status,
      tries: r.attempts,
      ms: r.ms,
      warmup: r.counts.warmup,
      domBefore: r.counts.domBefore,
      domAfter: r.counts.domAfter,
      images: r.images.length,
      dl: r.counts.downloaded,
      skip: r.counts.skippedUpToDate,
      fail: r.counts.failed,
      excl: r.excluded.length,
      disc: r.discrepancies.length,
    })),
  );
  log.info(`totals: ${JSON.stringify(totals)}`);
  log.info(`unreferenced uploads: ${unreferencedUploads.length}; report → ${path.relative(ROOT, reportFile)}`);

  const failed = totals.pagesFailed > 0 || totals.downloadFailures > 0;
  if (failed) log.error(`FAILED: ${totals.pagesFailed} page(s), ${totals.downloadFailures} download(s)`);
  return failed ? 1 : 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    log.error(`fatal: ${errorMessage(err)}`);
    if (err instanceof Error && err.stack) console.error(err.stack);
    process.exitCode = 1;
  });
