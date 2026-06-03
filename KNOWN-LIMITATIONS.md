# Known Limitations

An honest list of what's still rough or unfinished, and what changed recently.

---

## Recently handled

These used to be gaps. They now work, and they ship with tests:

- **Thermocouple type (K/J) check.** Each TC port carries a `tcType`. `canMap()`
  rejects a Type-J sensor on a Type-K channel and says why. Today every catalog
  TC item is Type-K, so all TC ports default to K. The rule is there for the day
  a J sensor is added.
- **CAN-bus termination warning.** `validation/can-termination.ts` warns when the
  120 Ω terminator is on the wrong node for the BRAIN / BRAIN+ / AFR combo. The
  mapping screen has a small control to set it.
- **Duplicate I/O entries.** The catalog no longer blocks adding the same item
  twice. Each add gets a fresh `io-####` id.
- **Notes in the XML.** The `<IO notes>` attribute now carries whatever the user
  typed. A test locks this so it can't slip back.
- **Stage / cooler filtering.** The catalog hides items for a stage or cooler
  section the compressor doesn't have, based on the name (for example, "Stage 3
  …" is hidden on a 2-stage unit).
- **Keyboard mapping.** dnd-kit's `KeyboardSensor` is wired up, so you can map
  ports without a mouse.
- **Auto Map order.** Auto Map runs the same way every time. It puts fail-safe
  relays on the Form-C ports first, so a normal relay can't steal DO 7/8.
- **Lambda stub.** `lambda/` has a DynamoDB-backed handler, and
  `services/fetch-config.ts` is a `FetchConfigService` that uses the same
  interface as the localStorage version.
- **End-to-end tests.** A Playwright happy-path spec walks setup → template →
  auto-map → export, plus visual snapshots at three screen sizes.
- **Pin numbers on the backplate.** Every port slot now shows its real terminal
  numbers.

---

## Still rough

### The backplate is grouped, not a true physical strip

Ports show by type group (AI, TC, and so on) with their pin numbers. They aren't
laid out as the two long terminal strips in their exact physical order. An
engineer will recognize the channels and pins, but it isn't a 1:1 copy of the
panel drawing.

### BRAIN+ P2 ports reuse the P1 logical ids

P1 ports are `AI13-P1`, `DO9-P1`. P2 mirrors them as `AI13-P2`, and the XML strips
the slot suffix (`port="AI13"`). This matches the sample export, which has one
BRAIN+. If EMIT ever needs to tell P1 and P2 `AI13` apart in one file, the id
scheme has to change.

### Config names aren't forced to be unique

"Save as new version" keeps old versions and bumps the version number, which
covers the common case. But two saves with the same name and the same id still
overwrite each other. There's no hard "name already taken" check.

### Not every step blocks on every rule

Step 1 shows a message per field. Step 3 warns about capacity, an unmapped
fail-safe relay, and CAN termination, and it blocks export when a fail-safe relay
is unmapped. Other soft issues show as warnings, not hard stops.

### localStorage has no size guard

`localStorage` is about 5 MB per origin. A very large panel could get close.
There's no try/catch around `setItem` yet to warn you when storage is full.

### Visual snapshots are local baselines

The Playwright visual baselines are made on the machine that runs them. Font
rendering differs across operating systems, so a shared CI baseline would need
its own run (or a container) to avoid noise.
