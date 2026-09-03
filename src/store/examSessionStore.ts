import { create } from "zustand";
import type { ExamConfig, ExamSession, Question } from "../types";
import { buildOptionOrder, selectQuestions } from "../services/examEngine";
import { loadJSON, removeKey, saveJSON, STORAGE_KEYS } from "../services/storage";

function newSessionId(): string {
  return `S-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface ExamSessionState {
  session: ExamSession | null;
  startExam: (pool: Question[], config: ExamConfig) => ExamSession | null;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  toggleFlag: (questionId?: string) => void;
  setAnswer: (questionId: string, selectedOptionIds: string[]) => void;
  revealAnswer: (questionId: string) => void; // study mode
  submit: () => void;
  abandon: () => void;
  restoreFromStorage: () => void;
}

function persist(session: ExamSession | null) {
  if (session) saveJSON(STORAGE_KEYS.activeSession, session);
  else removeKey(STORAGE_KEYS.activeSession);
}

export const useExamSessionStore = create<ExamSessionState>((set, get) => ({
  session: null,

  startExam: (pool, config) => {
    const questionIds = selectQuestions(pool, config);
    if (questionIds.length === 0) return null;
    const questions = questionIds
      .map((id) => pool.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q));

    const now = Date.now();
    const session: ExamSession = {
      id: newSessionId(),
      config,
      questionIds,
      optionOrder: buildOptionOrder(questions, config.shuffleOptions),
      answers: {},
      startedAt: now,
      endsAt: config.timeLimitMinutes > 0 ? now + config.timeLimitMinutes * 60_000 : null,
      submittedAt: null,
      currentIndex: 0,
      status: "in_progress",
    };
    set({ session });
    persist(session);
    return session;
  },

  goTo: (index) => {
    const session = get().session;
    if (!session || session.status !== "in_progress") return;
    const clamped = Math.max(0, Math.min(index, session.questionIds.length - 1));
    const next = { ...session, currentIndex: clamped };
    set({ session: next });
    persist(next);
  },

  next: () => get().goTo(get().session ? get().session!.currentIndex + 1 : 0),
  prev: () => get().goTo(get().session ? get().session!.currentIndex - 1 : 0),

  toggleFlag: (questionId) => {
    const session = get().session;
    if (!session) return;
    const qid = questionId ?? session.questionIds[session.currentIndex];
    const existing = session.answers[qid] ?? {
      questionId: qid,
      selectedOptionIds: [],
      flagged: false,
      timeSpentSeconds: 0,
    };
    const answers = { ...session.answers, [qid]: { ...existing, flagged: !existing.flagged } };
    const next = { ...session, answers };
    set({ session: next });
    persist(next);
  },

  setAnswer: (questionId, selectedOptionIds) => {
    const session = get().session;
    if (!session || session.status !== "in_progress") return;
    const existing = session.answers[questionId] ?? {
      questionId,
      selectedOptionIds: [],
      flagged: false,
      timeSpentSeconds: 0,
    };
    const answers = { ...session.answers, [questionId]: { ...existing, selectedOptionIds } };
    const next = { ...session, answers };
    set({ session: next });
    persist(next);
  },

  revealAnswer: (questionId) => {
    const session = get().session;
    if (!session) return;
    const existing = session.answers[questionId] ?? {
      questionId,
      selectedOptionIds: [],
      flagged: false,
      timeSpentSeconds: 0,
    };
    const answers = { ...session.answers, [questionId]: { ...existing, revealed: true } };
    const next = { ...session, answers };
    set({ session: next });
    persist(next);
  },

  submit: () => {
    const session = get().session;
    if (!session) return;
    const next: ExamSession = { ...session, status: "submitted", submittedAt: Date.now() };
    set({ session: next });
    persist(null); // clear active-session slot; result is stored separately by the caller
  },

  abandon: () => {
    set({ session: null });
    persist(null);
  },

  restoreFromStorage: () => {
    const stored = loadJSON<ExamSession | null>(STORAGE_KEYS.activeSession, null);
    if (stored && stored.status === "in_progress") {
      set({ session: stored });
    }
  },
}));
