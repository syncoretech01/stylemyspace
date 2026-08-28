/**
 * @playwright/test config for the WebGL spec only (`pnpm qa:webgl`).
 * Runs in real Chrome (channel 'chrome') so the three.js hero takes its WebGL path.
 * Set QA_BASE_URL to point at a different server; QA_HEADED=1 runs headed (real GPU on macOS).
 */
import { defineConfig } from "@playwright/test";

const baseURL = (process.env.QA_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export default defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.ts$/,
  outputDir: "../.playwright/results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    browserName: "chromium",
    channel: "chrome",
    headless: process.env.QA_HEADED !== "1",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    contextOptions: { reducedMotion: "no-preference" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chrome" }],
});
