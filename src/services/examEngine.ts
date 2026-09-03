import type {
  ExamAnswer,
  ExamConfig,
  ExamResult,
  ExamSession,
  Question,
  QuestionResult,
} from "../types";

/** Fisher-Yates shuffle, does not mutate input. */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Selects question ids for an exam from a pool, honoring the config.
 * Never returns duplicate ids within one exam.
 */
export function selectQuestions(pool: Question[], config: ExamConfig): string[] {
  let candidates = pool;

  if (config.templateType === "category" || config.templateType === "custom") {
    if (config.categories && config.categories.length > 0) {
      candidates = candidates.filter((q) => config.categories!.includes(q.category));
    }
    if (config.difficulties && config.difficulties.length > 0) {
      candidates = candidates.filter((q) => q.difficulty && config.difficulties!.includes(q.difficulty));
    }
  }

  const unique = Array.from(new Map(candidates.map((q) => [q.id, q])).values());
  const ordered = config.shuffleQuestions ? shuffle(unique) : unique;
  const count = Math.min(config.questionCount, ordered.length);
  return ordered.slice(0, count).map((q) => q.id);
}

/** Builds the per-question shuffled option order for a session. */
export function buildOptionOrder(
  questions: Question[],
  shuffleOptions: boolean
): Record<string, string[]> {
  const order: Record<string, string[]> = {};
  for (const q of questions) {
    const ids = q.options.map((o) => o.id);
    order[q.id] = shuffleOptions ? shuffle(ids) : ids;
  }
  return order;
}

/** Determines whether a single answer is fully correct (exact set match). */
export function isAnswerCorrect(question: Question, selected: string[]): boolean {
  if (selected.length === 0) return false;
  const correctSet = new Set(question.correct_answers);
  const selectedSet = new Set(selected);
  if (correctSet.size !== selectedSet.size) return false;
  for (const id of correctSet) {
    if (!selectedSet.has(id)) return false;
  }
  return true;
}

export function isPassed(scorePercent: number, threshold: number): boolean {
  return scorePercent >= threshold;
}

/** Scores a finished session into a full ExamResult. */
export function scoreSession(
  session: ExamSession,
  questionsById: Map<string, Question>
): ExamResult {
  const questionResults: QuestionResult[] = [];
  const categoryBreakdown: Record<string, { correct: number; total: number }> = {};

  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;

  for (const qid of session.questionIds) {
    const question = questionsById.get(qid);
    if (!question) continue;
    const answer: ExamAnswer | undefined = session.answers[qid];
    const selected = answer?.selectedOptionIds ?? [];
    const skipped = selected.length === 0;
    const correct = !skipped && isAnswerCorrect(question, selected);

    if (skipped) skippedCount++;
    else if (correct) correctCount++;
    else incorrectCount++;

    const bucket = (categoryBreakdown[question.category] ??= { correct: 0, total: 0 });
    bucket.total += 1;
    if (correct) bucket.correct += 1;

    questionResults.push({
      questionId: qid,
      category: question.category,
      correct,
      skipped,
      selected,
      correctAnswers: question.correct_answers,
      timeSpentSeconds: answer?.timeSpentSeconds ?? 0,
    });
  }

  const total = session.questionIds.length;
  const scorePercent = total === 0 ? 0 : Math.round((correctCount / total) * 10000) / 100;
  const submittedAt = session.submittedAt ?? Date.now();

  return {
    id: `R-${session.id}`,
    sessionId: session.id,
    config: session.config,
    startedAt: session.startedAt,
    submittedAt,
    totalQuestions: total,
    correctCount,
    incorrectCount,
    skippedCount,
    scorePercent,
    passed: isPassed(scorePercent, session.config.passThreshold),
    categoryBreakdown,
    questionResults,
    durationSeconds: Math.max(0, Math.round((submittedAt - session.startedAt) / 1000)),
  };
}

/** Remaining seconds for a timed session; null when untimed. */
export function remainingSeconds(session: ExamSession, now: number = Date.now()): number | null {
  if (session.endsAt === null) return null;
  return Math.max(0, Math.round((session.endsAt - now) / 1000));
}
