import { temporal } from "zundo";
import { create } from "zustand";
import { getLimitedItems, getRecommendedItems } from "../catalog/io-catalog";
import { SAMPLE_KODIAK } from "../catalog/sample-kodiak";
import { getAvailablePorts } from "../hardware/index";
import type { Equipment, HardwareConfig } from "../types/config";
import type { ActiveIOItem, CatalogItem } from "../types/io";
import type { Port, PortMapping } from "../types/port";
import { canMap } from "../validation/rules";
import { computeAutoMap } from "./auto-map";

export type WizardStep = 1 | 2 | 3;

interface WizardState {
  step: WizardStep;
  configId: string;
  configName: string;
  configDescription: string;
  equipment: Equipment;
  hardware: HardwareConfig;
  activeIO: ActiveIOItem[];
  mappings: PortMapping[];

  // Step navigation
  setStep: (step: WizardStep) => void;

  // Step 1: Setup
  setConfigName: (name: string) => void;
  setConfigDescription: (desc: string) => void;
  setEquipment: (equipment: Partial<Equipment>) => void;

  // Step 2: Define I/O
  setHardware: (config: HardwareConfig) => void;
  addIOFromCatalog: (item: CatalogItem) => void;
  removeIOItem: (id: string) => void;
  editIOItem: (id: string, updates: Partial<Pick<ActiveIOItem, "notes" | "range">>) => void;
  applyTemplate: (template: "recommended" | "limited") => void;
  loadSample: () => void;
  clearIO: () => void;

  // Step 3: Mapping
  addMapping: (ioId: string, port: Port) => { success: boolean; reason?: string };
  removeMapping: (ioId: string) => void;
  clearMappings: () => void;
  autoMap: () => void;

  // Persistence helpers
  loadFromConfig: (config: {
    id: string;
    name: string;
    description: string;
    equipment: Equipment;
    hardware: HardwareConfig;
    activeIO: ActiveIOItem[];
    mappings: PortMapping[];
  }) => void;
  reset: () => void;

  // Derived helpers
  getMappingForPort: (portId: string) => PortMapping | undefined;
  getMappingForIO: (ioId: string) => PortMapping | undefined;
  getUnmappedItems: () => ActiveIOItem[];
}

let ioCounter = 0;

function nextId(): string {
  ioCounter += 1;
  return `io-${String(ioCounter).padStart(4, "0")}`;
}

function catalogToActive(item: CatalogItem): ActiveIOItem {
  return {
    id: nextId(),
    tag: item.tag,
    name: item.name,
    category: item.category,
    signal: item.signal,
    range: item.range,
    hardwareHint: item.hardwareHint,
    formC: item.formC,
    tcType: item.tcType,
    group: item.group,
    notes: "",
  };
}

const DEFAULT_EQUIPMENT: Equipment = {
  engineType: "",
  compressorModel: "",
  stages: 1,
  coolerSections: 1,
};

