# Presentation Readiness — To-Do

Almost everything here is done and checked against the 17-step quality gate. Two
steps need a person: recording the Loom video and clicking deploy. Everything
around them is ready.

Effort key: **quick** (under 1 hour), **half-day**, **1+ day**. The italic note
at the end of each line, like *(criterion)*, shows which evaluation area the item
maps to.

## What's left for you (2 steps)

- [ ] **Record the 3–5 min Loom.** Follow [DEMO-SCRIPT.md](DEMO-SCRIPT.md) — it's
  a shot-by-shot script. The "Load sample" button makes the first 10 seconds
  easy.
- [ ] **Click deploy.** Configs for Netlify, Vercel, and GitHub Pages are in the
  repo. See [DEPLOY.md](DEPLOY.md). The build is a plain `dist/`.

---

## P0 — Do before you present (deliverables + demo hygiene)

- [x] **Loom walkthrough script** — written as [DEMO-SCRIPT.md](DEMO-SCRIPT.md)
  (recording is the human step above). *(quick · demo + AI-workflow)*
- [x] **Tightened `AI-WORKFLOW.md`** — has 3 word-for-word prompts and real
  "rejected the AI output" examples, plus a section on the parallel-agent feature
  pass. *(quick · AI-assisted workflow)*
- [x] **"Load sample (Kodiak Site 14)" button** — one click seeds the full panel
  and jumps to Define I/O. *(quick · UX clarity)*
- [x] **Deploy configs** — `netlify.toml`, `vercel.json`, a GitHub Pages
  workflow, and [DEPLOY.md](DEPLOY.md). The production build is checked on a
  local machine. *(quick · judgment)*
- [x] **Screenshots in the README** — setup, the mapped backplate, and dark mode,
  made by the Playwright visual spec. *(quick · UX clarity)*

## P1 — High-impact polish (the "wow")

- [x] **Backplate fidelity** — modules render as terminal blocks with pin numbers
  on every slot. *(1+ day · UX clarity, correctness)*
- [x] **XML preview before download** — a Preview XML dialog with highlighting and
  a copy button. *(half-day · judgment)*
- [x] **Import XML (round-trip)** — load an exported `.xml` back in; a test proves
  export → import → export is byte-identical. *(half-day · judgment, correctness)*
- [x] **Keyboard drag-and-drop** — dnd-kit `KeyboardSensor` wired up.
  *(half-day · UX, a11y)*
- [x] **Set-order Auto Map** — fixed order, and fail-safe relays take the Form-C
  ports first. "Recommended + Auto Map" gives 27/27, with DO-904 on DO 7.
  *(quick · correctness)*
- [x] **Drop feedback animations** — mapped chips animate in; drag tones show
  compatible vs. incompatible. *(quick · UX)*

## P2 — Hardware-rule depth (correctness is graded)

- [x] **Thermocouple type (K/J) check** — `tcType` on `Port`; `canMap` rejects a
  mismatch. *(half-day · correctness)*
- [x] **CAN-bus termination warning** — warns when the terminator doesn't match
  the BRAIN/BRAIN+/AFR combo. *(half-day · correctness)*
- [x] **Block export with an unmapped fail-safe relay** — a hard stop that names
  the missing tag. *(quick · correctness, validation)*
- [x] **Duplicate I/O entries** — add the same item more than once; each gets a
  fresh id. *(quick · correctness)*
- [x] **Write `notes` into the XML** — wired up and locked with a test.
  *(quick · correctness)*
- [x] **Stage/cooler-aware catalog** — hides items for stages or sections the
  compressor doesn't have. *(half-day · product thinking)*

## P3 — Reach / infrastructure (the architecture story)

- [x] **AWS Lambda stub** — a `lambda/` handler over DynamoDB, and a
  `FetchConfigService` that uses the same interface. *(1+ day · technical
  architecture)*
- [x] **E2E test (Playwright)** — one happy-path spec (setup → template →
  auto-map → export). *(half-day · engineering quality)*
- [x] **Visual regression** — Playwright snapshots at 320, 768, and desktop.
  *(half-day · engineering quality)*
- [x] **Bundle code-split** — the three step bodies are `React.lazy`.
  *(quick · performance)*

## P4 — Nice-to-have / future

- [x] **Mobile reflow** — panels stack below `md`; checked at 320px.
  *(quick · responsiveness)*
- [x] **Onboarding popovers** — first-run tips for Form-C, E-STOP, and capacity.
  *(quick)*
- [x] **Config versioning** — "Save as new version" bumps the version and keeps
  the old one. *(quick)*
- [x] **Panel I/O print view** — a print-friendly table (tag → port → pins).
  *(half-day)*
- [x] **Toast notifications** — save/export/import/auto-map confirmations
  (sonner). *(quick)*
- [x] **Undo/redo** — for I/O and mapping changes (zundo). *(quick)*

---

## Suggested demo order (5 min)

See [DEMO-SCRIPT.md](DEMO-SCRIPT.md) for the full shot-by-shot version.

1. Open the link → **Load sample (Kodiak Site 14)** → the panel fills in.
2. Step 2: show the searchable catalog and the EMIT Recommended / Limited
   templates.
3. Step 3: **Auto Map** → 27/27. Point out that **DO-904 landed on DO 7, a Form-C
   port**.
4. Drag the fail-safe relay onto DO 1 → **rejected, with a reason**. Drag it onto
   DO 8 → accepted.
5. **Preview XML** → **Export**. Toggle **dark mode**. Mention `npm run
   check:all` (17 gates, 85% coverage) and the per-folder `CLAUDE.md` consistency
   story.
