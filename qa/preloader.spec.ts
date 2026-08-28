/**
 * Preloader contract (brief §5): logotype draws in with a real-progress counter, curtain wipe into the
 * hero, ≤ 2.5 s, once per session, never on route change, never under prefers-reduced-motion.
 * Run with: pnpm exec playwright test -c qa/playwright.config.ts qa/preloader.spec.ts
 */
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "qa/screenshots/preloader";
mkdirSync(OUT, { recursive: true });

test.describe("preloader", () => {
  test("runs once per session, exits within 2.5 s, hands off to the hero", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await context.newPage();
    const start = Date.now();
    await p.goto("/", { waitUntil: "commit" });
    // Pending flag set by the inline head script before first paint.
    await expect(p.locator("html")).toHaveAttribute("data-preloader", "pending");
    await p.screenshot({ path: `${OUT}/t0200.png` });
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/t0700.png` });
    const pct = await p.locator("#preloader .preloader__pct").textContent();
    expect(pct).toMatch(/^\d{1,3}%$/);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/t1400.png` });
    await expect(p.locator("html")).toHaveAttribute("data-preloader-done", "true", { timeout: 3000 });
    const elapsed = Date.now() - start;
    expect(elapsed, "preloader must finish within 2.5 s + wipe").toBeLessThan(3600);
    await expect(p.locator("#preloader")).toHaveCount(0);
    await p.screenshot({ path: `${OUT}/t-done.png` });
    // header/main are interactive again
    expect(await p.locator("main[inert]").count()).toBe(0);
    // session flag set
    expect(await p.evaluate(() => sessionStorage.getItem("sms.preloaded"))).toBe("1");

    // Client-side navigation: no preloader
    await p.click('header nav a[href="/portfolio"]');
    await p.waitForURL(/\/portfolio$/);
    await expect(p.locator("#preloader")).toHaveCount(0);
    // Reload in the same session: no preloader, no pending flag
    await p.reload({ waitUntil: "domcontentloaded" });
    expect(await p.locator("html").getAttribute("data-preloader")).not.toBe("pending");
    await expect(p.locator("#preloader")).toHaveCount(0);
    await context.close();
  });

  test("never renders under prefers-reduced-motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const p = await context.newPage();
    await p.goto("/", { waitUntil: "domcontentloaded" });
    expect(await p.locator("html").getAttribute("data-motion")).toBe("reduced");
    expect(await p.locator("html").getAttribute("data-preloader")).not.toBe("pending");
    await expect(p.locator("html")).toHaveAttribute("data-preloader-done", "true");
    await expect(p.locator("#preloader")).toHaveCount(0);
    await context.close();
  });

  test("no console errors or warnings during the preloader sequence", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await context.newPage();
    const bad: string[] = [];
    p.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") bad.push(`${m.type()}: ${m.text()}`);
    });
    p.on("pageerror", (e) => bad.push(`pageerror: ${e.message}`));
    await p.goto("/", { waitUntil: "load" });
    await expect(p.locator("html")).toHaveAttribute("data-preloader-done", "true", { timeout: 4000 });
    await p.waitForTimeout(500);
    expect(bad).toEqual([]);
    await context.close();
  });
});
