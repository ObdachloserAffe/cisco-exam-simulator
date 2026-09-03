import { create } from "zustand";
import type { AppSettings } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { loadJSON, saveJSON, STORAGE_KEYS } from "../services/storage";

interface SettingsStoreState {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  settings: loadJSON<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS),

  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    saveJSON(STORAGE_KEYS.settings, next);
  },

  resetSettings: () => {
    set({ settings: DEFAULT_SETTINGS });
    saveJSON(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  },
}));
