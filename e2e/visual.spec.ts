import { test, expect } from "@playwright/test";

/**
 * Visual-regression snapshots.
 *
 * Baselines are created on the first run with `--update-snapshots`.
 * Run `npx playwright test e2e/visual.spec.ts --update-snapshots` to (re)generate
 * them after an intentional design change.
 *
 * Each snapshot is stored under `e2e/__snapshots__/` with the project name
 * (e.g. "visual-mobile", "visual-tablet") baked into the path so viewports
 * don't collide.
 *
 * maxDiffPixels is 100 (set in playwright.config.ts) — small aliasing
 * differences due to font rendering across machines are tolerated.
 */

test("setup screen on load looks correct", async ({ page }) => {
  await page.goto("/");

  // Wait for the heading to ensure the page has fully settled before snapping.
  await expect(page.getByRole("heading", { name: "Panel Setup" })).toBeVisible();

  await expect(page).toHaveScreenshot("setup.png");
});

test("mapping screen after Recommended template + Auto Map looks correct", async ({ page }) => {
  await page.goto("/");

  // ── Step 1: fill the minimum required fields ──────────────────────────────
  await page.getByLabel("Configuration name").fill("Visual Test Config");

  await page.getByLabel("Compressor model").click();
  await page.getByRole("option", { name: "JGC/4" }).click();

  await page.getByLabel("Engine type").click();
  await page.getByRole("option", { name: "CAT-3516" }).click();

  await page.getByRole("button", { name: "Continue →" }).click();

  // ── Step 2: apply template ────────────────────────────────────────────────
  await expect(page.getByRole("heading", { name: "Define I/O Requirements" })).toBeVisible();
  await page.getByRole("button", { name: "EMIT Recommended" }).click();
  await page.getByRole("button", { name: "Continue to Mapping →" }).click();

  // ── Step 3: auto-map then snapshot ───────────────────────────────────────
  await expect(page.getByRole("heading", { name: "Map to Hardware Ports" })).toBeVisible();
  await page.getByRole("button", { name: "Auto Map" }).click();

  // Wait for the progress text to update so the snapshot is stable.
  await expect(page.getByText(/\d+ \/ \d+ mapped/)).toBeVisible();

  await expect(page).toHaveScreenshot("mapping.png");
});

test("setup screen in light mode looks correct", async ({ page }) => {
  // The app is dark-first; seed the light theme to capture the alternate look.
  await page.addInitScript(() => localStorage.setItem("panel-io-theme", "light"));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Panel Setup" })).toBeVisible();
  await expect(page).toHaveScreenshot("setup-light.png");
});
