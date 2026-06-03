# E2E and Visual Tests

These tests use Playwright to check that the app works end-to-end and looks
right.

## What the tests do

**`happy-path.spec.ts`** — Walks through the whole wizard once:

1. Fills in a config name, picks a compressor model and engine type on Step 1,
   then clicks "Continue →".
2. Clicks "EMIT Recommended" on Step 2 to load a template, then clicks "Continue
   to Mapping →".
3. Clicks "Auto Map" on Step 3, checks that some items got mapped, then clicks
   "Export XML" and confirms the file ends with `.xml`.

**`visual.spec.ts`** — Takes screenshots so you can catch layout changes you
didn't mean to make. It captures three screens:

- The setup screen right after the app loads (dark mode).
- The mapping screen after applying the Recommended template and running Auto
  Map.
- The setup screen in light mode.

Each screen is captured at three viewport sizes: desktop, 320 × 640 (mobile), and
768 × 1024 (tablet). So there are nine baseline images in all. The viewport sizes
are set as Playwright projects in `playwright.config.ts`.

## One-time setup

Install the browsers Playwright needs (only needed once per machine):

```bash
npx playwright install
```

## How to run

The `test:e2e` and `test:visual` scripts are already in `package.json`:

```bash
# Run only the happy-path E2E test
npm run test:e2e

# Run only the visual snapshot tests
npm run test:visual
```

## Visual baselines

The first time you run `npm run test:visual`, Playwright will fail and create the
baseline screenshots under `e2e/__snapshots__/`. That's expected. Run it once
more and it will pass.

To update the baselines after a design change you meant to make, run:

```bash
npx playwright test e2e/visual.spec.ts --update-snapshots
```

Commit the new snapshots along with the design change.

## Notes on selectors

The tests use role-based and label-based locators, so they stay stable when the
markup changes a little. A few things to know if a test breaks after a code
change:

- The "Compressor model" and "Engine type" selects use Radix UI. Their options
  render in a portal. `getByRole("option", { name: "..." })` finds them every
  time.
- "Continue →" is a `type="submit"` button tied to `form="setup-form"`. Clicking
  it runs the real form validation.
- "Continue to Mapping →" is disabled until at least one I/O item is in the active
  list.
- "Export XML" shows in both the header and footer on Step 3 once mappings exist.
  The tests click the footer one.
- The progress text reads `"{N} / {N} mapped"`. The test reads the first number
  to confirm it's greater than zero.
