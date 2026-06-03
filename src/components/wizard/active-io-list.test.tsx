import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { IO_CATALOG } from "@/catalog/io-catalog";
import { useWizardStore } from "@/store/wizard";
import { ActiveIOList } from "./active-io-list";

function seed(tag: string) {
  const item = IO_CATALOG.find((i) => i.tag === tag);
  if (!item) throw new Error(`missing ${tag}`);
  useWizardStore.getState().addIOFromCatalog(item);
}

describe("ActiveIOList", () => {
  beforeEach(() => useWizardStore.getState().reset());

  it("shows the empty state with no items", () => {
    render(<ActiveIOList />);
    expect(screen.getByText("No I/O items yet")).toBeInTheDocument();
  });

  it("lists active items with their tag and count", () => {
    seed("PT-101");
    seed("DO-904");
    render(<ActiveIOList />);
    expect(screen.getByText("(2 items)")).toBeInTheDocument();
    expect(screen.getByText("PT-101")).toBeInTheDocument();
    expect(screen.getByText("Form-C")).toBeInTheDocument();
  });

  it("removes an item", async () => {
    const user = userEvent.setup();
    seed("PT-101");
    render(<ActiveIOList />);
    await user.click(screen.getByRole("button", { name: "Remove PT-101" }));
    expect(useWizardStore.getState().activeIO).toHaveLength(0);
  });

  it("edits an item's notes", async () => {
    const user = userEvent.setup();
    seed("PT-101");
    render(<ActiveIOList />);
    await user.click(screen.getByRole("button", { name: "Edit PT-101" }));
    const notes = screen.getByLabelText("Notes");
    await user.type(notes, "spare loop");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(useWizardStore.getState().activeIO[0].notes).toBe("spare loop");
    expect(screen.getByText("spare loop")).toBeInTheDocument();
  });

  it("saves the edit when Enter is pressed in the notes field", async () => {
    const user = userEvent.setup();
    seed("PT-101");
    render(<ActiveIOList />);
    await user.click(screen.getByRole("button", { name: "Edit PT-101" }));
    await user.type(screen.getByLabelText("Notes"), "spare loop{Enter}");
    expect(useWizardStore.getState().activeIO[0].notes).toBe("spare loop");
    // Saving closes the editor.
    expect(screen.queryByLabelText("Notes")).not.toBeInTheDocument();
  });

  it("cancels an edit without saving", async () => {
    const user = userEvent.setup();
    seed("PT-101");
    render(<ActiveIOList />);
    await user.click(screen.getByRole("button", { name: "Edit PT-101" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Notes")).not.toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    seed("PT-101");
    const { container } = render(<ActiveIOList />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
