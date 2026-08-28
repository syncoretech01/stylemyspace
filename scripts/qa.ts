/**
 * Visual / runtime QA harness for Style My Space Design.
 *
 *   pnpm qa [--base-url=http://localhost:3000] [--routes=/,/about] [--viewports=1440,390]
 *           [--serve] [--skip-focus] [--concurrency=3] [--run=<name>] [--channel=chrome]
 *
 * Plain `playwright` library (not the test runner). Every route × viewport gets a FRESH browser
 * context (empty sessionStorage ⇒ the preloader runs), the page is scrolled in 100vh jumps so
 * every scroll-triggered reveal fires, and the end state is probed for stuck (still hidden)
 * elements, horizontal overflow and keyboard focus. Then 1440 + 390 are repeated with
 * `reducedMotion: 'reduce'` where everything must be visible on first paint.
 *
 * Outputs: qa/screenshots/<run>/<routeSlug>/<viewport>[-rm]/… PNGs, qa/report.json, qa/report.md
 * (+ qa/contact-sheets/<run>/ when scripts/contact-sheet.ts exists). Exit code 1 on any FAIL.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { z } from "zod";
import { getQaRoutes } from "../qa/routes";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Level = "fail" | "warn" | "info";

interface Issue {
  kind: string;
  level: Level;
  text: string;
  url?: string;
  status?: number;
  /** Set when a qa/allowlist.json entry suppressed this issue (the entry's reason). */
  allowlisted?: string;
}

interface Job {
  route: string;
  slug: string;
  viewport: number;
  height: number;
  rm: boolean;
  focus: boolean;
  column: string;
}

interface FocusStop {
  index: number;
  tag: string;
  id: string | null;
  label: string;
  isSkipLink: boolean;
  /** Next.js dev-tools overlay (<nextjs-portal>) — present only under `next dev`, never graded. */
  devOverlay: boolean;
  focusVisible: boolean;
  outline: string;
  boxShadow: string;
  rect: { x: number; y: number; w: number; h: number };
  screenshot: string | null;
}

interface RouteResult {
  route: string;
  slug: string;
  viewport: number;
  height: number;
  reducedMotion: boolean;
  column: string;
  status: "PASS" | "WARN" | "FAIL";
  documentStatus: number | null;
  expectedDocumentStatus: number;
  motionTier: string | null;
  issues: Issue[];
  /** Issues matched by an allowlist entry (echoed, never counted). */
  suppressed: Issue[];
  stuckFirstPaint: string[];
  stuckEndState: string[];
  scrollSteps: number;
  focusStops: number;
  screenshots: {
    dir: string;
    fullInitial: string | null;
    fullRevealed: string | null;
    scroll: string[];
    focus: string[];
    focusOrder: string | null;
  };
  timings: { gotoMs: number; preloaderMs: number; scrollMs: number; focusMs: number; totalMs: number };
}

