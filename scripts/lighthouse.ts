/**
 * Lighthouse audit: every route × {desktop, mobile}, N runs each, median by Performance.
 *
 *   pnpm qa:lighthouse [--base-url=http://localhost:3000] [--serve] [--runs=3]
 *                      [--routes=/,/about] [--modes=desktop,mobile] [--headed] [--run=<name>]
 *
 * --serve spawns `next start -p <port>` (assumes a prior `pnpm build`) and stops it at the end.
 * Every audited route is warmed first (HTML + every /_next/image variant) so no run measures a
 * cold image resize. Runs are serial through one Chrome instance.
 *
 * Output: qa/lighthouse/<run>/<routeSlug>.<mode>.r<n>.report.{json,html}, summary.md, summary.json.
 * Exit 1 when any median misses a threshold (THRESHOLDS below) or a cell cannot be audited.
 *
 * Implementation note: each Lighthouse run executes in a plain-Node child process (WORKER_SOURCE).
 * tsx transforms every module it loads with esbuild `keepNames`, which injects `__name(...)`
 * helpers into Lighthouse's page functions; those are stringified and evaluated inside the page,
 * where `__name` does not exist ("ReferenceError: __name is not defined"). Running Lighthouse
 * outside tsx sidesteps that; Chrome and the reports are still owned by this script.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Result as LhResult } from "lighthouse";
import { launch, type LaunchedChrome } from "chrome-launcher";
import { siteRoutes, warm } from "./warm-images";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

export type Mode = "desktop" | "mobile";
const ALL_MODES: readonly Mode[] = ["desktop", "mobile"];
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"] as const;

/** Pass/fail gates — per route, per mode, applied to the median run. */
export const THRESHOLDS = {
  performance: { desktop: 85, mobile: 75 },
  accessibility: 95,
  bestPractices: 95,
  seo: 95,
  /** LCP must be strictly below this (ms). */
  lcpMs: 2500,
  /** CLS must be strictly below this. */
  cls: 0.1,
} as const;

export type Scores = { performance: number; accessibility: number; bestPractices: number; seo: number };
export type Metrics = { lcpMs: number | null; cls: number | null; tbtMs: number | null; speedIndexMs: number | null };
export type AuditRef = { id: string; title: string; score: number | null; displayValue?: string };
export type Opportunity = AuditRef & { savingsMs: number | null };

type RunRecord = {
  n: number;
  scores: Scores;
  metrics: Metrics;
  reports: { json: string; html: string };
  runWarnings: string[];
  lhr: LhResult;
};

export type CellResult = {
  route: string;
  slug: string;
  mode: Mode;
  status: "pass" | "fail" | "error";
  runs: number;
  medianRun: number | null;
  scores: Scores | null;
  metrics: Metrics | null;
  thresholdMisses: string[];
  failingAudits: { accessibility: AuditRef[]; bestPractices: AuditRef[]; seo: AuditRef[] };
  opportunities: Opportunity[];
  runWarnings: string[];
  /** Paths relative to the repo root. */
  reports: { json: string; html: string } | null;
  allRuns: { n: number; scores: Scores; metrics: Metrics }[];
  error?: string;
};

export type Summary = {
  run: string;
  generatedAt: string;
  baseUrl: string;
  devServer: boolean;
  headed: boolean;
  runsPerCell: number;
  medianRule: string;
  lighthouseVersion: string | null;
  hostUserAgent: string | null;
  thresholds: typeof THRESHOLDS;
  pass: boolean;
  results: CellResult[];
};

type Options = { baseUrl: string; serve: boolean; runs: number; routes: string[]; modes: Mode[]; headed: boolean; run: string; extraChromeFlags?: string[] };

const startedAt = Date.now();
const log = (line: string) => console.log(`[lighthouse +${((Date.now() - startedAt) / 1000).toFixed(1)}s] ${line}`);
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const defaultRunName = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

