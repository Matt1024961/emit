import { create } from "zustand";
import { configService } from "../services/local-storage";
import type { ConfigurationSummary } from "../types/config";

interface SavedConfigsState {
  summaries: ConfigurationSummary[];
  loading: boolean;
  load: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useSavedConfigsStore = create<SavedConfigsState>((set) => ({
  summaries: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const summaries = await configService.list();
    set({ summaries, loading: false });
  },

  remove: async (id) => {
    await configService.delete(id);
    set((state) => ({
      summaries: state.summaries.filter((s) => s.id !== id),
    }));
  },
}));