interface Report {
  run: string;
  baseUrl: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  columns: string[];
  routes: string[];
  summary: { pass: number; warn: number; fail: number; total: number };
  allowlist: AllowEntry[];
  allowlistHits: { entry: AllowEntry; count: number }[];
  results: RouteResult[];
  contactSheets: string[];
  notes: string[];
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const QA_DIR = path.join(ROOT, "qa");

const VIEWPORT_HEIGHTS: Record<number, number> = { 1920: 1080, 1440: 900, 1024: 768, 768: 1024, 390: 844 };
const DEFAULT_VIEWPORTS = [1920, 1440, 1024, 768, 390];
const RM_VIEWPORTS = [1440, 390];
const FOCUS_VIEWPORT = 1440;
const MAX_TABS = 120;
const MAX_SCROLL_STEPS = 60;
const EXPECTED_STATUS: Record<string, number> = { "/this-page-does-not-exist": 404 };

const AllowEntrySchema = z.object({
  kind: z.string().min(1),
  urlPattern: z.string().optional(),
  textPattern: z.string().optional(),
  reason: z.string().min(1),
});
type AllowEntry = z.infer<typeof AllowEntrySchema>;
const AllowlistSchema = z.object({ entries: z.array(AllowEntrySchema) }).passthrough();

// ----------------------------------------------------------------------------
// CLI
// ----------------------------------------------------------------------------

interface Options {
  baseUrl: string;
  routes: string[] | null;
  viewports: number[];
  serve: boolean;
  skipFocus: boolean;
  concurrency: number;
  run: string;
  channel: string | null;
}

function parseArgs(argv: string[]): Options {
  const flags = new Map<string, string>();
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const eq = arg.indexOf("=");
    if (eq === -1) flags.set(arg.slice(2), "true");
    else flags.set(arg.slice(2, eq), arg.slice(eq + 1));
  }
  const viewports = flags.has("viewports")
    ? flags
        .get("viewports")!
        .split(",")
        .map((v) => Number.parseInt(v.trim(), 10))
        .filter((v) => Number.isFinite(v) && v > 0)
    : DEFAULT_VIEWPORTS;
  const routes = flags.has("routes")
    ? flags
        .get("routes")!
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => (r.startsWith("/") ? r : `/${r}`))
    : null;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return {
    baseUrl: (flags.get("base-url") ?? "http://localhost:3000").replace(/\/+$/, ""),
    routes,
    viewports,
    serve: flags.get("serve") === "true",
    skipFocus: flags.get("skip-focus") === "true",
    concurrency: Math.max(1, Number.parseInt(flags.get("concurrency") ?? "3", 10) || 3),
    run: (flags.get("run") ?? stamp).replace(/[^\w.-]+/g, "-"),
    channel: flags.get("channel") ?? null,
  };
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function routeSlug(route: string): string {
  if (route === "/") return "home";
  const cleaned = route.replace(/^\/+|\/+$/g, "").replace(/\//g, "__");
  return cleaned.replace(/[^\w.-]+/g, "-") || "home";
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function rel(p: string) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function truncate(s: string, n: number) {
  const one = s.replace(/\s+/g, " ").trim();
  return one.length > n ? `${one.slice(0, n - 1)}…` : one;
}

async function loadAllowlist(): Promise<AllowEntry[]> {
  const file = path.join(QA_DIR, "allowlist.json");
  if (!(await exists(file))) return [];
  const parsed = AllowlistSchema.safeParse(JSON.parse(await readFile(file, "utf8")));
  if (!parsed.success) {
    throw new Error(`qa/allowlist.json is invalid:\n${parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`);
  }
  for (const e of parsed.data.entries) {
    // Fail fast on bad regexes rather than silently matching nothing.
    if (e.urlPattern) new RegExp(e.urlPattern);
    if (e.textPattern) new RegExp(e.textPattern);
  }
  return parsed.data.entries;
}

function matchAllow(issue: Issue, entries: AllowEntry[]): AllowEntry | null {
  for (const e of entries) {
    if (e.kind !== issue.kind && e.kind !== "*") continue;
    if (e.urlPattern && !(issue.url && new RegExp(e.urlPattern).test(issue.url))) continue;
    if (e.textPattern && !new RegExp(e.textPattern).test(issue.text)) continue;
    return e;
  }
  return null;
}

// ----------------------------------------------------------------------------
// Optional `next start` server
// ----------------------------------------------------------------------------

function portInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(true));
    srv.once("listening", () => srv.close(() => resolve(false)));
    srv.listen(port, "127.0.0.1");
  });
}

async function waitForHttp(url: string, timeoutMs: number): Promise<void> {
  const started = Date.now();
  let lastErr = "";
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 500) return;
      lastErr = `HTTP ${res.status}`;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }
    await sleep(500);
  }
  throw new Error(`Server at ${url} did not come up within ${timeoutMs}ms (${lastErr})`);
}

async function startServer(baseUrl: string): Promise<ChildProcess> {
  const port = Number(new URL(baseUrl).port || 3000);
  if (await portInUse(port)) {
    throw new Error(`--serve: port ${port} is already in use. Stop the other server or drop --serve and pass --base-url.`);
  }
  if (!(await exists(path.join(ROOT, ".next", "BUILD_ID")))) {
    throw new Error("--serve: no production build found (.next/BUILD_ID missing). Run `pnpm build` first.");
  }
  const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env: { ...process.env, NODE_ENV: "production" },
  });
  child.stdout?.on("data", (d: Buffer) => process.stdout.write(`[next start] ${d}`));
  child.stderr?.on("data", (d: Buffer) => process.stderr.write(`[next start] ${d}`));
  await waitForHttp(baseUrl + "/", 60_000);
  console.log(`[qa] next start ready on ${baseUrl}`);
  return child;
}