export function parseArgs(argv: string[]): Options {
  const opts: Options = {
    baseUrl: "http://localhost:3000",
    serve: false,
    runs: 3,
    routes: siteRoutes(),
    modes: [...ALL_MODES],
    headed: false,
    run: defaultRunName(),
  };
  const value = (arg: string) => arg.slice(arg.indexOf("=") + 1);
  const list = (arg: string) => value(arg).split(",").map((s) => s.trim()).filter(Boolean);
  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) opts.baseUrl = value(arg).replace(/\/$/, "");
    else if (arg === "--serve") opts.serve = true;
    else if (arg === "--headed") opts.headed = true;
    else if (arg.startsWith("--chrome-flags=")) opts.extraChromeFlags = arg.slice("--chrome-flags=".length).split(/\s+/).filter(Boolean);
    else if (arg.startsWith("--runs=")) opts.runs = Math.max(1, Math.floor(Number(value(arg))) || 1);
    else if (arg.startsWith("--routes=")) opts.routes = list(arg).map((r) => (r.startsWith("/") ? r : `/${r}`));
    else if (arg.startsWith("--modes=")) {
      const modes = list(arg);
      const bad = modes.filter((m) => !ALL_MODES.includes(m as Mode));
      if (bad.length) throw new Error(`Unknown mode(s): ${bad.join(", ")} (use desktop,mobile)`);
      opts.modes = modes as Mode[];
    } else if (arg.startsWith("--run=")) opts.run = value(arg).replace(/[^a-zA-Z0-9._-]+/g, "-");
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!opts.routes.length) throw new Error("No routes to audit");
  return opts;
}

/** "/" → "home", "/portfolio/oceanside" → "portfolio-oceanside". */
export const routeSlug = (route: string) => (route === "/" ? "home" : route.replace(/^\/+/, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase());

// ---------------------------------------------------------------------------------------------
// next start
// ---------------------------------------------------------------------------------------------

/** Child processes must run plain Node: drop any tsx loader inherited through NODE_OPTIONS. */
function plainNodeEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extra };
  if (env.NODE_OPTIONS) {
    env.NODE_OPTIONS = env.NODE_OPTIONS.replace(/--(?:import|require|loader|experimental-loader)(?:=|\s+)\S*tsx\S*/g, "").trim();
    if (!env.NODE_OPTIONS) delete env.NODE_OPTIONS;
  }
  return env;
}

async function startServer(port: number, baseUrl: string): Promise<ChildProcess> {
  const bin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  log(`spawning next start -p ${port} (expects a prior \`pnpm build\`)`);
  const child = spawn(process.execPath, [bin, "start", "-p", String(port)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env: plainNodeEnv({ NODE_ENV: "production", PORT: String(port) }),
  });
  child.stdout?.on("data", (chunk: Buffer) => process.stdout.write(`[next] ${chunk}`));
  child.stderr?.on("data", (chunk: Buffer) => process.stderr.write(`[next] ${chunk}`));
  const state = { exited: null as string | null };
  child.on("exit", (code, signal) => {
    state.exited = `next start exited early (code ${code}, signal ${signal})`;
  });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (state.exited) throw new Error(state.exited);
    try {
      const res = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(5_000) });
      if (res.status < 500) {
        log(`next start is up (${res.status} from ${baseUrl}/)`);
        return child;
      }
    } catch {
      /* not listening yet */
    }
    await sleep(500);
  }
  throw new Error(`next start did not respond on ${baseUrl} within 60 s`);
}

const isAlive = (child: ChildProcess) => child.exitCode === null && child.signalCode === null;

async function stopServer(child: ChildProcess): Promise<void> {
  if (!isAlive(child)) return;
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  const signal = (sig: NodeJS.Signals) => {
    try {
      if (child.pid) process.kill(-child.pid, sig); // whole process group (next start + workers)
      else child.kill(sig);
    } catch {
      child.kill(sig);
    }
  };
  signal("SIGTERM");
  await Promise.race([exited, sleep(5_000)]);
  if (isAlive(child)) {
    signal("SIGKILL");
    await Promise.race([exited, sleep(2_000)]);
  }
  log("next start stopped");
}

// ---------------------------------------------------------------------------------------------
// Lighthouse (child process, plain Node — see the header note)
// ---------------------------------------------------------------------------------------------

