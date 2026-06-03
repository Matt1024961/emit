import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import type { Equipment, HardwareConfig } from "@/types/config";
import type { ActiveIOItem } from "@/types/io";
import type { PortMapping } from "@/types/port";
import { PrintView } from "./print-view";

// --- Fixtures ---

const equipment: Equipment = {
  engineType: "Caterpillar G3516",
  compressorModel: "Ariel JGC/4",
  stages: 4,
  coolerSections: 2,
};

const hardware: HardwareConfig = { brainPlusCount: 1 };

/** AI1 → mapped to BRAIN analog input port, pin 51 */
const ioAnalog: ActiveIOItem = {
  id: "io-1",
  tag: "PT-101",
  name: "Suction Pressure",
  category: "Input",
  signal: "4-20mA",
  range: "0–100 psi",
  hardwareHint: "AI",
  formC: false,
  tcType: null,
  group: "Pressures",
  notes: "Stage 1 suction",
};

/** DO7 → mapped to BRAIN Form-C relay port, pin 74 */
const ioRelay: ActiveIOItem = {
  id: "io-2",
  tag: "SOL-101",
  name: "Bypass Solenoid",
  category: "Output",
  signal: "Relay-NC",
  range: "",
  hardwareHint: "DO",
  formC: true,
  tcType: null,
  group: "Outputs",
  notes: "",
};

/** Unmapped — no entry in mappings array */
const ioUnmapped: ActiveIOItem = {
  id: "io-3",
  tag: "TT-202",
  name: "Discharge Temp",
  category: "Input",
  signal: "TC-K",
  range: "0–500 °F",
  hardwareHint: "TC",
  formC: false,
  tcType: "K",
  group: "Temperatures",
  notes: "",
};

const mappings: PortMapping[] = [
  { ioId: "io-1", portId: "AI1", device: "BRAIN" },
  { ioId: "io-2", portId: "DO7", device: "BRAIN" },
];

function renderPrintView(overrideMappings: PortMapping[] = mappings) {
  return render(
    <PrintView
      name="Unit 12 — Stage 4 Compressor"
      equipment={equipment}
      hardware={hardware}
      activeIO={[ioAnalog, ioRelay, ioUnmapped]}
      mappings={overrideMappings}
    />
  );
}

// --- Tests ---

describe("PrintView", () => {
  it("renders the configuration name in the header", () => {
    renderPrintView();
    expect(screen.getByText("Unit 12 — Stage 4 Compressor")).toBeInTheDocument();
  });

  it("renders engine and compressor model", () => {
    renderPrintView();
    expect(screen.getByText("Caterpillar G3516")).toBeInTheDocument();
    expect(screen.getByText("Ariel JGC/4")).toBeInTheDocument();
  });

  it("renders stages and cooler counts", () => {
    renderPrintView();
    expect(screen.getByText("4 / 2")).toBeInTheDocument();
  });

  it("renders the mapped count summary", () => {
    renderPrintView();
    // Two of the three fixture items are mapped.
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
  });

  it("shows BRAIN+ count in hardware summary", () => {
    renderPrintView();
    expect(screen.getByText("BRAIN + 1 × BRAIN+")).toBeInTheDocument();
  });

  it("shows 'None' for hardware when brainPlusCount is 0", () => {
    render(
      <PrintView
        name="Minimal Config"
        equipment={equipment}
        hardware={{ brainPlusCount: 0 }}
        activeIO={[]}
        mappings={[]}
      />
    );
    expect(screen.getByText("BRAIN + None")).toBeInTheDocument();
  });

  it("renders the port label and pin number for a mapped analog input row", () => {
    renderPrintView();
    // AI1 → label "AI 1", pin 51
    expect(screen.getByText("AI 1")).toBeInTheDocument();
    expect(screen.getByText("51")).toBeInTheDocument();
  });

  it("renders the port label and pin number for a mapped Form-C relay row", () => {
    renderPrintView();
    // DO7 → label "DO 7 (Form-C)", pin 74
    expect(screen.getByText("DO 7 (Form-C)")).toBeInTheDocument();
    expect(screen.getByText("74")).toBeInTheDocument();
  });

  it("shows dashes and Unmapped treatment for an unmapped row", () => {
    renderPrintView();
    // The unmapped row has tag TT-202; its notes cell should say "Unmapped"
    expect(screen.getByText("Unmapped")).toBeInTheDocument();
  });

  it("renders all three I/O tags", () => {
    renderPrintView();
    expect(screen.getByText("PT-101")).toBeInTheDocument();
    expect(screen.getByText("SOL-101")).toBeInTheDocument();
    expect(screen.getByText("TT-202")).toBeInTheDocument();
  });

  it("renders an inline note when a mapped item has notes", () => {
    renderPrintView();
    expect(screen.getByText("Stage 1 suction")).toBeInTheDocument();
  });

  it("renders the auto-generated caption", () => {
    renderPrintView();
    expect(screen.getByText(/Auto-generated I\/O summary/)).toBeInTheDocument();
  });

  it("shows empty-list message when activeIO is empty", () => {
    render(
      <PrintView
        name="Empty"
        equipment={equipment}
        hardware={hardware}
        activeIO={[]}
        mappings={[]}
      />
    );
    expect(screen.getByText("No I/O items configured.")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = renderPrintView();
    expect(await axe(container)).toHaveNoViolations();
  });
});
