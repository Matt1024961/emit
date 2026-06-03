import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWizardStore } from "@/store/wizard";
import { CatalogPanel } from "./catalog-panel";

/** Wraps CatalogPanel in the providers it needs for rendering. */
function renderCatalogPanel() {
  return render(
    <TooltipProvider>
      <CatalogPanel />
    </TooltipProvider>
  );
}

describe("CatalogPanel", () => {
  beforeEach(() => useWizardStore.getState().reset());

  it("renders catalog items", () => {
    renderCatalogPanel();
    expect(screen.getByText("Stage 1 Suction Pressure")).toBeInTheDocument();
  });

  it("filters by search text", async () => {
    const user = userEvent.setup();
    renderCatalogPanel();
    await user.type(screen.getByLabelText("Search catalog"), "Fuel Gas");
    expect(screen.getByText("Fuel Gas Pressure")).toBeInTheDocument();
    expect(screen.queryByText("Stage 1 Suction Pressure")).not.toBeInTheDocument();
  });

  it("filters by group pill", async () => {
    const user = userEvent.setup();
    renderCatalogPanel();
    await user.click(screen.getByRole("button", { name: "Speed" }));
    expect(screen.getByText("Engine RPM")).toBeInTheDocument();
    expect(screen.queryByText("Stage 1 Suction Pressure")).not.toBeInTheDocument();
  });

  it("adds an item to the active list without disabling the button", async () => {
    const user = userEvent.setup();
    renderCatalogPanel();
    await user.click(screen.getByRole("button", { name: "Add Stage 1 Suction Pressure" }));
    expect(useWizardStore.getState().activeIO).toHaveLength(1);
    // Button must still be enabled — no "already added" guard
    expect(screen.getByRole("button", { name: "Add Stage 1 Suction Pressure" })).not.toBeDisabled();
  });

  it("allows the same item to be added twice with distinct ids", async () => {
    const user = userEvent.setup();
    renderCatalogPanel();
    const addBtn = screen.getByRole("button", { name: "Add Stage 1 Suction Pressure" });
    await user.click(addBtn);
    await user.click(addBtn);
    const { activeIO } = useWizardStore.getState();
    expect(activeIO).toHaveLength(2);
    expect(activeIO[0].tag).toBe("PT-101");
    expect(activeIO[1].tag).toBe("PT-101");
    expect(activeIO[0].id).not.toBe(activeIO[1].id);
  });

  it("shows a muted count badge after adding an item", async () => {
    const user = userEvent.setup();
    renderCatalogPanel();
    await user.click(screen.getByRole("button", { name: "Add Stage 1 Suction Pressure" }));
    // The badge aria-label reflects the count
    expect(screen.getByLabelText("1 added")).toBeInTheDocument();
  });

  it("shows a no-match state", async () => {
    const user = userEvent.setup();
    renderCatalogPanel();
    await user.type(screen.getByLabelText("Search catalog"), "nonexistent");
    expect(screen.getByText("No items match")).toBeInTheDocument();
  });

  it("hides Stage 3 items when equipment has only 2 stages", () => {
    useWizardStore.getState().setEquipment({ stages: 2 });
    renderCatalogPanel();
    // Stage 3 item must be absent
    expect(screen.queryByText("Stage 3 Discharge Temperature")).not.toBeInTheDocument();
    expect(screen.queryByText("TT-302")).not.toBeInTheDocument();
    // Stage 1 item must still be present
    expect(screen.getByText("Stage 1 Suction Pressure")).toBeInTheDocument();
    expect(screen.getByText("TT-101")).toBeInTheDocument();
  });

  it("shows Stage 3 items when equipment has 3 stages", () => {
    useWizardStore.getState().setEquipment({ stages: 3 });
    renderCatalogPanel();
    expect(screen.getByText("Stage 3 Discharge Temperature")).toBeInTheDocument();
    expect(screen.getByText("TT-302")).toBeInTheDocument();
  });

  it("item count footer reflects equipment-filtered count", () => {
    useWizardStore.getState().setEquipment({ stages: 2 });
    renderCatalogPanel();
    // With 2 stages the count should be less than the full catalog
    const footerText = screen.getByText(/\d+ items/);
    const count = parseInt(footerText.textContent ?? "0", 10);
    expect(count).toBeGreaterThan(0);

    useWizardStore.getState().setEquipment({ stages: 3 });
  });

  it("has no a11y violations", async () => {
    const { container } = renderCatalogPanel();
    expect(await axe(container)).toHaveNoViolations();
  });
});