function stopServer(child: ChildProcess | null) {
  if (!child || child.killed || child.exitCode !== null) return;
  try {
    if (child.pid) process.kill(-child.pid, "SIGTERM");
    else child.kill("SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

// ----------------------------------------------------------------------------
// In-page probes (kept as standalone functions so they serialize cleanly)
// ----------------------------------------------------------------------------

function jumpTo(y: number) {
  const w = window as unknown as {
    __lenis?: { scrollTo(target: number, opts: { immediate: boolean; force: boolean }): void };
  };
  w.__lenis?.scrollTo(y, { immediate: true, force: true });
  window.scrollTo({ top: y, behavior: "instant" });
}

/** Elements inside <main> larger than 40×20 that are still invisible. Children of a flagged ancestor are folded. */
function stuckProbe(): string[] {
  const main = document.querySelector("main");
  if (!main) return [];
  const flagged = new Set<Element>();
  const out: string[] = [];
  for (const el of Array.from(main.querySelectorAll("*"))) {
    const parent = el.parentElement;
    if (parent && flagged.has(parent)) {
      flagged.add(el);
      continue;
    }
    const r = el.getBoundingClientRect();
    if (r.width <= 40 || r.height <= 20) continue;
    const cs = getComputedStyle(el);
    if (cs.opacity === "0" || cs.visibility === "hidden") {
      flagged.add(el);
      if (out.length < 20) {
        const cls = el.classList.length ? `.${Array.from(el.classList).slice(0, 4).join(".")}` : "";
        const id = el.id ? `#${el.id}` : "";
        out.push(`${el.tagName.toLowerCase()}${id}${cls} (${Math.round(r.width)}×${Math.round(r.height)})`);
      }
    }
  }
  return out;
}

function overflowProbe(): { docScrollWidth: number; bodyScrollWidth: number; innerWidth: number } {
  return {
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    innerWidth: window.innerWidth,
  };
}

function countFocusables(): number {
  const all = Array.from(
    document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, summary, [tabindex], [contenteditable=true]"),
  );
  return all.filter((el) => {
    if (el.tabIndex < 0) return false;
    if ((el as HTMLButtonElement).disabled) return false;
    if (el.closest("[hidden], [inert]")) return false;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  }).length;
}

function readActiveElement(): Omit<FocusStop, "screenshot"> | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body || el === document.documentElement) return null;
  const ds = el.dataset;
  let index: number;
  if (ds.qaFocusIndex !== undefined) {
    index = Number(ds.qaFocusIndex);
  } else {
    const w = window as unknown as { __qaFocusCounter?: number };
    w.__qaFocusCounter = (w.__qaFocusCounter ?? 0) + 1;
    index = w.__qaFocusCounter;
    ds.qaFocusIndex = String(index);
  }
  el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  const cs = getComputedStyle(el);
  const outlineVisible = cs.outlineStyle !== "none" && Number.parseFloat(cs.outlineWidth) > 0;
  const shadowVisible = cs.boxShadow !== "none" && cs.boxShadow !== "";
  const labels = (el as HTMLInputElement).labels;
  const label =
    el.getAttribute("aria-label") ||
    (labels && labels.length ? (labels[0]?.textContent ?? "").replace(/\s+/g, " ").trim() : "") ||
    (el.textContent ?? "").replace(/\s+/g, " ").trim() ||
    el.getAttribute("title") ||
    (el as HTMLInputElement).placeholder ||
    (el as HTMLInputElement).name ||
    "";
  const r = el.getBoundingClientRect();
  return {
    index,
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    label: label.length > 40 ? `${label.slice(0, 39)}…` : label,
    isSkipLink: el.matches('a[href="#main"], .skip-link'),
    devOverlay: el.tagName.toLowerCase() === "nextjs-portal",
    focusVisible: outlineVisible || shadowVisible,
    outline: outlineVisible ? `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}` : "none",
    boxShadow: shadowVisible ? cs.boxShadow : "none",
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
  };
}

// ----------------------------------------------------------------------------
// One route × viewport × mode
// ----------------------------------------------------------------------------

async function runJob(browser: Browser, job: Job, opts: Options, allow: AllowEntry[], runDir: string): Promise<RouteResult> {
  const t0 = Date.now();
  const dir = path.join(runDir, job.slug, job.column);
  await mkdir(dir, { recursive: true });
  const issues: Issue[] = [];
  const result: RouteResult = {
    route: job.route,
    slug: job.slug,
    viewport: job.viewport,
    height: job.height,
    reducedMotion: job.rm,
    column: job.column,
    status: "PASS",
    documentStatus: null,
    expectedDocumentStatus: EXPECTED_STATUS[job.route] ?? 200,
    motionTier: null,
    issues,
    suppressed: [],
    stuckFirstPaint: [],
    stuckEndState: [],
    scrollSteps: 0,
    focusStops: 0,
    screenshots: { dir: rel(dir), fullInitial: null, fullRevealed: null, scroll: [], focus: [], focusOrder: null },
    timings: { gotoMs: 0, preloaderMs: 0, scrollMs: 0, focusMs: 0, totalMs: 0 },
  };
  const push = (i: Issue) => issues.push(i);

  const context: BrowserContext = await browser.newContext({
    viewport: { width: job.viewport, height: job.height },
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: job.rm ? "reduce" : "no-preference",
    locale: "en-US",
  });
  const page: Page = await context.newPage();
  page.setDefaultTimeout(20_000);
  const target = opts.baseUrl + job.route;

  page.on("console", (msg) => {
    const type = msg.type();
    if (type !== "error" && type !== "warning") return;
    const loc = msg.location();
    const text = msg.text();
    // Chromium logs "Failed to load resource: … 404" for the intentional 404 document itself.
    const expectedFailure =
      type === "error" &&
      result.expectedDocumentStatus !== 200 &&
      loc.url === target &&
      new RegExp(`status of ${result.expectedDocumentStatus}\\b`).test(text);
    push({
      kind: expectedFailure ? "console-expected-status" : type === "error" ? "console-error" : "console-warning",
      level: expectedFailure ? "info" : type === "error" ? "fail" : "warn",
      text,
      url: loc.url ? `${loc.url}:${loc.lineNumber + 1}:${loc.columnNumber + 1}` : undefined,
    });
  });
  page.on("pageerror", (err) => push({ kind: "pageerror", level: "fail", text: `${err.name}: ${err.message}` }));
  page.on("requestfailed", (req) => {
    const errText = req.failure()?.errorText ?? "unknown";
    const aborted = /ERR_ABORTED/.test(errText);
    push({
      kind: aborted ? "request-aborted" : "request-failed",
      level: aborted ? "info" : "fail",
      text: `${req.method()} ${req.resourceType()} → ${errText}`,
      url: req.url(),
    });
  });
  page.on("response", (res) => {
    const status = res.status();
    if (status < 400) return;
    const req = res.request();
    const isOwnDocument = req.isNavigationRequest() && req.frame() === page.mainFrame() && res.url() === target;
    if (isOwnDocument && status === result.expectedDocumentStatus) return;
    push({ kind: "http-status", level: "fail", text: `${req.method()} ${req.resourceType()} returned ${status}`, url: res.url(), status });
  });

  try {
    // 1. Navigate
    const tGoto = Date.now();
    const response = await page.goto(target, { waitUntil: "load", timeout: 45_000 });
    result.documentStatus = response?.status() ?? null;
    result.timings.gotoMs = Date.now() - tGoto;
    if (result.documentStatus !== result.expectedDocumentStatus) {
      push({
        kind: "unexpected-status",
        level: "fail",
        text: `Document responded ${result.documentStatus ?? "no response"}; expected ${result.expectedDocumentStatus}`,
        url: target,
        status: result.documentStatus ?? undefined,
      });
    }
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {
      push({ kind: "networkidle-timeout", level: "info", text: "Network did not go idle within 10s (soft wait)" });
    });

    // 2. Preloader + fonts + two frames
    const tPre = Date.now();
    await page
      .waitForFunction(() => document.documentElement.dataset.preloaderDone === "true", null, { timeout: 10_000 })
      .catch(() => push({ kind: "preloader-timeout", level: "fail", text: 'html[data-preloader-done="true"] not set within 10s' }));
    result.timings.preloaderMs = Date.now() - tPre;
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    });
    result.motionTier = await page.evaluate(() => document.documentElement.dataset.motion ?? null);
    if (job.rm && result.motionTier !== "reduced") {
      push({ kind: "motion-tier", level: "fail", text: `html[data-motion] is "${result.motionTier}" under prefers-reduced-motion; expected "reduced"` });
    }
    if (!job.rm && result.motionTier === null) {
      push({ kind: "motion-tier", level: "warn", text: "html[data-motion] is not set (inline head script did not run?)" });
    }

    // 3. First-paint capture
    const fullInitial = path.join(dir, "full-initial.png");
    await page.screenshot({ path: fullInitial, fullPage: true, timeout: 30_000 });
    result.screenshots.fullInitial = rel(fullInitial);
    if (job.rm) {
      result.stuckFirstPaint = await page.evaluate(stuckProbe);
      if (result.stuckFirstPaint.length) {
        push({
          kind: "rm-hidden-first-paint",
          level: "fail",
          text: `Reduced motion: ${result.stuckFirstPaint.length} element(s) hidden on first paint: ${result.stuckFirstPaint.slice(0, 5).join("; ")}`,
        });
      }
    }

    // 4. Scroll pass in 100vh steps
    const tScroll = Date.now();
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const maxY = Math.max(0, scrollHeight - job.height);
    const ys: number[] = [];
    for (let y = 0; y < maxY && ys.length < MAX_SCROLL_STEPS; y += job.height) ys.push(y);
    if (ys[ys.length - 1] !== maxY && ys.length < MAX_SCROLL_STEPS) ys.push(maxY);
    if (ys.length === 0) ys.push(0);
    for (let i = 0; i < ys.length; i += 1) {
      await page.evaluate(jumpTo, ys[i]!);
      await sleep(600);
      const file = path.join(dir, `scroll-${pad2(i + 1)}.png`);
      await page.screenshot({ path: file, fullPage: false, timeout: 30_000 });
      result.screenshots.scroll.push(rel(file));
    }
    result.scrollSteps = ys.length;
    await page.evaluate(jumpTo, 0);
    await sleep(400);
    const fullRevealed = path.join(dir, "full-revealed.png");
    await page.screenshot({ path: fullRevealed, fullPage: true, timeout: 30_000 });
    result.screenshots.fullRevealed = rel(fullRevealed);
    result.timings.scrollMs = Date.now() - tScroll;

    // 5. End-state probes
    result.stuckEndState = await page.evaluate(stuckProbe);
    if (result.stuckEndState.length) {
      push({
        kind: "stuck-end-state",
        level: "warn",
        text: `${result.stuckEndState.length} element(s) still hidden after the scroll pass: ${result.stuckEndState.slice(0, 5).join("; ")}`,
      });
    }
    const ov = await page.evaluate(overflowProbe);
    if (ov.docScrollWidth > ov.innerWidth + 1 || ov.bodyScrollWidth > ov.innerWidth + 1) {
      push({
        kind: "horizontal-overflow",
        level: "fail",
        text: `Horizontal overflow: documentElement.scrollWidth=${ov.docScrollWidth}, body.scrollWidth=${ov.bodyScrollWidth}, innerWidth=${ov.innerWidth}`,
      });
    }

    // 6. Focus pass (1440, motion mode only)
    if (job.focus) {
      const tFocus = Date.now();
      const stops = await focusPass(page, dir, result, push);
      result.focusStops = stops.length;
      const focusOrderFile = path.join(dir, "focus-order.json");
      await writeFile(focusOrderFile, JSON.stringify({ route: job.route, viewport: job.viewport, stops }, null, 2));
      result.screenshots.focusOrder = rel(focusOrderFile);
      result.timings.focusMs = Date.now() - tFocus;
    }
  } catch (err) {
    push({ kind: "script-error", level: "fail", text: `QA script error: ${err instanceof Error ? err.message : String(err)}` });
  } finally {
    await context.close().catch(() => {});
  }

  // Allowlist + status
  const kept: Issue[] = [];
  for (const issue of issues) {
    const entry = matchAllow(issue, allow);
    if (entry) result.suppressed.push({ ...issue, allowlisted: entry.reason });
    else kept.push(issue);
  }
  result.issues = kept;
  result.status = kept.some((i) => i.level === "fail") ? "FAIL" : kept.some((i) => i.level === "warn") ? "WARN" : "PASS";
  result.timings.totalMs = Date.now() - t0;
  return result;
}

