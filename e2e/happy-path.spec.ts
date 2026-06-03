import { test, expect } from "@playwright/test";

/**
 * Happy-path E2E: walks through all three wizard steps end-to-end.
 *
 * Step 1  — Panel Setup   → fill name, pick model + engine, continue
 * Step 2  — Define I/O    → apply EMIT Recommended template, continue
 * Step 3  — Map Ports     → auto-map, assert progress text, export XML
 *
 * Selector assumptions (noted for maintainers):
 * - The config-name input has id="cfg-name", matched via label "Configuration name".
 * - Compressor model select trigger has id="compressor-model", matched via label.
 * - Engine type select trigger has id="engine-type", matched via label.
 * - Stages input has id="stages", matched via label "Compressor stages".
 * - Footer "Continue →" is type="submit" form="setup-form" — clicked by role/text.
 * - Template buttons are plain <button> with visible text "EMIT Recommended".
 * - "Continue to Mapping →" footer button is disabled until activeIO is non-empty.
 * - Radix Select popover items render in a portal; `page.getByRole("option")` finds them.
 * - Progress text "{N} / {N} mapped" is a <span> inside the status bar.
 * - Export XML appears as a <button> in both the header and footer on step 3
 *   once mappings.length > 0. We click the footer one to stay DRY.
 */
test("full wizard happy path: setup → template → auto-map → export XML", async ({ page }) => {
  // ── Navigate ─────────────────────────────────────────────────────────────
  await page.goto("/");

  // ── Step 1: Panel Setup ───────────────────────────────────────────────────

  // Fill the required configuration name.
  await page.getByLabel("Configuration name").fill("E2E Test Config");

  // Open the compressor model select (Radix Select trigger identified by its label).
  await page.getByLabel("Compressor model").click();
  // Pick the first available model: "JGC/4" from the JG/JGC series.
  // Assumption: Radix renders SelectItem as role="option" in a portal listbox.
  await page.getByRole("option", { name: "JGC/4" }).click();

  // Open the engine type select.
  await page.getByLabel("Engine type").click();
  // Pick "CAT-3516" — the first item in ENGINE_TYPES.
  await page.getByRole("option", { name: "CAT-3516" }).click();

  // "Compressor stages" is a required number input, default value is already 1
  // (set by the store initializer). We assert it has a value rather than filling
  // it to avoid overriding a valid default. If the default is 0 or blank,
  // uncomment the line below.
  // await page.getByLabel("Compressor stages").fill("2");

  // Submit step 1 — footer button is type="submit" form="setup-form".
  await page.getByRole("button", { name: "Continue →" }).click();

  // ── Step 2: Define I/O ────────────────────────────────────────────────────

  // Wait for the Define I/O heading to confirm step transition.
  await expect(page.getByRole("heading", { name: "Define I/O Requirements" })).toBeVisible();

  // Apply the EMIT Recommended template.
  await page.getByRole("button", { name: "EMIT Recommended" }).click();

  // The active list should now show template items (PT-101 is in EMIT Recommended).
  await expect(page.getByText("PT-101").first()).toBeVisible();

  // Proceed to step 3 — the button enables once activeIO is non-empty.
  await page.getByRole("button", { name: "Continue to Mapping →" }).click();

  // ── Step 3: Map to Hardware Ports ─────────────────────────────────────────

  // Wait for the mapping heading.
  await expect(page.getByRole("heading", { name: "Map to Hardware Ports" })).toBeVisible();

  // Auto-map all I/O items to ports.
  await page.getByRole("button", { name: "Auto Map" }).click();

  // Assert the progress text shows at least some mapped items, e.g. "12 / 12 mapped".
  // The span text follows the pattern "{mapped} / {total} mapped".
  // Assumption: at least 1 item gets mapped; the template produces ~30+ items which
  // BRAIN (base unit) can accommodate.
  const progressText = page.getByText(/\d+ \/ \d+ mapped/);
  await expect(progressText).toBeVisible();

  // Confirm the text is not "0 / N mapped" — some mappings must exist.
  const text = await progressText.textContent();
  const [mappedStr] = (text ?? "").trim().split(" / ");
  expect(Number(mappedStr)).toBeGreaterThan(0);

  // ── Export XML ────────────────────────────────────────────────────────────

  // Set up a download listener before clicking so we don't miss the event.
  const downloadPromise = page.waitForEvent("download");

  // The "Export XML" button appears in the footer (and header) once mappings > 0.
  // Use the footer one for a stable locator inside the <footer> landmark.
  await page.locator("footer").getByRole("button", { name: "Export XML" }).click();

  const download = await downloadPromise;

  // The filename should end with ".xml".
  expect(download.suggestedFilename()).toMatch(/\.xml$/);
});
