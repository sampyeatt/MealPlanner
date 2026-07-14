import { create } from "zustand";
import type { Tab } from "../types";

/**
 * Client-only UI state shared across the app. Server data still lives in
 * TanStack Query; this store owns purely local concerns that would otherwise
 * be prop-drilled — the active tab and the transient status toast.
 */
interface UiState {
  /** Which top-level view is showing. */
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  /** Transient toast message, or null when nothing is shown. */
  status: string | null;
  /** Show a status toast. */
  setStatus: (message: string) => void;
  /** Dismiss the current status toast. */
  clearStatus: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: "meals",
  setActiveTab: (tab) => set({ activeTab: tab }),

  status: null,
  setStatus: (message) => set({ status: message }),
  clearStatus: () => set({ status: null }),
}));
