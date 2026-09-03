import { create } from "zustand";
import { useMemo } from "react";
import type { ImportSummary, Question } from "../types";
import { demoQuestions } from "../data/demoQuestions";
import { validateAndNormalizeQuestions } from "../services/importValidation";
import { loadJSON, saveJSON, STORAGE_KEYS } from "../services/storage";

interface QuestionStoreState {
  userQuestions: Question[];
  useDemoQuestions: boolean; // toggled off automatically once user data exists, can be re-enabled
  importQuestions: (raw: unknown) => ImportSummary;
  clearUserQuestions: () => void;
  toggleDemoQuestions: (enabled: boolean) => void;
}

export const useQuestionStore = create<QuestionStoreState>((set, get) => ({
  userQuestions: loadJSON<Question[]>(STORAGE_KEYS.userQuestions, []),
  useDemoQuestions: loadJSON<Question[]>(STORAGE_KEYS.userQuestions, []).length === 0,

  importQuestions: (raw: unknown) => {
    const { questions, summary } = validateAndNormalizeQuestions(raw);
    if (questions.length > 0) {
      const merged = [...get().userQuestions.filter((q) => !questions.some((n) => n.id === q.id)), ...questions];
      set({ userQuestions: merged, useDemoQuestions: false });
      saveJSON(STORAGE_KEYS.userQuestions, merged);
    }
    return summary;
  },

  clearUserQuestions: () => {
    set({ userQuestions: [], useDemoQuestions: true });
    saveJSON(STORAGE_KEYS.userQuestions, []);
  },

  toggleDemoQuestions: (enabled: boolean) => set({ useDemoQuestions: enabled }),
}));

/**
 * Derived, memoized selectors. These are plain hooks (not store selectors) so the
 * returned arrays are only recomputed when the underlying primitive state actually
 * changes — calling `.allQuestions()` etc. directly inside a Zustand selector would
 * return a new array reference on every render and trigger an infinite update loop.
 */
export function useAllQuestions(): Question[] {
  const userQuestions = useQuestionStore((s) => s.userQuestions);
  const useDemoQuestions = useQuestionStore((s) => s.useDemoQuestions);
  return useMemo(
    () => (useDemoQuestions ? [...demoQuestions, ...userQuestions] : userQuestions),
    [userQuestions, useDemoQuestions]
  );
}

export function useCategories(): string[] {
  const all = useAllQuestions();
  return useMemo(() => Array.from(new Set(all.map((q) => q.category))).sort(), [all]);
}