export const useWizardStore = create<WizardState>()(
  temporal(
    (set, get) => ({
      step: 1,
      configId: crypto.randomUUID(),
      configName: "",
      configDescription: "",
      equipment: { ...DEFAULT_EQUIPMENT },
      hardware: { brainPlusCount: 0 },
      activeIO: [],
      mappings: [],

      setStep: (step) => set({ step }),

      setConfigName: (configName) => set({ configName }),
      setConfigDescription: (configDescription) => set({ configDescription }),

      setEquipment: (updates) =>
        set((state) => ({ equipment: { ...state.equipment, ...updates } })),

      setHardware: (hardware) => {
        // When reducing hardware, remove mappings that reference now-absent ports
        const available = getAvailablePorts(hardware.brainPlusCount);
        const availableIds = new Set(available.map((p) => p.id));
        set((state) => ({
          hardware,
          mappings: state.mappings.filter((m) => {
            const portId = m.portId;
            return availableIds.has(portId);
          }),
        }));
      },

      addIOFromCatalog: (item) => {
        set((state) => ({
          activeIO: [...state.activeIO, catalogToActive(item)],
        }));
      },

      removeIOItem: (id) =>
        set((state) => ({
          activeIO: state.activeIO.filter((item) => item.id !== id),
          mappings: state.mappings.filter((m) => m.ioId !== id),
        })),

      editIOItem: (id, updates) =>
        set((state) => ({
          activeIO: state.activeIO.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        })),

      applyTemplate: (template) => {
        ioCounter = 0;
        const items = template === "recommended" ? getRecommendedItems() : getLimitedItems();
        set({
          activeIO: items.map(catalogToActive),
          mappings: [],
        });
      },

      loadSample: () => {
        // Seed the full Kodiak Site 14 panel (equipment + I/O) and jump to Define I/O.
        // Mappings are left empty so the demo can show Auto Map fill the backplate.
        ioCounter = 0;
        set({
          step: 2,
          configId: crypto.randomUUID(),
          configName: SAMPLE_KODIAK.name,
          configDescription: SAMPLE_KODIAK.description,
          equipment: { ...SAMPLE_KODIAK.equipment },
          hardware: { ...SAMPLE_KODIAK.hardware },
          activeIO: SAMPLE_KODIAK.items.map(catalogToActive),
          mappings: [],
        });
      },

      clearIO: () => {
        ioCounter = 0;
        set({ activeIO: [], mappings: [] });
      },

      addMapping: (ioId, port) => {
        const state = get();
        const item = state.activeIO.find((i) => i.id === ioId);
        if (!item) return { success: false, reason: "I/O item not found" };

        const validation = canMap(item, port);
        if (!validation.valid) return { success: false, reason: validation.reason };

        // Remove any existing mapping for this IO or this port, then add new one
        set((s) => ({
          mappings: [
            ...s.mappings.filter((m) => m.ioId !== ioId && m.portId !== port.id),
            { ioId, portId: port.id, device: port.device, slot: port.slot },
          ],
        }));
        return { success: true };
      },

      removeMapping: (ioId) =>
        set((state) => ({
          mappings: state.mappings.filter((m) => m.ioId !== ioId),
        })),

      clearMappings: () => set({ mappings: [] }),

      autoMap: () => {
        const state = get();
        const availablePorts = getAvailablePorts(state.hardware.brainPlusCount);
        // Deterministic assignment that reserves Form-C ports for fail-safe relays.
        set({ mappings: computeAutoMap(state.activeIO, availablePorts, state.mappings) });
      },

      loadFromConfig: (config) => {
        // Re-sync the counter past any existing ids to avoid collisions
        const maxId = config.activeIO.reduce((max, item) => {
          const n = parseInt(item.id.replace("io-", ""), 10);
          return Number.isNaN(n) ? max : Math.max(max, n);
        }, 0);
        ioCounter = maxId;

        set({
          step: 2,
          configId: config.id,
          configName: config.name,
          configDescription: config.description,
          equipment: config.equipment,
          hardware: config.hardware,
          activeIO: config.activeIO,
          mappings: config.mappings,
        });
      },

      reset: () => {
        ioCounter = 0;
        set({
          step: 1,
          configId: crypto.randomUUID(),
          configName: "",
          configDescription: "",
          equipment: { ...DEFAULT_EQUIPMENT },
          hardware: { brainPlusCount: 0 },
          activeIO: [],
          mappings: [],
        });
      },

      getMappingForPort: (portId) => get().mappings.find((m) => m.portId === portId),
      getMappingForIO: (ioId) => get().mappings.find((m) => m.ioId === ioId),
      getUnmappedItems: () => {
        const { activeIO, mappings } = get();
        const mappedIds = new Set(mappings.map((m) => m.ioId));
        return activeIO.filter((item) => !mappedIds.has(item.id));
      },
    }),
    {
      // Undo/redo tracks the I/O list and mappings (the user's design work).
      limit: 50,
      partialize: (state) => ({ activeIO: state.activeIO, mappings: state.mappings }),
    }
  )
);