async function launchChrome(headed: boolean, extra: string[] = []): Promise<LaunchedChrome> {
  const chromeFlags = ["--no-sandbox", ...(headed ? ["--window-size=1440,1000"] : ["--headless=new", "--disable-gpu"]), ...extra];
  const chrome = await launch({ chromeFlags, logLevel: "error" });
  log(`Chrome launched on port ${chrome.port} (${headed ? "headed — WebGL available" : "headless=new — WebGL falls back to SwiftShader"})`);
  return chrome;
}

type WorkerJob = { lighthouse: string; desktopConfig: string; url: string; mode: Mode; port: number; jsonPath: string; htmlPath: string; categories: readonly string[] };

/** Runs in `node --input-type=module -e`; reads the job from LH_WORKER_JOB and writes both reports. */
const WORKER_SOURCE = `
import { writeFile } from "node:fs/promises";
const job = JSON.parse(process.env.LH_WORKER_JOB);
const { default: lighthouse } = await import(job.lighthouse);
const config = job.mode === "desktop" ? (await import(job.desktopConfig)).default : undefined;
const flags = { port: job.port, output: ["json", "html"], logLevel: "error", onlyCategories: job.categories };
const result = await lighthouse(job.url, flags, config);
if (!result) { console.error("Lighthouse returned no result"); process.exit(2); }
const reports = Array.isArray(result.report) ? result.report : [result.report];
const json = reports.find((r) => r.trimStart().startsWith("{")) ?? JSON.stringify(result.lhr, null, 2);
const html = reports.find((r) => r.trimStart().startsWith("<")) ?? "";
await writeFile(job.jsonPath, json);
await writeFile(job.htmlPath, html);
`;

const WORKER_TIMEOUT_MS = 5 * 60_000;

const lighthouseEntry = pathToFileURL(require.resolve("lighthouse")).href;
const desktopConfigEntry = pathToFileURL(require.resolve("lighthouse/core/config/desktop-config.js")).href;