async function focusPass(page: Page, dir: string, result: RouteResult, push: (i: Issue) => void): Promise<FocusStop[]> {
  const stops: FocusStop[] = [];
  const focusableCount = await page.evaluate(countFocusables);
  const every = focusableCount > 40 ? 5 : 1;
  // Start from a neutral spot: click nothing, just make sure the document has focus.
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  let sawBody = false;
  for (let i = 0; i < MAX_TABS; i += 1) {
    await page.keyboard.press("Tab");
    await sleep(120);
    const info = await page.evaluate(readActiveElement);
    if (!info) {
      if (sawBody) {
        // Two consecutive Tabs on <body>: focus is genuinely lost.
        push({ kind: "focus-lost", level: "fail", text: `Focus fell to <body> after stop ${stops.length} and did not return to the document` });
        break;
      }
      sawBody = true;
      if (stops.length === 0) {
        push({ kind: "focus-lost", level: "fail", text: "First Tab did not focus anything in the document" });
        break;
      }
      // One Tab on <body> is normal when leaving the document; the next Tab must re-enter at the first stop.
      continue;
    }
    if (sawBody) {
      if (info.index === 1) break; // wrapped around → the tab ring is complete
      push({ kind: "focus-lost", level: "fail", text: `Focus left the document after stop ${stops.length} and re-entered at "${info.label}" instead of the first stop` });
      break;
    }
    if (stops.some((s) => s.index === info.index)) break; // cycle without leaving the document (e.g. focus trap)
    const stop: FocusStop = { ...info, screenshot: null };
    if (stops.length === 0 && !info.isSkipLink) {
      push({ kind: "skip-link-first", level: "fail", text: `First Tab stop is <${info.tag}> "${info.label}", expected the skip link (a[href="#main"])` });
    }
    if (info.devOverlay) {
      push({ kind: "dev-overlay-stop", level: "info", text: `Tab stop ${stops.length + 1} is the Next.js dev overlay (<nextjs-portal>); absent in production` });
    } else if (!info.focusVisible) {
      push({ kind: "focus-not-visible", level: "warn", text: `No outline/box-shadow on focused <${info.tag}> "${info.label}" (stop ${stops.length + 1})` });
    }
    if ((stops.length + 1) % every === 0 || stops.length === 0) {
      const file = path.join(dir, `focus-${pad2(stops.length + 1)}.png`);
      await page.screenshot({ path: file, fullPage: false, timeout: 30_000 });
      stop.screenshot = rel(file);
      result.screenshots.focus.push(rel(file));
    }
    stops.push(stop);
  }
  if (stops.length >= MAX_TABS) {
    push({ kind: "focus-order", level: "warn", text: `Tab ring longer than ${MAX_TABS} stops (${focusableCount} focusables counted); pass truncated` });
  }
  return stops;
}

