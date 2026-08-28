/**
 * Wix media helpers: URL normalisation, owner allow-listing and warmup-JSON walking.
 *
 * Facts (verified against the live site):
 * - Originals live at https://static.wixstatic.com/media/<file>; resized variants append "/v1/<transform>/<name>".
 * - <file> = /^[0-9a-f]{6}_[0-9a-f]{32}~mv2\.(jpe?g|png|gif|webp)$/i. The extension must be preserved byte-for-byte
 *   (.jpeg vs .jpg is a 403 on this CDN).
 * - Owner uploads start with "6af838_". Wix stock starts with "11062b_" / "nsplsh_". Social icons / Wix assets are
 *   bare 32-hex names without the "~mv2" form and fall out of the strict regex.
 */

export const WIX_MEDIA_BASE = "https://static.wixstatic.com/media/";
export const OWNER_PREFIX = "6af838_";
export const STOCK_PREFIXES = ["11062b_", "nsplsh_"] as const;

export const WIX_FILE_RE = /^([0-9a-f]{6}_[0-9a-f]{32})~mv2\.(jpe?g|png|gif|webp)$/i;

export interface WixMedia {
  /** e.g. "6af838_4d01f15bb9ea4ccd89b8e4ad6b43b7a7" (no ~mv2) */
  mediaId: string;
  /** e.g. "6af838_4d01f15bb9ea4ccd89b8e4ad6b43b7a7~mv2.jpeg" */
  file: string;
  /** extension exactly as the CDN serves it: jpg | jpeg | png | gif | webp (lower-cased) */
  ext: string;
  /** https://static.wixstatic.com/media/<file> */
  sourceUrl: string;
}

export type MediaKind = "owner" | "stock" | "non-owner" | "unparseable";