async function runOnce(url: string, mode: Mode, port: number, jsonPath: string, htmlPath: string): Promise<LhResult> {
  const job: WorkerJob = { lighthouse: lighthouseEntry, desktopConfig: desktopConfigEntry, url, mode, port, jsonPath, htmlPath, categories: CATEGORIES };
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ["--input-type=module", "-e", WORKER_SOURCE], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: plainNodeEnv({ LH_WORKER_JOB: JSON.stringify(job) }),
    });
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => process.stdout.write(`[lh] ${chunk}`));
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += String(chunk);
      process.stderr.write(`[lh] ${chunk}`);
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Lighthouse worker exceeded ${WORKER_TIMEOUT_MS / 1000}s`));
    }, WORKER_TIMEOUT_MS);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`Lighthouse worker exited with ${signal ?? `code ${code}`}${stderr.trim() ? `: ${stderr.trim().split("\n").slice(-3).join(" | ")}` : ""}`));
    });
  });
  return JSON.parse(await readFile(jsonPath, "utf8")) as LhResult;
}

/** One audit with a single retry when Lighthouse fails or reports a runtimeError. */
async function runWithRetry(url: string, mode: Mode, port: number, fileBase: string): Promise<{ lhr: LhResult; reports: { json: string; html: string } }> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const reports = { json: `${fileBase}.report.json`, html: `${fileBase}.report.html` };
    try {
      const lhr = await runOnce(url, mode, port, reports.json, reports.html);
      const err = lhr.runtimeError;
      if (!err) return { lhr, reports };
      lastError = new Error(`runtimeError ${err.code}: ${err.message}`);
      // Keep the failed attempt next to the real report for debugging.
      await writeFile(`${fileBase}.attempt${attempt}.failed.report.json`, JSON.stringify(lhr, null, 2));
    } catch (error) {
      lastError = error;
    }
    if (attempt === 1) log(`  ! ${String(lastError)} — retrying once`);
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

const pct = (score: number | null | undefined) => (typeof score === "number" ? Math.round(score * 100) : 0);

function extractScores(lhr: LhResult): Scores {
  return {
    performance: pct(lhr.categories.performance?.score),
    accessibility: pct(lhr.categories.accessibility?.score),
    bestPractices: pct(lhr.categories["best-practices"]?.score),
    seo: pct(lhr.categories.seo?.score),
  };
}

function numeric(lhr: LhResult, auditId: string): number | null {
  const value = lhr.audits[auditId]?.numericValue;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function extractMetrics(lhr: LhResult): Metrics {
  return {
    lcpMs: numeric(lhr, "largest-contentful-paint"),
    cls: numeric(lhr, "cumulative-layout-shift"),
    tbtMs: numeric(lhr, "total-blocking-time"),
    speedIndexMs: numeric(lhr, "speed-index"),
  };
}

/** Audits in a category with a real score below 1 (manual / informative / n.a. audits have score null). */
function failingAudits(lhr: LhResult, categoryId: string): AuditRef[] {
  const category = lhr.categories[categoryId];
  if (!category) return [];
  const out: AuditRef[] = [];
  for (const ref of category.auditRefs) {
    const audit = lhr.audits[ref.id];
    if (!audit || audit.score === null || audit.score >= 1) continue;
    out.push({ id: audit.id, title: audit.title, score: audit.score, displayValue: audit.displayValue });
  }
  return out.sort((a, b) => (a.score ?? 0) - (b.score ?? 0) || a.id.localeCompare(b.id));
}

function metricSavingsMs(savings: Partial<Record<string, number>> | undefined): number | null {
  if (!savings) return null;
  let total = 0;
  let any = false;
  for (const key of ["FCP", "LCP", "TBT", "INP"]) {
    const v = savings[key];
    if (typeof v === "number") {
      total += v;
      any = true;
    }
  }
  return any ? total : null;
}

/** Top performance opportunities (failed audits carrying estimated savings), biggest savings first. */
function topOpportunities(lhr: LhResult, limit = 5): Opportunity[] {
  const category = lhr.categories.performance;
  if (!category) return [];
  const out: Opportunity[] = [];
  for (const ref of category.auditRefs) {
    const audit = lhr.audits[ref.id];
    if (!audit || audit.score === null || audit.score >= 1) continue;
    const details = audit.details;
    const isOpportunity = details?.type === "opportunity" || audit.scoreDisplayMode === "metricSavings" || audit.metricSavings !== undefined;
    if (!isOpportunity) continue;
    const overall = details && "overallSavingsMs" in details && typeof details.overallSavingsMs === "number" ? details.overallSavingsMs : null;
    out.push({
      id: audit.id,
      title: audit.title,
      score: audit.score,
      displayValue: audit.displayValue,
      savingsMs: overall ?? metricSavingsMs(audit.metricSavings),
    });
  }
  return out
    .sort((a, b) => (b.savingsMs ?? -1) - (a.savingsMs ?? -1) || (a.score ?? 0) - (b.score ?? 0) || a.id.localeCompare(b.id))
    .slice(0, limit);
}

const fmtMs = (ms: number | null) => (ms === null ? "—" : `${Math.round(ms).toLocaleString("en-US")} ms`);
const fmtCls = (cls: number | null) => (cls === null ? "—" : cls.toFixed(3));

function checkThresholds(mode: Mode, scores: Scores, metrics: Metrics): string[] {
  const misses: string[] = [];
  const perfMin = THRESHOLDS.performance[mode];
  if (scores.performance < perfMin) misses.push(`Performance ${scores.performance} < ${perfMin}`);
  if (scores.accessibility < THRESHOLDS.accessibility) misses.push(`Accessibility ${scores.accessibility} < ${THRESHOLDS.accessibility}`);
  if (scores.bestPractices < THRESHOLDS.bestPractices) misses.push(`Best Practices ${scores.bestPractices} < ${THRESHOLDS.bestPractices}`);
  if (scores.seo < THRESHOLDS.seo) misses.push(`SEO ${scores.seo} < ${THRESHOLDS.seo}`);
  if (metrics.lcpMs === null) misses.push("LCP not measured");
  else if (metrics.lcpMs >= THRESHOLDS.lcpMs) misses.push(`LCP ${fmtMs(metrics.lcpMs)} ≥ ${THRESHOLDS.lcpMs} ms`);
  if (metrics.cls === null) misses.push("CLS not measured");
  else if (metrics.cls >= THRESHOLDS.cls) misses.push(`CLS ${fmtCls(metrics.cls)} ≥ ${THRESHOLDS.cls}`);
  return misses;
}

/**
 * Median by Performance score (ties broken by LCP, higher first). With an even number of runs the
 * lower middle is taken, so the reported value is never better than a real run.
 */
export function pickMedian<T extends { scores: Scores; metrics: Metrics }>(runs: T[]): T {
  const sorted = [...runs].sort((a, b) => a.scores.performance - b.scores.performance || (b.metrics.lcpMs ?? 0) - (a.metrics.lcpMs ?? 0));
  const median = sorted[Math.floor((sorted.length - 1) / 2)];
  if (!median) throw new Error("pickMedian: no runs");
  return median;
}

async function auditCell(route: string, mode: Mode, opts: Options, port: number, outDir: string, progress: string): Promise<CellResult> {
  const slug = routeSlug(route);
  const url = `${opts.baseUrl}${route}`;
  const records: RunRecord[] = [];
  const base = { route, slug, mode, runs: opts.runs };
  const empty = { accessibility: [], bestPractices: [], seo: [] };

  for (let n = 1; n <= opts.runs; n++) {
    const fileBase = path.join(outDir, `${slug}.${mode}.r${n}`);
    const t0 = Date.now();
    log(`${progress} ${route} ${mode} run ${n}/${opts.runs} …`);
    try {
      const { lhr, reports } = await runWithRetry(url, mode, port, fileBase);
      const scores = extractScores(lhr);
      const metrics = extractMetrics(lhr);
      records.push({ n, scores, metrics, reports, runWarnings: lhr.runWarnings ?? [], lhr });
      log(
        `  perf ${scores.performance} a11y ${scores.accessibility} bp ${scores.bestPractices} seo ${scores.seo} · LCP ${fmtMs(metrics.lcpMs)} CLS ${fmtCls(metrics.cls)} TBT ${fmtMs(metrics.tbtMs)} (${((Date.now() - t0) / 1000).toFixed(1)}s)`,
      );
    } catch (error) {
      log(`  ✗ run ${n} failed after retry: ${String(error)}`);
      return {
        ...base,
        status: "error",
        medianRun: null,
        scores: null,
        metrics: null,
        thresholdMisses: [`Lighthouse could not audit this route: ${String(error)}`],
        failingAudits: empty,
        opportunities: [],
        runWarnings: [],
        reports: null,
        allRuns: records.map((r) => ({ n: r.n, scores: r.scores, metrics: r.metrics })),
        error: String(error),
      };
    }
  }

  const median = pickMedian(records);
  const thresholdMisses = checkThresholds(mode, median.scores, median.metrics);
  return {
    ...base,
    status: thresholdMisses.length ? "fail" : "pass",
    medianRun: median.n,
    scores: median.scores,
    metrics: median.metrics,
    thresholdMisses,
    failingAudits: {
      accessibility: failingAudits(median.lhr, "accessibility"),
      bestPractices: failingAudits(median.lhr, "best-practices"),
      seo: failingAudits(median.lhr, "seo"),
    },
    opportunities: topOpportunities(median.lhr),
    runWarnings: median.runWarnings,
    reports: { json: path.relative(ROOT, median.reports.json), html: path.relative(ROOT, median.reports.html) },
    allRuns: records.map((r) => ({ n: r.n, scores: r.scores, metrics: r.metrics })),
  };
}

// ---------------------------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------------------------

const STATUS_LABEL = { pass: "PASS", fail: "FAIL", error: "ERROR" } as const;

function summaryTableRows(results: CellResult[]): string[][] {
  return results.map((r) => [
    r.route,
    r.mode,
    r.scores ? String(r.scores.performance) : "—",
    r.scores ? String(r.scores.accessibility) : "—",
    r.scores ? String(r.scores.bestPractices) : "—",
    r.scores ? String(r.scores.seo) : "—",
    r.metrics ? fmtMs(r.metrics.lcpMs) : "—",
    r.metrics ? fmtCls(r.metrics.cls) : "—",
    r.metrics ? fmtMs(r.metrics.tbtMs) : "—",
    STATUS_LABEL[r.status],
  ]);
}

export function renderSummaryMd(summary: Summary): string {
  const lines: string[] = [];
  lines.push(`# Lighthouse — ${summary.run}`, "");
  lines.push(`- Generated: ${summary.generatedAt}`);
  lines.push(`- Base URL: ${summary.baseUrl}${summary.devServer ? " (**next dev detected — scores are not meaningful; audit a production build**)" : ""}`);
  lines.push(`- Lighthouse ${summary.lighthouseVersion ?? "?"} · Chrome ${summary.headed ? "headed (real GPU, WebGL path active)" : "headless=new (SwiftShader; WebGL hero falls back to the static image)"}`);
  if (summary.hostUserAgent) lines.push(`- Host UA: ${summary.hostUserAgent}`);
  lines.push(`- Runs per route × mode: ${summary.runsPerCell} — ${summary.medianRule}`);
  const t = summary.thresholds;
  lines.push(
    `- Thresholds: Performance ≥ ${t.performance.desktop} desktop / ≥ ${t.performance.mobile} mobile · Accessibility ≥ ${t.accessibility} · Best Practices ≥ ${t.bestPractices} · SEO ≥ ${t.seo} · LCP < ${t.lcpMs} ms · CLS < ${t.cls}`,
  );
  lines.push(`- Result: **${summary.pass ? "PASS" : "FAIL"}** (${summary.results.filter((r) => r.status === "pass").length}/${summary.results.length} cells pass)`, "");
  lines.push("| Route | Mode | Perf | A11y | BP | SEO | LCP | CLS | TBT | Status |");
  lines.push("|---|---|---:|---:|---:|---:|---:|---:|---:|---|");
  for (const row of summaryTableRows(summary.results)) lines.push(`| ${row.join(" | ")} |`);
  lines.push("", "## Per-route details", "");
  for (const r of summary.results) {
    lines.push(`### ${r.route} — ${r.mode} (${STATUS_LABEL[r.status]})`, "");
    if (r.reports) lines.push(`Median run r${r.medianRun}: [${path.basename(r.reports.html)}](${path.basename(r.reports.html)}) · [json](${path.basename(r.reports.json)})`);
    if (r.allRuns.length > 1) {
      lines.push(`All runs (perf / LCP): ${r.allRuns.map((x) => `r${x.n} ${x.scores.performance} / ${fmtMs(x.metrics.lcpMs)}`).join(", ")}`);
    }
    if (r.metrics) lines.push(`Speed Index ${fmtMs(r.metrics.speedIndexMs)} · TBT ${fmtMs(r.metrics.tbtMs)}`);
    lines.push("");
    if (r.thresholdMisses.length) {
      lines.push("Threshold misses:", "");
      for (const m of r.thresholdMisses) lines.push(`- ${m}`);
      lines.push("");
    }
    const groups: [string, AuditRef[]][] = [
      ["Accessibility", r.failingAudits.accessibility],
      ["Best Practices", r.failingAudits.bestPractices],
      ["SEO", r.failingAudits.seo],
    ];
    for (const [label, audits] of groups) {
      if (!audits.length) continue;
      lines.push(`${label} failing audits:`, "");
      for (const a of audits) lines.push(`- \`${a.id}\` — ${a.title}${a.displayValue ? ` (${a.displayValue})` : ""}`);
      lines.push("");
    }
    if (r.opportunities.length) {
      lines.push("Performance opportunities (top 5):", "");
      for (const o of r.opportunities) lines.push(`- \`${o.id}\` — ${o.title}${o.savingsMs !== null ? ` (est. ${fmtMs(o.savingsMs)})` : ""}${o.displayValue ? ` — ${o.displayValue}` : ""}`);
      lines.push("");
    }
    if (r.runWarnings.length) {
      lines.push("Run warnings:", "");
      for (const w of r.runWarnings) lines.push(`- ${w}`);
      lines.push("");
    }
    if (!r.thresholdMisses.length && !groups.some(([, a]) => a.length) && !r.opportunities.length && !r.runWarnings.length) lines.push("No failing audits.", "");
  }
  return lines.join("\n");
}

