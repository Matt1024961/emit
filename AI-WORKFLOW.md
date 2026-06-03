# AI-Assisted Development Workflow

I built this project with Claude Code (claude-sonnet-4-6) as the main AI
assistant. Here is an honest account of how I used it — where I kept the AI's
output, where I changed it, and where I threw it out.

---

## How I used Claude Code

### Phase 1: Plan before writing any code

Before I wrote anything, I asked Claude to read all five reference files (the
README, brain-pinouts.md, io-catalog.csv, and both sample XML exports) and write
a full plan. The plan had to cover the data model, the hardware port catalog, the
validation rules, the service layer, and the component structure.

**Why this matters:** The most common way AI-assisted work goes wrong is writing
code before the data model is right. I used this planning pass to find the
unclear parts. The big one was a conflict: the internal brief describes a Lambda
backend, but the assignment README says frontend-only. Claude spotted the
conflict and proposed the fix — the `ConfigurationService` interface. Build to
the interface now, use `localStorage` today, swap in `fetch()` later.

**The prompt I used:**

> "Read all five reference files in detail. Identify: (1) the canonical data types we need, (2) the complete BRAIN/BRAIN+ port catalog from the schematic, (3) every validation rule that has hardware safety implications, (4) the XML schema from the sample files. Then design the directory structure and type model. Flag any ambiguities you find. Do not write any code yet."

---

### Phase 2: Build from the bottom up

After I approved the plan, I built in dependency order: types → catalog data →
hardware ports → validation rules → XML generator → service layer → Zustand store
→ UI components. That way each layer could be tested before the next one needed
it.

**Claude's job:** write the first draft of each file. **My job:** check it was
correct, match it against the hardware spec, and catch the spots where the AI
guessed wrong.

---

## Where I rejected or rewrote the AI's output

### Example 1: The `UnmappedIOPanel` Zustand selector bug

Claude's first `UnmappedIOPanel` had this:

```tsx
const unmapped = useWizardStore((s) => s.getUnmappedItems());
```

At runtime this caused an infinite re-render loop. Here's why:
`getUnmappedItems()` returns a new array every time it's called. Zustand's
`useStore` hook uses reference equality to decide whether to re-render. A new
array every time means it always looks changed, so it re-renders forever —
"Maximum update depth exceeded."

**What I changed:** I rewrote the selector to read raw state and compute the list
in the component:

```tsx
const activeIO = useWizardStore((s) => s.activeIO);
const mappings = useWizardStore((s) => s.mappings);
const unmapped = useMemo(() => {
  const mappedIds = new Set(mappings.map((m) => m.ioId));
  return activeIO.filter((item) => !mappedIds.has(item.id));
}, [activeIO, mappings]);
```

**Why it matters:** This is the kind of bug Claude gets wrong because the code
looks fine when you just read it. It only shows up at runtime, with React's
concurrent renderer. I caught it by running the real app, not by reading the
code.

### Example 2: Hardware port numbering for AO ports

Claude's first `brain.ts` put AO3 and AO4 on the BRAIN module. I rejected that.
The pinout document says plainly that "AO 3/4 not present on base," and the sample
XML (`export-Kodiak-Site-14-JGC4-Recommended-v1.xml`) only uses AO1 and AO2 —
with AO3/AO4 showing up only on BRAIN+. I fixed the BRAIN module to have only
AO1, AO2, AO5, AO6, and moved AO3/AO4 to `brain-plus.ts`.

**Lesson:** Claude can write hardware data that looks right but doesn't match the
real schematic. Hardware specs have to be checked line by line.

### Example 3: Where the Form-C check lives

Claude first put the Form-C check inside the `PortSlot` component, as a
visual-only check. I moved it into `src/validation/rules.ts` as a real rule that
`canMap()` enforces. This matters because the store's `addMapping` action also
calls `canMap()`. So the rule holds even when a mapping is added by code — Auto
Map, or Load from a save. A visual-only check can be bypassed.

---

## Prompts I used, word for word

