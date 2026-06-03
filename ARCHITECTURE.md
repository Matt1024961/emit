# Architecture

## Why these choices

### Frontend-only, with a service layer ready for Lambda

The assignment README asks for a browser-only app that uses `localStorage`. But
an older internal brief describes an AWS Lambda and API Gateway backend, with
parts still marked `<System Architect To Complete>`. So the two documents didn't
agree.

I bridged the gap with a typed `ConfigurationService` interface in
`src/services/types.ts`. Right now it saves to `localStorage`. To switch to real
API calls, you write one class — `FetchConfigService implements
ConfigurationService` — and wire it in at the app root. No components change. The
interface has four methods: `save`, `load`, `list`, and `delete`. Those line up
with the four Lambda endpoints the brief implies.

### Catalog as config

The brief asks: can a colleague add to the I/O catalog by editing a config file,
not code? Yes. `src/catalog/io-catalog.ts` is a plain TypeScript array of
`CatalogItem` objects, built from `io-catalog.csv`. TypeScript checks the shape
for you. Adding an I/O item is one new line in the array. No validation logic,
component, or route has to change. The same goes for `compressor-models.ts` and
`engine-types.ts`.

### Validation in one place, not scattered

All the mapping rules live in `src/validation/rules.ts`, with a test file next to
it. No rule logic sits in the components. A component calls `canMap(item, port)`
and shows the `reason` string it gets back. It doesn't need to know why something
is invalid. So the hardware rules are easy to audit in one place, and easy to
test without rendering anything.

### Zustand over Redux

This is a single standalone frontend app, not a monorepo that shares state across
packages. Redux earns its keep at that larger scale (central devtools, a
middleware pipeline, cross-package subscriptions). For a one-page wizard this
size, Zustand's store-per-concern style is cleaner and has less boilerplate. The
stores (`wizard.ts`, `saved.ts`) are still layered the way a Redux slice would
be.

### @dnd-kit over react-beautiful-dnd or HTML5 drag

`react-beautiful-dnd` is no longer maintained. HTML5 drag-and-drop fires events
that don't fit React's event model well, and it has no touch support. `@dnd-kit`
is accessible (it puts ARIA attributes on the draggable and droppable parts),
works on touch, has a small bundle, and gives you `DragOverlay` for the
ghost-card look.

### shadcn/ui for the components

The UI primitives are **shadcn/ui** — Radix UI behavior, class-variance-authority
variants, and the `cn()` class-merge helper. This gives you accessible,
well-tested primitives (focus handling, keyboard nav, portals, ARIA) for free,
instead of hand-building them.

- **`components/ui/`** holds the copied-in shadcn primitives (`button`, `card`,
  `input`, `textarea`, `label`, `badge`, `select`, `dialog`, `tooltip`,
  `separator`, `progress`, `dropdown-menu`). The `badge` adds domain variants
  (`success` / `warning` / `info` / `primary` / `muted`) that drive the signal-
  and port-type colors.
- **`components/wizard/`** holds the feature parts that use those primitives: the
  three step bodies, the catalog / active / unmapped panels, `BackplateViz` and
  `PortSlot`, `SaveLoadModal` (a shadcn `Dialog`), `StepIndicator`, and the
  `WizardShell` that wraps the header, content, and footer.
- **Icons** are plain lucide components placed inside shadcn `Button`s. The shared
  `IconButton` wraps `Button` and `Tooltip`, so every icon action has a name and
  a hover tooltip.

### Theming: shadcn variables, EMIT brand, dark-first

`src/index.css` follows the shadcn Tailwind-v4 pattern. Semantic CSS variables
live on `:root` (light) and `.dark`, and map to Tailwind utilities through
`@theme inline`. The *values* match the EMIT brand: a near-black navy base
(`#070c17`), deep-navy surfaces, a burnt-orange accent (`--primary: #d2722e`),
and off-white text, with the Barlow font (JetBrains Mono for port and pin
labels). A few `emit-*` utility classes add the blueprint grid, the hero wash,
and the orange glow. The app starts dark (both the `index.html` boot script and
`ThemeProvider` default to `dark`), and light and system are still there.
Components use semantic classes (`bg-card`, `text-muted-foreground`,
`border-border`), never raw color values — so the whole reskin lived in one file,
`index.css`.

`ThemeProvider` (`components/theme/`) saves the choice (`light` / `dark` /
`system`) to `localStorage` and toggles the `.dark` class on `<html>`. A small
inline script in `index.html` applies it before the first paint, so the theme
doesn't flash. `ModeToggle` is the header switch.

### Form validation: a clear message per field

