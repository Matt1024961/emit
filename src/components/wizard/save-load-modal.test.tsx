import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configService } from "@/services/local-storage";
import { useWizardStore } from "@/store/wizard";
import { SaveLoadModal } from "./save-load-modal";

describe("SaveLoadModal", () => {
  beforeEach(() => {
    localStorage.clear();
    useWizardStore.getState().reset();
  });

  it("saves the current configuration", async () => {
    const user = userEvent.setup();
    useWizardStore.getState().setConfigName("Kodiak Site 14");
    render(<SaveLoadModal open mode="save" onOpenChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByText("Saved.")).toBeInTheDocument());
    expect(await configService.list()).toHaveLength(1);
  });

  it("saves when Enter is pressed in the name field", async () => {
    const user = userEvent.setup();
    useWizardStore.getState().setConfigName("Kodiak Site 14");
    render(<SaveLoadModal open mode="save" onOpenChange={() => {}} />);
    await user.type(screen.getByLabelText("Configuration name"), "{Enter}");
    await waitFor(() => expect(screen.getByText("Saved.")).toBeInTheDocument());
    expect(await configService.list()).toHaveLength(1);
  });

  it("blocks saving without a name", async () => {
    const user = userEvent.setup();
    render(<SaveLoadModal open mode="save" onOpenChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Configuration name is required.")).toBeInTheDocument();
  });

  it("loads a saved configuration", async () => {
    const user = userEvent.setup();
    await configService.save({
      id: "saved-1",
      name: "Saved One",
      description: "",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      equipment: { engineType: "CAT-3516", compressorModel: "JGC/4", stages: 3, coolerSections: 2 },
      hardware: { brainPlusCount: 0 },
      activeIO: [],
      mappings: [],
    });
    const onOpenChange = vi.fn();
    render(<SaveLoadModal open mode="load" onOpenChange={onOpenChange} />);
    await user.click(await screen.findByRole("button", { name: "Load" }));
    expect(useWizardStore.getState().configName).toBe("Saved One");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("deletes a saved configuration from the list", async () => {
    const user = userEvent.setup();
    await configService.save({
      id: "saved-1",
      name: "Saved One",
      description: "",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      equipment: { engineType: "CAT-3516", compressorModel: "JGC/4", stages: 3, coolerSections: 2 },
      hardware: { brainPlusCount: 0 },
      activeIO: [],
      mappings: [],
    });
    render(<SaveLoadModal open mode="load" onOpenChange={() => {}} />);
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByText("No saved configurations")).toBeInTheDocument());
  });

  it("'Save as new version' creates a second entry with an incremented version", async () => {
    const user = userEvent.setup();
    useWizardStore.getState().setConfigName("Kodiak Site 14");

    // Seed an existing version 1 under the same name.
    await configService.save({
      id: "existing-1",
      name: "Kodiak Site 14",
      description: "",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      equipment: { engineType: "CAT-3516", compressorModel: "JGC/4", stages: 3, coolerSections: 2 },
      hardware: { brainPlusCount: 0 },
      activeIO: [],
      mappings: [],
    });

    render(<SaveLoadModal open mode="save" onOpenChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Save as new version" }));
    await waitFor(() => expect(screen.getByText("Saved as v2.")).toBeInTheDocument());

    const list = await configService.list();
    // Original entry plus the new version entry.
    expect(list).toHaveLength(2);
    const versions = list.map((s) => s.version).sort();
    expect(versions).toEqual([1, 2]);
    // The original v1 is kept and a new, distinct entry is added for v2.
    const ids = list.map((s) => s.id);
    expect(ids).toContain("existing-1");
    expect(ids.some((id) => id !== "existing-1")).toBe(true);
  });

  it("'Save as new version' blocks saving without a name", async () => {
    const user = userEvent.setup();
    render(<SaveLoadModal open mode="save" onOpenChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Save as new version" }));
    expect(screen.getByText("Configuration name is required.")).toBeInTheDocument();
  });

  it("shows version badge next to each saved entry in load mode", async () => {
    await configService.save({
      id: "v2-entry",
      name: "Kodiak Site 14",
      description: "",
      version: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      equipment: { engineType: "CAT-3516", compressorModel: "JGC/4", stages: 3, coolerSections: 2 },
      hardware: { brainPlusCount: 0 },
      activeIO: [],
      mappings: [],
    });
    render(<SaveLoadModal open mode="load" onOpenChange={() => {}} />);
    expect(await screen.findByText("v2")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    render(<SaveLoadModal open mode="save" onOpenChange={() => {}} />);
    expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
  });
});