export interface MediaClassification {
  kind: MediaKind;
  reason: string;
  /** the raw file segment we extracted (if any) */
  file: string | null;
  media: WixMedia | null;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Extract the media file segment from any wixstatic URL / wix:image URI / bare uri. Returns null when not Wix media. */
export function extractWixFileSegment(rawUrl: string): string | null {
  const url = safeDecode(rawUrl.trim());
  // wix:image://v1/<file>/<name>#originWidth=..&originHeight=..
  const wixImage = url.match(/^wix:image:\/\/v1\/([^/?#]+)/i);
  if (wixImage?.[1]) return wixImage[1];
  // https://static.wixstatic.com/media/<file>[/v1/...]
  const cdn = url.match(/(?:^|\/\/)(?:[a-z0-9-]+\.)?wixstatic\.com\/media\/([^/?#]+)/i);
  if (cdn?.[1]) return cdn[1];
  // bare uri as found in data-image-info JSON ("6af838_...~mv2.jpg")
  if (/^[0-9a-f]{6}_[0-9a-f]{32}(~mv2)?\.[a-z0-9]+$/i.test(url) || /^[0-9a-f]{32}\.[a-z0-9]+$/i.test(url)) return url;
  return null;
}

/** Parse a file segment into the original-URL record; null when it is not in the strict ~mv2 form. */
export function parseWixFile(file: string): WixMedia | null {
  const m = file.match(WIX_FILE_RE);
  if (!m) return null;
  const mediaId = m[1] ?? "";
  const ext = (m[2] ?? "").toLowerCase();
  // Keep the extension byte-for-byte as it appeared (only the case is normalised for `ext`).
  return { mediaId, file, ext, sourceUrl: WIX_MEDIA_BASE + file };
}

export function classifyMediaUrl(rawUrl: string): MediaClassification {
  const file = extractWixFileSegment(rawUrl);
  if (!file) return { kind: "unparseable", reason: "not a wixstatic media URL", file: null, media: null };
  const media = parseWixFile(file);
  if (!media) {
    const stock = STOCK_PREFIXES.find((p) => file.toLowerCase().startsWith(p));
    if (stock) return { kind: "stock", reason: `Wix stock media (${stock} prefix)`, file, media: null };
    if (/^[0-9a-f]{32}\.[a-z0-9]+$/i.test(file)) {
      return { kind: "unparseable", reason: "bare 32-hex Wix asset without ~mv2 form (social icon / system asset)", file, media: null };
    }
    if (/^[0-9a-f-]{36}$/i.test(file)) {
      return { kind: "unparseable", reason: "uuid-style Wix media reference without a downloadable original", file, media: null };
    }
    return { kind: "unparseable", reason: "file segment does not match the ~mv2 pattern", file, media: null };
  }
  const lower = media.mediaId.toLowerCase();
  const stock = STOCK_PREFIXES.find((p) => lower.startsWith(p));
  if (stock) return { kind: "stock", reason: `Wix stock media (${stock} prefix)`, file, media };
  if (!lower.startsWith(OWNER_PREFIX)) return { kind: "non-owner", reason: `media id prefix is not the owner prefix ${OWNER_PREFIX}`, file, media };
  return { kind: "owner", reason: "owner upload", file, media };
}

/* ------------------------------------------------------------------------------------------------ warmup JSON */

export interface WixSDKItemRaw {
  type?: string;
  title?: string;
  alt?: string;
  description?: string;
  src?: string;
  settings?: { focalPoint?: [number, number] | number[] };
}

export interface WarmupGallery {
  /** the JSON key that held `wixSDKItems`, e.g. "comp-m4bme0db_r_comp-l2erre7s_r_comp-l0p8zeaz3" */
  compId: string;
  /** JSON path for debugging */
  path: string;
  /** order of appearance while walking the JSON */
  jsonIndex: number;
  items: WixSDKItemRaw[];
}

export interface WarmupImageSrc {
  file: string;
  originWidth: number | null;
  originHeight: number | null;
}

/** Parse "wix:image://v1/<file>/<name>#originWidth=W&originHeight=H". */
export function parseWixImageSrc(src: string): WarmupImageSrc | null {
  const file = extractWixFileSegment(src);
  if (!file) return null;
  const hash = src.split("#")[1] ?? "";
  const params = new URLSearchParams(hash);
  const w = Number(params.get("originWidth"));
  const h = Number(params.get("originHeight"));
  return {
    file,
    originWidth: Number.isFinite(w) && w > 0 ? w : null,
    originHeight: Number.isFinite(h) && h > 0 ? h : null,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Recursively find every array named `wixSDKItems`; the containing key is the gallery compId. */
export function findWixSDKItems(root: unknown): WarmupGallery[] {
  const out: WarmupGallery[] = [];
  const walk = (node: unknown, path: string, parentKey: string | null): void => {
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`, parentKey));
      return;
    }
    if (!isRecord(node)) return;
    for (const [k, v] of Object.entries(node)) {
      if (k === "wixSDKItems" && Array.isArray(v)) {
        out.push({ compId: parentKey ?? "(root)", path: `${path}.${k}`, jsonIndex: out.length, items: v as WixSDKItemRaw[] });
      }
      walk(v, `${path}.${k}`, k);
    }
  };
  walk(root, "$", null);
  return out;
}

export interface GalleryDataItem {
  itemId: string | null;
  mediaUrl: string | null;
  fileName: string | null;
  title: string | null;
  description: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
}

export interface GalleryData {
  compId: string;
  path: string;
  totalItemsCount: number | null;
  items: GalleryDataItem[];
}

/** Find Pro Gallery `*_galleryData` blobs (used by the home page "Our Recent Projects" gallery). */
export function findGalleryData(root: unknown): GalleryData[] {
  const out: GalleryData[] = [];
  const walk = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    if (!isRecord(node)) return;
    for (const [k, v] of Object.entries(node)) {
      if (k.endsWith("_galleryData") && isRecord(v) && Array.isArray(v.items)) {
        const items: GalleryDataItem[] = v.items.map((it: unknown) => {
          const rec = isRecord(it) ? it : {};
          const meta = isRecord(rec.metaData) ? rec.metaData : {};
          const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);
          const str = (x: unknown) => (typeof x === "string" ? x : null);
          return {
            itemId: str(rec.itemId),
            mediaUrl: str(rec.mediaUrl),
            fileName: str(meta.fileName),
            title: str(meta.title),
            description: str(meta.description),
            alt: str(meta.alt),
            width: num(meta.width),
            height: num(meta.height),
          };
        });
        out.push({ compId: k.replace(/_galleryData$/, ""), path: `${path}.${k}`, totalItemsCount: typeof v.totalItemsCount === "number" ? v.totalItemsCount : null, items });
      }
      walk(v, `${path}.${k}`);
    }
  };
  walk(root, "$");
  return out;
}
