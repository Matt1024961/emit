# Demo Script (3–5 minute Loom)

A shot-by-shot guide for recording the walkthrough. Each step says what to click
and what to say. Total time: about 4 minutes.

Before you record: open the deployed link (or run `npm run dev`). Start on the
Setup screen in light mode.

---

## 1. Open and load the sample (30 sec)

**Do:** Click **Load sample (Kodiak Site 14)**. The panel fills in and jumps to
Define I/O.

**Say:** "This tool sets up the I/O for an EMIT gas-compressor control panel. One
click loads a full example, so you can see the whole flow. It picked a compressor
model, an engine, and a list of I/O for a Kodiak site."

## 2. Show the catalog and templates (40 sec)

**Do:** Point at the search box on the left. Type "pressure" in it. Clear it.
Point at the **EMIT Recommended** and **EMIT Limited** template buttons.

**Say:** "The catalog is plain config data. A colleague can add an I/O item by
editing one file. You can search it, or start from a template. The list only
shows items that fit this compressor's stages and cooler sections."

## 3. Go to mapping and Auto Map (40 sec)

**Do:** Click **Continue to Mapping →**. On the mapping screen, click **Auto
Map**.

**Say:** "Now I map each signal to a real port on the BRAIN controller. Auto Map
fills every port. It went 27 of 27. The backplate shows real pin numbers, so an
engineer recognizes their own panel."

**Point out:** "The fail-safe shutdown relay, DO-904, landed on DO 7. That's a
Form-C port — the only output that opens when power is lost. Auto Map saves those
ports for fail-safe relays first."

## 4. Show a rejected mapping (40 sec)

**Do:** Drag the fail-safe relay onto **DO 1**. It turns red and is rejected.
Drag it onto **DO 8**. It is accepted.

**Say:** "If I try to put the fail-safe relay on a normal output like DO 1, the
app blocks it and says why. A Form-C port like DO 8 is fine. The same rules run
for Auto Map, drag-and-drop, and import. So you can't end up with an unsafe
panel."

## 5. Preview and export the XML (30 sec)

**Do:** Click **Preview XML**. Scroll the highlighted XML. Click **Copy**, then
close. Click **Export XML**.

**Say:** "Before I download, I can preview the exact XML and copy it. Export
downloads the file that EMIT's other tools read. I can re-import this file later
and get the same panel back."

## 6. Dark mode and quality (20 sec)

**Do:** Toggle **dark mode** from the header.

**Say:** "Light and dark both work. Under the hood, `npm run check:all` runs 17
quality gates at 85% test coverage. And each folder has its own short guide, so
the codebase stays consistent."

---

## Extra talking points (if you have time)

- **Undo/redo** the last mapping change.
- **Save as new version** to keep a panel's history.
- **Print** a clean I/O summary (tag → port → pins).
- Add a **BRAIN+** expansion and watch the CAN termination warning update.
- Map a port with the **keyboard** (Space to grab, arrows to move, Space to
  drop).
