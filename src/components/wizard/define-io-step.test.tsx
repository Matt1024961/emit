import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { getRecommendedItems } from "@/catalog/io-catalog";
import { useWizardStore } from "@/store/wizard";
import { DefineIOStep } from "./define-io-step";

describe("DefineIOStep", () => {
  beforeEach(() => useWizardStore.getState().reset());

  it("renders the catalog and the empty active list", () => {
    render(<DefineIOStep />);
    expect(screen.getByText("Define I/O Requirements")).toBeInTheDocument();
    expect(screen.getByText("No I/O items yet")).toBeInTheDocument();
  });

  it("applies the EMIT Recommended template", async () => {
    const user = userEvent.setup();
    render(<DefineIOStep />);
    await user.click(screen.getByRole("button", { name: "EMIT Recommended" }));
    expect(useWizardStore.getState().activeIO).toHaveLength(getRecommendedItems().length);
  });

  it("clears all items", async () => {
    const user = userEvent.setup();
    render(<DefineIOStep />);
    await user.click(screen.getByRole("button", { name: "EMIT Limited" }));
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(useWizardStore.getState().activeIO).toHaveLength(0);
  });

  it("warns when capacity is exceeded", async () => {
    const user = userEvent.setup();
    render(<DefineIOStep />);
    // 13 AI items overflow BRAIN's 12 AI ports.
    const store = useWizardStore.getState();
    for (let i = 0; i < 13; i += 1) {
      store.addIOFromCatalog({
        tag: `PT-${i}`,
        name: `Pressure ${i}`,
        category: "Input",
        signal: "4-20mA",
        range: "0-100 PSI",
        hardwareHint: "AI",
        formC: false,
        tcType: null,
        group: "Pressure",
        inRecommended: false,
        inLimited: false,
      });
    }
    render(<DefineIOStep />);
    expect(screen.getAllByText(/Port capacity exceeded/).length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "Clear all" })[0]);
  });

  it("has no a11y violations", async () => {
    const { container } = render(<DefineIOStep />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
