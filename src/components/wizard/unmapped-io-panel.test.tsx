import { DndContext } from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { useWizardStore } from "@/store/wizard";
import { UnmappedIOPanel } from "./unmapped-io-panel";

function renderPanel() {
  return render(
    <DndContext>
      <UnmappedIOPanel />
    </DndContext>
  );
}

describe("UnmappedIOPanel", () => {
  beforeEach(() => useWizardStore.getState().reset());

  it("lists unmapped items with a remaining count", () => {
    useWizardStore.getState().applyTemplate("limited");
    renderPanel();
    const total = useWizardStore.getState().activeIO.length;
    expect(screen.getByText(`${total} remaining`)).toBeInTheDocument();
    expect(screen.getByText("ESD Pushbutton")).toBeInTheDocument();
  });

  it("shows the all-mapped state when nothing is unmapped", () => {
    renderPanel();
    expect(screen.getByText("All items mapped")).toBeInTheDocument();
  });

  it("shows a no-matches state when the filter excludes everything", async () => {
    const user = userEvent.setup();
    useWizardStore.getState().applyTemplate("limited");
    renderPanel();
    await user.type(screen.getByLabelText("Filter unmapped I/O"), "nonexistent");
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    useWizardStore.getState().applyTemplate("limited");
    const { container } = renderPanel();
    expect(await axe(container)).toHaveNoViolations();
  });
});
