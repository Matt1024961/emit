import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { Configuration } from "@/types/config";
import type { ActiveIOItem } from "@/types/io";
import type { PortMapping } from "@/types/port";
import { XmlPreviewDialog } from "./xml-preview-dialog";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ioItem: ActiveIOItem = {
  id: "io-0001",
  tag: "PT-101",
  name: "Stage 1 Suction Pressure",
  category: "Input",
  signal: "4-20mA",
  range: "0-300 PSI",
  hardwareHint: "AI",
  formC: false,
  tcType: null,
  group: "Pressure",
  notes: "",
};

const mapping: PortMapping = { ioId: "io-0001", portId: "AI1", device: "BRAIN" };

const fixture: Configuration = {
  id: "cfg-preview-001",
  name: "Kodiak Site 14",
  description: "Test configuration for preview",
  version: 1,
  createdAt: "2026-06-02T10:00:00.000Z",
  updatedAt: "2026-06-02T10:00:00.000Z",
  equipment: {
    engineType: "CAT-3516",
    compressorModel: "JGC/4",
    stages: 3,
    coolerSections: 2,
  },
  hardware: { brainPlusCount: 0 },
  activeIO: [ioItem],
  mappings: [mapping],
};

// ---------------------------------------------------------------------------
// Clipboard mock
// ---------------------------------------------------------------------------

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  // jsdom exposes navigator.clipboard as a getter-only property, so a plain
  // assignment can't replace it — define a data property instead.
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  writeText.mockClear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("XmlPreviewDialog", () => {
  it("renders the dialog title when open", () => {
    render(<XmlPreviewDialog config={fixture} open onOpenChange={() => {}} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Preview XML")).toBeInTheDocument();
  });

  it("renders the DialogDescription", () => {
    render(<XmlPreviewDialog config={fixture} open onOpenChange={() => {}} />);
    expect(screen.getByText(/Generated PanelConfiguration XML/)).toBeInTheDocument();
  });

  it("renders the PanelConfiguration root element in the code block", () => {
    render(<XmlPreviewDialog config={fixture} open onOpenChange={() => {}} />);
    expect(screen.getByRole("dialog").textContent).toContain("PanelConfiguration");
  });

  it("renders the config name in the XML output", () => {
    render(<XmlPreviewDialog config={fixture} open onOpenChange={() => {}} />);
    expect(screen.getByRole("dialog").textContent).toContain("Kodiak Site 14");
  });

  it("renders the XML declaration in the code block", () => {
    render(<XmlPreviewDialog config={fixture} open onOpenChange={() => {}} />);
    expect(screen.getByRole("dialog").textContent).toContain("<?xml");
  });

  it("does not render dialog content when closed", () => {
    render(<XmlPreviewDialog config={fixture} open={false} onOpenChange={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls navigator.clipboard.writeText with the XML on Copy click", async () => {
    const user = userEvent.setup();
    // userEvent.setup() installs its own clipboard, so re-pin our spy afterward.
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<XmlPreviewDialog config={fixture} open onOpenChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Copy XML to clipboard" }));
    expect(writeText).toHaveBeenCalledTimes(1);
    const [arg] = writeText.mock.calls[0] as [string];
    expect(arg).toContain("<PanelConfiguration");
  });

  it("shows Copied state after the copy button is clicked", async () => {
    const user = userEvent.setup();
    render(<XmlPreviewDialog config={fixture} open onOpenChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Copy XML to clipboard" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copied to clipboard" })).toBeInTheDocument()
    );
  });

  it("resets copied state when the dialog closes and reopens", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<XmlPreviewDialog config={fixture} open onOpenChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Copy XML to clipboard" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copied to clipboard" })).toBeInTheDocument()
    );

    // Close then reopen
    rerender(<XmlPreviewDialog config={fixture} open={false} onOpenChange={() => {}} />);
    rerender(<XmlPreviewDialog config={fixture} open onOpenChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Copy XML to clipboard" })).toBeInTheDocument();
  });

  it("calls onOpenChange when the dialog requests a close", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<XmlPreviewDialog config={fixture} open onOpenChange={onOpenChange} />);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <XmlPreviewDialog config={fixture} open onOpenChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