**Prompt 1 — Planning:**
> "Read all five reference files in detail. Identify: (1) the canonical data types we need, (2) the complete BRAIN/BRAIN+ port catalog from the schematic, (3) every validation rule that has hardware safety implications, (4) the XML schema from the sample files. Then design the directory structure and type model. Flag any ambiguities you find. Do not write any code yet."

**Prompt 2 — Validation rules module:**
> "Write `src/validation/rules.ts` and `src/validation/rules.test.ts`. The rules file must export `canMap(item, port): ValidationResult`. Cover: all seven signal types mapped to port types, the Form-C constraint (Relay-NC → only DO7 or DO8), and `getCapacityWarning`. The tests must cover: the full signal→port compatibility matrix, Form-C rejection on DO1–DO6, Form-C acceptance on DO7 and DO8, Form-C rejection on all BRAIN+ DO ports, and capacity overflow detection."

**Prompt 3 — XML generator:**
> "Write `src/xml/generate.ts`. It must produce deterministic output matching `export-Kodiak-Site-14-JGC4-Recommended-v1.xml`. Same input → same XML bytes. Mappings must be sorted AI → AO → DI → DO → TC → MAG. Include `downloadXml()` that triggers a browser Blob download. Write `generate.test.ts` covering: XML declaration, all five sections present, BRAIN+ expansion tags correct, UnmappedIO self-closing when empty, mapping sort order, XML escaping, and determinism."

---

## Phase 3: Adding features with a fleet of agents

The second wave of work used a different shape. That work included the sample
loader, XML import, the Form-C-aware Auto Map, the thermocouple and CAN checks,
undo/redo, toasts, the print view, and more. I ran many agents at once. Each one
owned its own set of files, so they couldn't step on each other. Then I wired the
pieces into the shared store and the screens myself, and ran the quality gate
after each step.

**Why split it this way:** the gate is strict — 300-line files, no `any`, no
suppressions, 85% coverage, accessibility checks. Agents editing the same file at
the same time would clobber each other and break the gate. So new logic went into
new modules, one agent each. The few hot files — the store, the mapping screen —
I changed one at a time.

### Where I caught the AI getting it wrong

**The stage filter hid the wrong items.** The first version guessed an item's
stage from the hundreds digit of its tag number. That looked clever, but it hid
"Engine RPM" (tag SI-202) on a 1-stage compressor, because the 2 read as "stage
2." I rewrote it to read only an explicit "Stage 3" in the item name. Tag numbers
aren't a safe stage signal.

**Banned syntax in tests.** An agent wrote test code with the `!` non-null
operator (`ports.find(...)!`). Biome bans it, and the project bans inline
suppressions. So I rewrote them with optional chaining
(`ports.find(...)?.isFormC`). The lesson: tell the agent the lint rules up front,
and still check.

**A test that mocked the wrong thing.** The XML preview copy-button test stubbed
`navigator.clipboard`. But `userEvent.setup()` installs its own clipboard after
that, so the stub never ran. I re-pinned the spy after setup and checked the spy
directly.

### A prompt pattern that worked

Every agent got the same header, so its output would pass the gate on the first
try:

> "Work in this repo. You OWN only these files: [list]. Do NOT edit anything else and do NOT run build/test commands (other agents are editing in parallel). Follow the gate: no `any`, no `console`, no suppression comments, files under 300 lines, JSDoc on exported functions, tests with an `axe()` check for components. Return the files you changed and any assumptions."

Naming the owned files and the rules up front is what made parallel work safe.

---

## Speed vs. checking

AI-assisted work on this project was about 3–4× faster than writing it all by
hand. Here's where I slowed down and checked carefully:

- Hardware port definitions (checked against brain-pinouts.md line by line)
- Validation rule coverage (ran the tests, read the sample XML)
- The Zustand selector patterns (tested in the live app)

And here's where I trusted Claude more:

- Boilerplate (TypeScript types, Tailwind class names, Vite and Biome config)
- XML escaping and string building
- The shape of Vitest test files