// ----------------------------------------------------------------------------
// Contact sheets (scripts/contact-sheet.ts is owned by another agent; optional)
// ----------------------------------------------------------------------------

interface SheetImage {
  path: string;
  label: string;
}
interface SheetOptions {
  images: SheetImage[];
  out: string;
  title: string;
  maxLongEdge?: number;
}
type MakeContactSheet = (opts: SheetOptions) => Promise<unknown>;

async function buildContactSheets(results: RouteResult[], run: string, notes: string[]): Promise<string[]> {
  const modFile = path.join(HERE, "contact-sheet.ts");
  if (!(await exists(modFile))) {
    notes.push("scripts/contact-sheet.ts not present — contact sheets skipped.");
    return [];
  }
  let make: MakeContactSheet;
  try {
    const mod = (await import(pathToFileURL(modFile).href)) as { makeContactSheet?: unknown };
    if (typeof mod.makeContactSheet !== "function") {
      notes.push("scripts/contact-sheet.ts has no makeContactSheet export — contact sheets skipped.");
      return [];
    }
    make = mod.makeContactSheet as MakeContactSheet;
  } catch (err) {
    notes.push(`scripts/contact-sheet.ts failed to load — contact sheets skipped (${err instanceof Error ? err.message : String(err)}).`);
    return [];
  }
  const outDir = path.join(QA_DIR, "contact-sheets", run);
  await mkdir(outDir, { recursive: true });
  const written: string[] = [];
  const tryMake = async (opts: SheetOptions) => {
    try {
      await make(opts);
      written.push(rel(opts.out));
    } catch (err) {
      notes.push(`Contact sheet ${rel(opts.out)} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  for (const r of results) {
    const images: SheetImage[] = [];
    if (r.screenshots.fullInitial) images.push({ path: path.join(ROOT, r.screenshots.fullInitial), label: "full-initial" });
    r.screenshots.scroll.forEach((s, i) => images.push({ path: path.join(ROOT, s), label: `scroll-${pad2(i + 1)}` }));
    if (r.screenshots.fullRevealed) images.push({ path: path.join(ROOT, r.screenshots.fullRevealed), label: "full-revealed" });
    r.screenshots.focus.forEach((s, i) => images.push({ path: path.join(ROOT, s), label: `focus-${pad2(i + 1)}` }));
    if (!images.length) continue;
    await tryMake({ images, out: path.join(outDir, `${r.slug}-${r.column}.png`), title: `${r.route} @ ${r.column} — ${r.status}`, maxLongEdge: 2000 });
  }
  const columns = Array.from(new Set(results.map((r) => r.column)));
  for (const column of columns) {
    const images = results
      .filter((r) => r.column === column && r.screenshots.fullRevealed)
      .map((r) => ({ path: path.join(ROOT, r.screenshots.fullRevealed!), label: r.route }));
    if (!images.length) continue;
    await tryMake({ images, out: path.join(outDir, `all-full-${column}.png`), title: `All routes — full-revealed @ ${column}`, maxLongEdge: 2000 });
  }
  return written;
}

// ----------------------------------------------------------------------------
// Report
// ----------------------------------------------------------------------------

function renderMarkdown(report: Report): string {
  const lines: string[] = [];
  lines.push(`# QA report — run \`${report.run}\``);
  lines.push("");
  lines.push(`- Base URL: ${report.baseUrl}`);
  lines.push(`- Started: ${report.startedAt} · Duration: ${(report.durationMs / 1000).toFixed(1)}s`);
  lines.push(`- Results: **${report.summary.fail} FAIL** · ${report.summary.warn} WARN · ${report.summary.pass} PASS (of ${report.summary.total})`);
  lines.push("");
  lines.push("## Matrix");
  lines.push("");
  lines.push(`| Route | ${report.columns.join(" | ")} |`);
  lines.push(`|---|${report.columns.map(() => "---").join("|")}|`);
  const byKey = new Map(report.results.map((r) => [`${r.route}@${r.column}`, r]));
  for (const route of report.routes) {
    const cells = report.columns.map((c) => {
      const r = byKey.get(`${route}@${c}`);
      if (!r) return "—";
      const n = r.issues.length;
      return n ? `${r.status} (${n})` : r.status;
    });
    lines.push(`| \`${route}\` | ${cells.join(" | ")} |`);
  }
  lines.push("");
  lines.push("Legend: PASS · WARN · FAIL, with the number of counted issues in parentheses; — = not run.");
  lines.push("");

  const withIssues = report.results.filter((r) => r.issues.some((i) => i.level !== "info"));
  lines.push("## Issues");
  lines.push("");
  if (!withIssues.length) lines.push("No counted issues.");
  for (const r of withIssues) {
    lines.push(`### \`${r.route}\` @ ${r.column} — ${r.status}`);
    lines.push("");
    lines.push(`Motion tier: \`${r.motionTier ?? "n/a"}\` · document ${r.documentStatus ?? "?"} · screenshots: \`${r.screenshots.dir}\``);
    lines.push("");
    // Group identical issues so noisy consoles stay readable.
    const groups = new Map<string, { issue: Issue; count: number }>();
    for (const i of r.issues) {
      if (i.level === "info") continue;
      const key = `${i.kind}|${i.level}|${i.text}|${i.url ?? ""}`;
      const g = groups.get(key);
      if (g) g.count += 1;
      else groups.set(key, { issue: i, count: 1 });
    }
    for (const { issue, count } of groups.values()) {
      const tag = issue.level === "fail" ? "FAIL" : "WARN";
      const url = issue.url ? ` — \`${truncate(issue.url, 120)}\`` : "";
      const status = issue.status ? ` [${issue.status}]` : "";
      const times = count > 1 ? ` ×${count}` : "";
      lines.push(`- **${tag}** \`${issue.kind}\`${status}${times}: ${truncate(issue.text, 240)}${url}`);
    }
    const info = r.issues.filter((i) => i.level === "info");
    if (info.length) lines.push(`- _info_: ${info.length} informational entr${info.length === 1 ? "y" : "ies"} (aborted prefetches, soft timeouts) — see report.json`);
    lines.push("");
  }

  lines.push("## Allowlist");
  lines.push("");
  if (!report.allowlist.length) lines.push("No allowlist entries (qa/allowlist.json).");
  for (const { entry, count } of report.allowlistHits) {
    const scope = [entry.urlPattern && `url~/${entry.urlPattern}/`, entry.textPattern && `text~/${entry.textPattern}/`].filter(Boolean).join(", ");
    lines.push(`- \`${entry.kind}\`${scope ? ` (${scope})` : ""} — ${entry.reason} — suppressed ${count} issue(s)`);
  }
  lines.push("");

  const suppressedResults = report.results.filter((r) => r.suppressed.length);
  if (suppressedResults.length) {
    lines.push("### Suppressed issues (echoed)");
    lines.push("");
    for (const r of suppressedResults) {
      for (const i of r.suppressed) {
        lines.push(`- \`${r.route}\` @ ${r.column}: \`${i.kind}\` ${truncate(i.text, 160)}${i.url ? ` — \`${truncate(i.url, 100)}\`` : ""} _(${i.allowlisted})_`);
      }
    }
    lines.push("");
  }

  if (report.contactSheets.length) {
    lines.push("## Contact sheets");
    lines.push("");
    for (const s of report.contactSheets) lines.push(`- \`${s}\``);
    lines.push("");
  }
  if (report.notes.length) {
    lines.push("## Notes");
    lines.push("");
    for (const n of report.notes) lines.push(`- ${n}`);
    lines.push("");
  }
  lines.push("## Timings");
  lines.push("");
  lines.push("| Route | Column | goto | preloader | scroll | focus | total | steps | focus stops |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const r of report.results) {
    const t = r.timings;
    lines.push(`| \`${r.route}\` | ${r.column} | ${t.gotoMs}ms | ${t.preloaderMs}ms | ${t.scrollMs}ms | ${t.focusMs}ms | ${t.totalMs}ms | ${r.scrollSteps} | ${r.focusStops} |`);
  }
  lines.push("");
  return lines.join("\n");
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const startedAt = new Date();
  const notes: string[] = [];

  const allRoutes = getQaRoutes();
  const routes = opts.routes ?? allRoutes;
  for (const r of routes) {
    if (!allRoutes.includes(r)) notes.push(`Route ${r} is not in getQaRoutes(); running it anyway (expected status 200).`);
  }
  const viewports = opts.viewports.filter((v) => {
    if (VIEWPORT_HEIGHTS[v] === undefined) {
      notes.push(`Viewport ${v} has no configured height — using 900.`);
      VIEWPORT_HEIGHTS[v] = 900;
    }
    return true;
  });
  const rmViewports = RM_VIEWPORTS.filter((v) => viewports.includes(v));
  const columns = [...viewports.map(String), ...rmViewports.map((v) => `${v}-rm`)];

  const jobs: Job[] = [];
  for (const route of routes) {
    const slug = routeSlug(route);
    for (const viewport of viewports) {
      jobs.push({ route, slug, viewport, height: VIEWPORT_HEIGHTS[viewport]!, rm: false, focus: viewport === FOCUS_VIEWPORT && !opts.skipFocus, column: String(viewport) });
    }
    for (const viewport of rmViewports) {
      jobs.push({ route, slug, viewport, height: VIEWPORT_HEIGHTS[viewport]!, rm: true, focus: false, column: `${viewport}-rm` });
    }
  }

  const runDir = path.join(QA_DIR, "screenshots", opts.run);
  await mkdir(runDir, { recursive: true });
  const allow = await loadAllowlist();

  console.log(`[qa] run=${opts.run} base=${opts.baseUrl} routes=${routes.length} viewports=${viewports.join(",")} rm=${rmViewports.join(",") || "none"} jobs=${jobs.length} concurrency=${opts.concurrency}${opts.skipFocus ? " (focus pass skipped)" : ""}`);

  let server: ChildProcess | null = null;
  let browser: Browser | null = null;
  const cleanup = async () => {
    await browser?.close().catch(() => {});
    stopServer(server);
  };
  const onSignal = () => {
    void cleanup().finally(() => process.exit(130));
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);

  try {
    if (opts.serve) server = await startServer(opts.baseUrl);
    else await waitForHttp(opts.baseUrl + "/", 15_000);

    try {
      browser = await chromium.launch(opts.channel ? { channel: opts.channel } : {});
    } catch (err) {
      if (opts.channel) throw err;
      notes.push(`Headless chromium failed to launch (${err instanceof Error ? err.message.split("\n")[0] : String(err)}); fell back to channel 'chrome'.`);
      browser = await chromium.launch({ channel: "chrome" });
    }
    console.log(`[qa] browser ${browser.version()}${opts.channel ? ` (channel ${opts.channel})` : ""}`);

    const results: RouteResult[] = new Array<RouteResult | undefined>(jobs.length) as RouteResult[];
    let next = 0;
    let done = 0;
    const worker = async () => {
      for (;;) {
        const idx = next;
        next += 1;
        if (idx >= jobs.length) return;
        const job = jobs[idx]!;
        const label = `${job.route} @ ${job.column}`;
        const r = await runJob(browser!, job, opts, allow, runDir);
        results[idx] = r;
        done += 1;
        const fails = r.issues.filter((i) => i.level === "fail").length;
        const warns = r.issues.filter((i) => i.level === "warn").length;
        const extra = r.status === "PASS" ? "" : ` (${fails} fail, ${warns} warn)`;
        console.log(`[qa] [${done}/${jobs.length}] ${label} ${r.status}${extra} tier=${r.motionTier ?? "?"} ${(r.timings.totalMs / 1000).toFixed(1)}s`);
      }
    };
    await Promise.all(Array.from({ length: Math.min(opts.concurrency, jobs.length) }, worker));

    const contactSheets = await buildContactSheets(results, opts.run, notes);

    const hits = allow.map((entry) => ({
      entry,
      count: results.reduce((n, r) => n + r.suppressed.filter((i) => i.allowlisted === entry.reason).length, 0),
    }));
    const finishedAt = new Date();
    const report: Report = {
      run: opts.run,
      baseUrl: opts.baseUrl,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      columns,
      routes,
      summary: {
        pass: results.filter((r) => r.status === "PASS").length,
        warn: results.filter((r) => r.status === "WARN").length,
        fail: results.filter((r) => r.status === "FAIL").length,
        total: results.length,
      },
      allowlist: allow,
      allowlistHits: hits,
      results,
      contactSheets,
      notes,
    };
    await writeFile(path.join(QA_DIR, "report.json"), JSON.stringify(report, null, 2));
    await writeFile(path.join(QA_DIR, "report.md"), renderMarkdown(report));
    await writeFile(path.join(runDir, "report.json"), JSON.stringify(report, null, 2));

    console.log(`[qa] wrote qa/report.json + qa/report.md — ${report.summary.fail} FAIL, ${report.summary.warn} WARN, ${report.summary.pass} PASS`);
    for (const n of notes) console.log(`[qa] note: ${n}`);
    process.exitCode = report.summary.fail > 0 ? 1 : 0;
  } finally {
    await cleanup();
  }
}

main().catch((err) => {
  console.error(`[qa] fatal: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`);
  process.exit(1);
});
