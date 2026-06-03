import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { IO_CATALOG } from "@/catalog/io-catalog";
import { useWizardStore } from "@/store/wizard";
import { MappingWarnings } from "./mapping-warnings";

/** Finds the first Relay-NC item in the catalog (e.g. DO-904 Shutdown Relay). */
function getRelayNcItem() {
  const item = IO_CATALOG.find((i) => i.signal === "Relay-NC");
  if (!item) throw new Error("No Relay-NC item found in IO_CATALOG");
  return item;
}

describe("MappingWarnings", () => {
  beforeEach(() => useWizardStore.getState().reset());

  it("renders with no warnings on an empty store", async () => {
    const { container } = render(<MappingWarnings />);
    expect(screen.queryByText(/fail-safe/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Port capacity exceeded/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CAN termination/i, { selector: "span" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the CAN termination label and controls", () => {
    render(<MappingWarnings />);
    expect(screen.getByText("CAN termination:")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "CAN termination location" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No AFR module" })).toBeInTheDocument();
  });

  it("shows a fail-safe badge when a Relay-NC item is unmapped", async () => {
    useWizardStore.getState().addIOFromCatalog(getRelayNcItem());
    const { container } = render(<MappingWarnings />);
    expect(screen.getByText(/fail-safe relay.*unmapped/i)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows a CAN termination warning badge when BRAIN+ 1 is present and terminator is at BRAIN", async () => {
    useWizardStore.getState().setHardware({ brainPlusCount: 1 });
    const { container } = render(<MappingWarnings />);
    // Default terminationAt="BRAIN" but bus ends at P1, so a warning badge should appear.
    const warningBadges = screen.getAllByText(/CAN termination is on/i);
    expect(warningBadges.length).toBeGreaterThan(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("clears CAN warning when terminator is moved to the correct node", async () => {
    const user = userEvent.setup();
    useWizardStore.getState().setHardware({ brainPlusCount: 1 });
    render(<MappingWarnings />);
    // Warning is visible initially (BRAIN terminator, P1 expected).
    expect(screen.getAllByText(/CAN termination is on/i).length).toBeGreaterThan(0);

    // Change termination to P1 — warning should disappear.
    await user.click(screen.getByRole("combobox", { name: "CAN termination location" }));
    await user.click(screen.getByRole("option", { name: "BRAIN+ (P1)" }));
    expect(screen.queryByText(/CAN termination is on/i)).not.toBeInTheDocument();
  });

  it("shows AFR present label when AFR toggle is on", async () => {
    const user = userEvent.setup();
    render(<MappingWarnings />);
    await user.click(screen.getByRole("button", { name: "No AFR module" }));
    expect(screen.getByRole("button", { name: "AFR present" })).toBeInTheDocument();
  });

  it("shows CAN warning for AFR presence when terminator is not at AFR", async () => {
    const user = userEvent.setup();
    render(<MappingWarnings />);
    // Enable AFR — now expected node is AFR but terminator is still BRAIN.
    await user.click(screen.getByRole("button", { name: "No AFR module" }));
    expect(screen.getAllByText(/CAN termination is on/i).length).toBeGreaterThan(0);
  });

  it("shows plural label for multiple unmapped fail-safe relays", () => {
    const item = getRelayNcItem();
    useWizardStore.getState().addIOFromCatalog(item);
    useWizardStore.getState().addIOFromCatalog(item);
    render(<MappingWarnings />);
    expect(screen.getByText(/2 fail-safe relays unmapped/i)).toBeInTheDocument();
  });

  it("has no a11y violations with all warnings showing", async () => {
    useWizardStore.getState().addIOFromCatalog(getRelayNcItem());
    useWizardStore.getState().setHardware({ brainPlusCount: 1 });
    const { container } = render(<MappingWarnings />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