The Step 1 setup form checks its required fields with `validateSetup()`
(`components/wizard/setup-validation.ts`). It's a pure function that returns a map
of field names to messages a user can read. The form (`id="setup-form"`) is
submitted by the footer "Continue" button (`form="setup-form"`). On a bad submit,
each empty required field shows its own message (for example, "Select a
compressor model to continue."), sets `aria-invalid`, and links the message with
`aria-describedby`. The messages then clear as each field is fixed. The logic is
a tested pure function, kept apart from the rendering.

---

## Data model

```
CatalogItem          -- static seed data (src/catalog/io-catalog.ts)
    ↓ addIOFromCatalog()
ActiveIOItem         -- the user's live list, with an id and notes
    ↓ addMapping()
PortMapping          -- ioId → portId + device + optional slot

Configuration        -- a saved snapshot: equipment + hardware + activeIO + mappings
```

`ActiveIOItem` is a `CatalogItem` minus the template flags, plus an `id` and a
`notes` field. The `id` counts up (`io-0001`, `io-0002`, …) to match the XML
shape in the sample exports.

---

## Hardware model

The BRAIN and BRAIN+ port definitions live in `src/hardware/`. Each `Port` object
carries:

- `id` — its logical key (`"AI1"`, `"DO7"`, `"TC3"`, `"MAG"`)
- `device` / `slot` — which physical module it's on
- `type` — the port type (`AI | AO | DI | DO | TC | MAG`)
- `pinNumbers` — the real terminal numbers from the schematic (so you can trace
  them)
- `isFormC` — `true` only for DO7 and DO8 on the BRAIN; the only NC-contact
  outputs

`getAvailablePorts(brainPlusCount)` in `src/hardware/index.ts` returns the BRAIN
ports plus any BRAIN+ modules the user picked. If you reduce the hardware, the
app drops the mappings that no longer have a port.

---

## Validation rules

`canMap(item, port): ValidationResult` enforces:

1. **Signal to port type**: `4-20mA Input → AI`, `4-20mA Output → AO`,
   `DryContact → DI`, `Relay → DO`, `Relay-NC → DO`, `TC-K/J → TC`,
   `Pulse → MAG`.
2. **Form-C rule**: a `Relay-NC` (fail-safe, NC contact) can only map to a port
   with `isFormC: true`. Those are just DO7 and DO8 on the BRAIN. All BRAIN+ DO
   ports are Form-A.
3. **Capacity warning**: `getCapacityWarning()` counts the ports each type needs
   against the ports available, and returns a plain message if there aren't
   enough.

One item per port is enforced in the store's `addMapping` action. It removes any
old mapping on that port before it adds the new one.

---

## XML generator

`generateXml(config)` in `src/xml/generate.ts` produces the same output every
time:

- `<IO>` elements in `activeIO` order, numbered `io-0001` …
- `<Mapping>` elements sorted AI → AO → DI → DO → TC → MAG (this matches the
  sample files)
- `<UnmappedIO>` is a self-closing tag when there's nothing in it

The generator doesn't touch the DOM, so it's tested in Node with Vitest.

---

## State management

```
useWizardStore        -- the active wizard session (step, equipment, hardware, activeIO, mappings)
useSavedConfigsStore  -- the list of saved configs from the service layer
```

Every change goes through a store action. Components read slices and call
actions. They never write to state on their own.

---

## Judgment calls

| Decision | Why |
|---|---|
| Show port labels by type group, not by single pin numbers | The XML uses logical port names (AI1, DO7); the pin numbers in `Port.pinNumbers` are there for tracing, not for clicking |
| Leave DI1 (E-STOP, pin 11) out of the assignable ports | The schematic treats E-STOP as a dedicated input; it's in no sample mapping |
| Leave AO3/4 off the BRAIN base | The schematic puts AO3/4 only on BRAIN+; the sample XML confirms AO1/2/5/6 on the BRAIN |
| Auto Map puts Relay-NC on DO7 first, DO8 second | The schematic shows DO7 before DO8; the sample XML uses DO7 for the fail-safe relay |
| Reducing the hardware clears orphaned mappings | Better than quietly leaving references to ports that are gone |

---

## Feature expansion: new modules and decisions

The later feature work followed the same rules: pure logic in small, tested
modules, with the screens only putting the pieces together.

### New modules

- `store/auto-map.ts` + `store/default-mappings.ts` — the set-order Auto Map. The
  store action just calls `computeAutoMap`.
- `catalog/stage-filter.ts` — hides catalog items for stages or cooler sections
  the compressor doesn't have. It reads the item name only (tag numbers aren't a
  safe stage signal).
- `catalog/sample-kodiak.ts` — the one-click sample panel.
- `validation/can-termination.ts` — the CAN-bus terminator warning.
- `xml/parse.ts` — turns an exported XML back into a `Configuration`. A
  round-trip test checks that `generate(parse(generate(x)))` is the same bytes as
  `generate(x)`.
- `services/fetch-config.ts` + `lambda/` — a `FetchConfigService` and a DynamoDB
  Lambda handler that match the same `ConfigurationService` interface.
- `lib/build-config.ts` — the one place that builds a `Configuration` from the
  wizard draft, shared by save, export, and preview.

### Decisions

- **Thermocouple type on the port.** Each TC `Port` carries a `tcType`. `canMap`
  rejects a mismatch. Every catalog TC item is Type-K today, so ports default to
  K. The rule is there for the day a J sensor is added.
- **Auto Map saves the Form-C ports.** A plain greedy fill let a normal relay
  take DO 7/8, which left the fail-safe relay with nowhere to go. Auto Map now
  puts fail-safe (Relay-NC) signals on the Form-C ports first.
- **Export stops on an unmapped fail-safe.** A shutdown relay with no port is a
  safety hole, so export halts and names the tag that's missing.
- **Undo/redo with zundo.** The `temporal` middleware tracks the I/O list and the
  mappings. Undo and redo only touch the user's design work, not the wizard step.
- **Code-split the step bodies.** The three steps are `React.lazy`, so the first
  paint loads a smaller chunk.
- **Keep the XML a contract.** On import, the app rebuilds the fields the XML
  doesn't carry (like `hardwareHint`) from the signal, so a round-trip stays
  stable.
