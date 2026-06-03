import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { useWizardStore } from "@/store/wizard";
import { PrintDrawing } from "./print-drawing";

describe("PrintDrawing", () => {
  beforeEach(() => useWizardStore.getState().reset());

  it("renders the I/O drawing for the current config", () => {
    const s = useWizardStore.getState();
    s.setConfigName("Kodiak Site 14");
    s.applyTemplate("recommended");
    s.autoMap();
    render(<PrintDrawing />);
    // The drawing is portaled to document.body; screen queries the whole body.
    expect(screen.getByText("Kodiak Site 14")).toBeInTheDocument();
    expect(screen.getByText(/Auto-generated I\/O summary/)).toBeInTheDocument();
    expect(screen.getByText("Mapped")).toBeInTheDocument();
  });

  it("falls back to 'Untitled Configuration' when the config is unnamed", () => {
    render(<PrintDrawing />);
    expect(screen.getByText("Untitled Configuration")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    useWizardStore.getState().applyTemplate("recommended");
    const { baseElement } = render(<PrintDrawing />);
    expect(await axe(baseElement)).toHaveNoViolations();
  });
});
