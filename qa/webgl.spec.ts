/**
 * WebGL lifecycle check for the home hero (three.js), run in real Chrome.
 *
 *   pnpm qa:webgl            (against http://localhost:3000; QA_BASE_URL overrides)
 *
 * Passes today (no canvas yet) and later when the hero exists: at most one live WebGL context
 * at any point, no console errors on the WebGL path, and the hero canvas is removed/disposed
 * once the user navigates away from `/`.
 */
import { expect, test, type Page } from "@playwright/test";

/** Installed before any page script: wraps getContext() and records every WebGL context handed out. */
const INIT_SCRIPT = `
(() => {
  const store = { requested: 0, contexts: [] };
  Object.defineProperty(window, '__qaGl', { value: store, configurable: false, writable: false });
  const isGl = (type) => type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl';
  const wrap = (proto) => {
    if (!proto || typeof proto.getContext !== 'function') return;
    const orig = proto.getContext;
    proto.getContext = function (type, ...rest) {
      const ctx = orig.call(this, type, ...rest);
      if (ctx && isGl(type)) {
        store.requested += 1;
        if (!store.contexts.includes(ctx)) store.contexts.push(ctx);
      }
      return ctx;
    };
  };
  wrap(HTMLCanvasElement.prototype);
  if (typeof OffscreenCanvas !== 'undefined') wrap(OffscreenCanvas.prototype);
})();`;

interface GlSnapshot {
  requested: number;
  created: number;
  live: number;
  lost: number;
  detached: number;
  heroCanvasCount: number;
  heroCanvasConnected: boolean;
}

interface GlStore {
  requested: number;
  contexts: (WebGLRenderingContext | WebGL2RenderingContext)[];
}

function snapshot(page: Page): Promise<GlSnapshot> {
  return page.evaluate(() => {
    const store = (window as unknown as { __qaGl?: GlStore }).__qaGl ?? { requested: 0, contexts: [] };
    let live = 0;
    let lost = 0;
    let detached = 0;
    for (const ctx of store.contexts) {
      const isLost = ctx.isContextLost();
      const canvas = ctx.canvas;
      const connected = canvas instanceof HTMLCanvasElement ? canvas.isConnected : true;
      if (isLost) lost += 1;
      else if (!connected) detached += 1;
      else live += 1;
    }
    const heroCanvases = Array.from(document.querySelectorAll<HTMLCanvasElement>("main canvas, canvas[data-hero-canvas]"));
    return {
      requested: store.requested,
      created: store.contexts.length,
      live,
      lost,
      detached,
      heroCanvasCount: heroCanvases.length,
      heroCanvasConnected: heroCanvases.some((c) => c.isConnected),
    };
  });
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  await page.waitForFunction(() => document.documentElement.dataset.preloaderDone === "true", null, { timeout: 10_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  });
  // Lazy motion/three chunks mount after the preloader; give them a moment to create their context.
  await page.waitForTimeout(1500);
}

test.describe("home hero WebGL lifecycle", () => {
  test("≤ 1 live WebGL context, no console errors, hero canvas disposed on navigation", async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(`${err.name}: ${err.message}`));
    await page.addInitScript({ content: INIT_SCRIPT });

    // 1. Home
    const res = await page.goto("/", { waitUntil: "load" });
    expect(res?.status(), "home document status").toBe(200);
    await settle(page);
    const home = await snapshot(page);
    testInfo.annotations.push({ type: "webgl-home", description: JSON.stringify(home) });
    expect(home.live, "live WebGL contexts on /").toBeLessThanOrEqual(1);
    if (home.heroCanvasCount > 0) {
      expect(home.heroCanvasCount, "hero canvases on /").toBe(1);
    }

    // 2. Client-side navigation to /portfolio via the primary nav
    const portfolioLink = page.locator('nav[aria-label="Primary"] a[href="/portfolio"]').first();
    await expect(portfolioLink).toBeVisible();
    await portfolioLink.click();
    await page.waitForURL("**/portfolio", { timeout: 20_000 });
    await settle(page);
    const portfolio = await snapshot(page);
    testInfo.annotations.push({ type: "webgl-portfolio", description: JSON.stringify(portfolio) });
    expect(portfolio.heroCanvasCount, "hero canvas still in the DOM on /portfolio").toBe(0);
    expect(portfolio.heroCanvasConnected, "hero canvas still connected on /portfolio").toBe(false);
    expect(portfolio.live, "live WebGL contexts on /portfolio (hero should be disposed)").toBe(0);

    // 3. Back to home — a re-mounted hero may create a new context, the old one must be gone
    await page.goBack({ waitUntil: "load" });
    await page.waitForURL((url) => url.pathname === "/", { timeout: 20_000 });
    await settle(page);
    const back = await snapshot(page);
    testInfo.annotations.push({ type: "webgl-back", description: JSON.stringify(back) });
    expect(back.live, "live WebGL contexts after returning to /").toBeLessThanOrEqual(1);
    if (home.heroCanvasCount > 0) {
      expect(back.heroCanvasCount, "hero canvas re-mounted on /").toBe(1);
    }

    // 4. Console hygiene on the WebGL path
    expect(pageErrors, "uncaught page errors").toEqual([]);
    expect(consoleErrors, "console errors").toEqual([]);

    // 5. Transparency: which renderer did Chrome use? (creates a throwaway context AFTER the assertions)
    const renderer = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      if (!gl) return "no WebGL available";
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return name;
    });
    testInfo.annotations.push({ type: "webgl-renderer", description: renderer });
  });
});
