/**
 * Streaming, idempotent, retrying file download (Node fetch → temp file → atomic rename).
 * - Retries on network errors / 5xx (delays configurable); 403/404 (any 4xx) are terminal.
 * - Verifies the byte count against Content-Length when the server sends one.
 * - Idempotent: when the destination exists with the expected size (HEAD probe) the download is skipped.
 * - After download: sharp metadata (real width/height/format/orientation) + sha1.
 */
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import sharp from "sharp";
import { errorMessage, type Logger } from "./log";

export interface DownloadOptions {
  /** overall per-attempt timeout (AbortSignal.timeout) */
  timeoutMs?: number;
  /** backoff delays between attempts; length = number of retries */
  retryDelaysMs?: number[];
  headers?: Record<string, string>;
  log?: Logger;
}

export interface ImageProbe {
  width: number | null;
  height: number | null;
  format: string | null;
  /** EXIF orientation (1 = normal) when present */
  orientation: number | null;
}

export interface DownloadResult {
  url: string;
  path: string;
  bytes: number;
  sha1: string;
  skipped: boolean;
  attempts: number;
  contentLength: number | null;
  probe: ImageProbe;
}

export class TerminalDownloadError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
  ) {
    super(message);
    this.name = "TerminalDownloadError";
  }
}

const DEFAULT_DELAYS = [1000, 3000, 9000];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function sha1File(file: string): Promise<string> {
  const hash = createHash("sha1");
  for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

export async function probeImage(file: string): Promise<ImageProbe> {
  try {
    const meta = await sharp(file, { limitInputPixels: false }).metadata();
    return {
      width: meta.width ?? null,
      height: meta.height ?? null,
      format: meta.format ?? null,
      orientation: meta.orientation ?? null,
    };
  } catch {
    return { width: null, height: null, format: null, orientation: null };
  }
}

async function headContentLength(url: string, headers: Record<string, string>, timeoutMs: number): Promise<number | null> {
  try {
    const res = await fetch(url, { method: "HEAD", headers, signal: AbortSignal.timeout(timeoutMs), redirect: "follow" });
    if (!res.ok) return null;
    const len = Number(res.headers.get("content-length"));
    return Number.isFinite(len) && len > 0 ? len : null;
  } catch {
    return null;
  }
}

async function fileSize(file: string): Promise<number | null> {
  try {
    const s = await stat(file);
    return s.isFile() ? s.size : null;
  } catch {
    return null;
  }
}

export async function downloadFile(url: string, dest: string, opts: DownloadOptions = {}): Promise<DownloadResult> {
  const timeoutMs = opts.timeoutMs ?? 180_000;
  const delays = opts.retryDelaysMs ?? DEFAULT_DELAYS;
  const headers = { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36", accept: "image/*,*/*;q=0.8", ...opts.headers };
  const log = opts.log;

  await mkdir(path.dirname(dest), { recursive: true });

  // Idempotency: existing file whose size matches the CDN's Content-Length is considered up to date.
  const existing = await fileSize(dest);
  if (existing !== null && existing > 0) {
    const expected = await headContentLength(url, headers, Math.min(timeoutMs, 30_000));
    if (expected !== null && expected === existing) {
      const [sha1, probe] = await Promise.all([sha1File(dest), probeImage(dest)]);
      log?.debug(`up to date: ${path.basename(dest)} (${existing} bytes)`);
      return { url, path: dest, bytes: existing, sha1, skipped: true, attempts: 0, contentLength: expected, probe };
    }
    if (expected !== null) log?.warn(`size mismatch for existing ${path.basename(dest)}: have ${existing}, CDN says ${expected} → re-downloading`);
  }

  const tmp = `${dest}.part-${process.pid}-${Date.now()}`;
  let attempt = 0;
  let lastErr: unknown = null;
  const maxAttempts = delays.length + 1;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs), redirect: "follow" });
      if (res.status >= 400 && res.status < 500) {
        throw new TerminalDownloadError(`HTTP ${res.status} for ${url}`, res.status);
      }
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status} (retryable) for ${url}`);
      }
      const lenHeader = Number(res.headers.get("content-length"));
      const contentLength = Number.isFinite(lenHeader) && lenHeader > 0 ? lenHeader : null;

      const hash = createHash("sha1");
      let bytes = 0;
      await pipeline(
        Readable.fromWeb(res.body as unknown as NodeReadableStream<Uint8Array>),
        async function* (source) {
          for await (const chunk of source) {
            const buf = chunk as Buffer;
            bytes += buf.length;
            hash.update(buf);
            yield buf;
          }
        },
        createWriteStream(tmp),
      );
      if (contentLength !== null && bytes !== contentLength) {
        throw new Error(`short read: got ${bytes} of ${contentLength} bytes for ${url}`);
      }
      if (bytes === 0) throw new Error(`empty body for ${url}`);
      await rename(tmp, dest);
      const probe = await probeImage(dest);
      return { url, path: dest, bytes, sha1: hash.digest("hex"), skipped: false, attempts: attempt, contentLength, probe };
    } catch (err) {
      await rm(tmp, { force: true }).catch(() => undefined);
      if (err instanceof TerminalDownloadError) throw err;
      lastErr = err;
      const delay = delays[attempt - 1];
      if (delay === undefined) break;
      log?.warn(`attempt ${attempt}/${maxAttempts} failed for ${url}: ${errorMessage(err)} → retry in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new Error(`download failed after ${attempt} attempts: ${url} (${errorMessage(lastErr)})`);
}
