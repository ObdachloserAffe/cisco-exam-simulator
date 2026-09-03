import { create } from "zustand";
import { useMemo } from "react";
import type { ExamResult } from "../types";
import { loadJSON, saveJSON, STORAGE_KEYS } from "../services/storage";

interface CategoryStat {
  category: string;
  correct: number;
  total: number;
  percent: number;
}

interface ResultsOverview {
  totalExams: number;
  passedCount: number;
  failedCount: number;
  averagePercent: number;
  bestPercent: number | null;
  worstPercent: number | null;
  averageDurationSeconds: number;
}

interface ResultsStoreState {
  results: ExamResult[];
  addResult: (result: ExamResult) => void;
  clearResults: () => void;
}

export const useResultsStore = create<ResultsStoreState>((set, get) => ({
  results: loadJSON<ExamResult[]>(STORAGE_KEYS.results, []),

  addResult: (result) => {
    const next = [...get().results, result];
    set({ results: next });
    saveJSON(STORAGE_KEYS.results, next);
  },

  clearResults: () => {
    set({ results: [] });
    saveJSON(STORAGE_KEYS.results, []);
  },
}));

/**
 * Derived, memoized selectors. Kept as plain hooks (not store selectors) so the
 * returned objects/arrays are only recomputed when `results` actually changes —
 * calling these as `useResultsStore(s => s.overview())` would return a new object
 * reference every render and trigger React's "Maximum update depth exceeded" loop.
 */
export function useResultsOverview(): ResultsOverview {
  const results = useResultsStore((s) => s.results);
  return useMemo(() => {
    if (results.length === 0) {
      return {
        totalExams: 0,
        passedCount: 0,
        failedCount: 0,
        averagePercent: 0,
        bestPercent: null,
        worstPercent: null,
        averageDurationSeconds: 0,
      };
    }
    const passedCount = results.filter((r) => r.passed).length;
    const percents = results.map((r) => r.scorePercent);
    const durations = results.map((r) => r.durationSeconds);
    return {
      totalExams: results.length,
      passedCount,
      failedCount: results.length - passedCount,
      averagePercent: Math.round((percents.reduce((a, b) => a + b, 0) / results.length) * 100) / 100,
      bestPercent: Math.max(...percents),
      worstPercent: Math.min(...percents),
      averageDurationSeconds: Math.round(durations.reduce((a, b) => a + b, 0) / results.length),
    };
  }, [results]);
}

export function useCategoryStats(): CategoryStat[] {
  const results = useResultsStore((s) => s.results);
  return useMemo(() => {
    const acc: Record<string, { correct: number; total: number }> = {};
    for (const r of results) {
      for (const [cat, stat] of Object.entries(r.categoryBreakdown)) {
        const bucket = (acc[cat] ??= { correct: 0, total: 0 });
        bucket.correct += stat.correct;
        bucket.total += stat.total;
      }
    }
    return Object.entries(acc)
      .map(([category, stat]) => ({
        category,
        correct: stat.correct,
        total: stat.total,
        percent: stat.total === 0 ? 0 : Math.round((stat.correct / stat.total) * 10000) / 100,
      }))
      .sort((a, b) => a.percent - b.percent);
  }, [results]);
}

export function useWrongQuestionIds(): string[] {
  const results = useResultsStore((s) => s.results);
  return useMemo(() => {
    const lastOutcome = new Map<string, boolean>();
    const sorted = [...results].sort((a, b) => a.submittedAt - b.submittedAt);
    for (const r of sorted) {
      for (const qr of r.questionResults) {
        lastOutcome.set(qr.questionId, qr.correct);
      }
    }
    return Array.from(lastOutcome.entries())
      .filter(([, correct]) => !correct)
      .map(([id]) => id);
  }, [results]);
}

export function useProblemQuestionIds(minMisses = 2): string[] {
  const results = useResultsStore((s) => s.results);
  return useMemo(() => {
    const misses = new Map<string, number>();
    for (const r of results) {
      for (const qr of r.questionResults) {
        if (!qr.correct) {
          misses.set(qr.questionId, (misses.get(qr.questionId) ?? 0) + 1);
        }
      }
    }
    return Array.from(misses.entries())
      .filter(([, count]) => count >= minMisses)
      .map(([id]) => id);
  }, [results, minMisses]);
}