function printConsoleTable(results: CellResult[]) {
  const header = ["Route", "Mode", "Perf", "A11y", "BP", "SEO", "LCP", "CLS", "TBT", "Status"];
  const rows = [header, ...summaryTableRows(results)];
  const widths = header.map((_, i) => Math.max(...rows.map((r) => (r[i] ?? "").length)));
  for (const row of rows) console.log("  " + row.map((cell, i) => (i >= 2 && i <= 8 ? cell.padStart(widths[i] ?? 0) : cell.padEnd(widths[i] ?? 0))).join("  "));
}

// ---------------------------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const outDir = path.join(ROOT, "qa", "lighthouse", opts.run);
  await mkdir(outDir, { recursive: true });
  const port = Number(new URL(opts.baseUrl).port || (opts.baseUrl.startsWith("https") ? 443 : 80));

  let server: ChildProcess | null = null;
  let chrome: LaunchedChrome | null = null;
  const cleanup = async () => {
    if (chrome) {
      chrome.kill();
      chrome = null;
    }
    if (server) {
      await stopServer(server);
      server = null;
    }
  };
  const onSignal = () => {
    log("interrupted — cleaning up");
    void cleanup().finally(() => process.exit(130));
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);

  try {
    log(`run "${opts.run}" → ${path.relative(ROOT, outDir)} · ${opts.routes.length} route(s) × ${opts.modes.join(",")} × ${opts.runs} run(s)`);
    if (opts.serve) server = await startServer(port, opts.baseUrl);

    log("warming routes and image variants …");
    const warmed = await warm(opts.baseUrl, { routes: opts.routes, log: (line) => log(line) });
    if (warmed.failedRoutes === opts.routes.length) throw new Error(`no route responded on ${opts.baseUrl} — is the server running?`);
    if (warmed.failedRoutes) log(`WARNING: ${warmed.failedRoutes} route(s) failed to warm`);
    if (warmed.dev) log("WARNING: next dev detected — dev builds are unminified and HMR-instrumented; scores are not meaningful. Use `pnpm build` + --serve.");

    chrome = await launchChrome(opts.headed, opts.extraChromeFlags ?? []);
    const cells = opts.routes.flatMap((route) => opts.modes.map((mode) => ({ route, mode })));
    const results: CellResult[] = [];
    for (const [i, { route, mode }] of cells.entries()) {
      const result = await auditCell(route, mode, opts, chrome.port, outDir, `(${i + 1}/${cells.length})`);
      results.push(result);
      log(`${STATUS_LABEL[result.status]} ${route} ${mode}${result.thresholdMisses.length ? ` — ${result.thresholdMisses.join("; ")}` : ""}`);
    }

    let lighthouseVersion: string | null = null;
    let hostUserAgent: string | null = null;
    const firstReport = results.find((r) => r.reports)?.reports;
    if (firstReport) {
      try {
        const lhr = JSON.parse(await readFile(path.join(ROOT, firstReport.json), "utf8")) as Pick<LhResult, "lighthouseVersion" | "environment">;
        lighthouseVersion = lhr.lighthouseVersion;
        hostUserAgent = lhr.environment?.hostUserAgent ?? null;
      } catch {
        /* cosmetic only */
      }
    }

    const summary: Summary = {
      run: opts.run,
      generatedAt: new Date().toISOString(),
      baseUrl: opts.baseUrl,
      devServer: warmed.dev,
      headed: opts.headed,
      runsPerCell: opts.runs,
      medianRule: "median run chosen by Performance score (ties → higher LCP); even counts take the lower middle",
      lighthouseVersion,
      hostUserAgent,
      thresholds: THRESHOLDS,
      pass: results.every((r) => r.status === "pass"),
      results,
    };
    await writeFile(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
    await writeFile(path.join(outDir, "summary.md"), renderSummaryMd(summary));

    console.log("");
    printConsoleTable(results);
    console.log("");
    for (const r of results.filter((x) => x.status !== "pass")) console.log(`  ${STATUS_LABEL[r.status]} ${r.route} ${r.mode}: ${r.thresholdMisses.join("; ")}`);
    if (warmed.dev) console.log("\n  NOTE: audited a `next dev` server — treat every number above as a pipeline check only.");
    console.log(`\n  summary: ${path.relative(ROOT, path.join(outDir, "summary.md"))} (${summary.pass ? "PASS" : "FAIL"})`);
    process.exitCode = summary.pass ? 0 : 1;
  } finally {
    await cleanup();
  }
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((error: unknown) => {
    console.error(`[lighthouse] fatal: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
    process.exitCode = 1;
  });
}
