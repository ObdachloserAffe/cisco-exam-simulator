import { describe, expect, it } from "vitest";
import type { ExamConfig, ExamSession, Question } from "../../types";
import {
  buildOptionOrder,
  isAnswerCorrect,
  isPassed,
  remainingSeconds,
  scoreSession,
  selectQuestions,
  shuffle,
} from "../examEngine";

function makeQuestion(id: string, overrides: Partial<Question> = {}): Question {
  return {
    id,
    category: overrides.category ?? "Routing",
    question: `Question ${id}`,
    type: overrides.type ?? "single_choice",
    options: overrides.options ?? [
      { id: "A", text: "A" },
      { id: "B", text: "B" },
      { id: "C", text: "C" },
      { id: "D", text: "D" },
    ],
    correct_answers: overrides.correct_answers ?? ["B"],
    explanation: overrides.explanation,
    difficulty: overrides.difficulty,
    isDemo: overrides.isDemo,
  };
}

const baseConfig: ExamConfig = {
  templateType: "full",
  questionCount: 5,
  timeLimitMinutes: 90,
  shuffleQuestions: true,
  shuffleOptions: true,
  passThreshold: 80,
  mode: "exam",
};

describe("isAnswerCorrect (single & multiple choice)", () => {
  it("single choice: exact match is correct", () => {
    const q = makeQuestion("Q1", { type: "single_choice", correct_answers: ["B"] });
    expect(isAnswerCorrect(q, ["B"])).toBe(true);
  });

  it("single choice: wrong option is incorrect", () => {
    const q = makeQuestion("Q1", { type: "single_choice", correct_answers: ["B"] });
    expect(isAnswerCorrect(q, ["A"])).toBe(false);
  });

  it("multiple choice: exact set match required (A+C correct)", () => {
    const q = makeQuestion("Q2", { type: "multiple_choice", correct_answers: ["A", "C"] });
    expect(isAnswerCorrect(q, ["A", "C"])).toBe(true);
    expect(isAnswerCorrect(q, ["C", "A"])).toBe(true); // order independent
  });

  it("multiple choice: partial selection is incorrect", () => {
    const q = makeQuestion("Q2", { type: "multiple_choice", correct_answers: ["A", "C"] });
    expect(isAnswerCorrect(q, ["A"])).toBe(false);
    expect(isAnswerCorrect(q, ["C"])).toBe(false);
  });

  it("multiple choice: over-selection is incorrect", () => {
    const q = makeQuestion("Q2", { type: "multiple_choice", correct_answers: ["A", "C"] });
    expect(isAnswerCorrect(q, ["A", "B", "C"])).toBe(false);
  });

  it("unanswered question is never correct", () => {
    const q = makeQuestion("Q3");
    expect(isAnswerCorrect(q, [])).toBe(false);
  });
});

describe("selectQuestions", () => {
  const pool = Array.from({ length: 20 }, (_, i) => makeQuestion(`Q${i}`));

  it("never returns duplicate ids within one exam", () => {
    const ids = selectQuestions(pool, { ...baseConfig, questionCount: 15 });
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("caps selection at pool size when questionCount exceeds it", () => {
    const ids = selectQuestions(pool, { ...baseConfig, questionCount: 999 });
    expect(ids.length).toBe(pool.length);
  });

  it("respects requested questionCount when pool is large enough", () => {
    const ids = selectQuestions(pool, { ...baseConfig, questionCount: 7 });
    expect(ids.length).toBe(7);
  });

  it("filters by category for category/custom templates", () => {
    const mixed = [
      makeQuestion("R1", { category: "Routing" }),
      makeQuestion("R2", { category: "Routing" }),
      makeQuestion("S1", { category: "Switching" }),
    ];
    const ids = selectQuestions(mixed, {
      ...baseConfig,
      templateType: "category",
      categories: ["Routing"],
      questionCount: 10,
    });
    expect(ids.sort()).toEqual(["R1", "R2"]);
  });

  it("filters by difficulty for custom template", () => {
    const mixed = [
      makeQuestion("E1", { difficulty: "easy" }),
      makeQuestion("H1", { difficulty: "hard" }),
    ];
    const ids = selectQuestions(mixed, {
      ...baseConfig,
      templateType: "custom",
      difficulties: ["hard"],
      questionCount: 10,
    });
    expect(ids).toEqual(["H1"]);
  });
});

describe("shuffle", () => {
  it("does not mutate the input array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  it("preserves all elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result.sort()).toEqual(input.sort());
  });
});

describe("buildOptionOrder", () => {
  it("keeps original order when shuffling disabled", () => {
    const q = makeQuestion("Q1");
    const order = buildOptionOrder([q], false);
    expect(order["Q1"]).toEqual(["A", "B", "C", "D"]);
  });

  it("includes every option id exactly once when shuffled", () => {
    const q = makeQuestion("Q1");
    const order = buildOptionOrder([q], true);
    expect(order["Q1"].sort()).toEqual(["A", "B", "C", "D"]);
  });
});

describe("isPassed", () => {
  it("passes at or above threshold", () => {
    expect(isPassed(80, 80)).toBe(true);
    expect(isPassed(95, 80)).toBe(true);
  });
  it("fails below threshold", () => {
    expect(isPassed(79.9, 80)).toBe(false);
  });
});

describe("scoreSession", () => {
  const q1 = makeQuestion("Q1", { type: "single_choice", correct_answers: ["B"], category: "Routing" });
  const q2 = makeQuestion("Q2", { type: "multiple_choice", correct_answers: ["A", "C"], category: "Switching" });
  const q3 = makeQuestion("Q3", { type: "single_choice", correct_answers: ["D"], category: "Routing" });
  const questionsById = new Map([
    ["Q1", q1],
    ["Q2", q2],
    ["Q3", q3],
  ]);

  function makeSession(): ExamSession {
    return {
      id: "S1",
      config: { ...baseConfig, questionCount: 3, passThreshold: 60 },
      questionIds: ["Q1", "Q2", "Q3"],
      optionOrder: {},
      answers: {
        Q1: { questionId: "Q1", selectedOptionIds: ["B"], flagged: false, timeSpentSeconds: 10 }, // correct
        Q2: { questionId: "Q2", selectedOptionIds: ["A"], flagged: false, timeSpentSeconds: 5 }, // incorrect (partial)
        // Q3 unanswered -> skipped
      },
      startedAt: 1000,
      endsAt: null,
      submittedAt: 4000,
      currentIndex: 2,
      status: "submitted",
    };
  }

  it("counts correct, incorrect, and skipped questions", () => {
    const result = scoreSession(makeSession(), questionsById);
    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.totalQuestions).toBe(3);
  });

  it("computes score percent as correct/total * 100", () => {
    const result = scoreSession(makeSession(), questionsById);
    expect(result.scorePercent).toBeCloseTo(33.33, 1);
  });

  it("applies the configured pass threshold", () => {
    const result = scoreSession(makeSession(), questionsById);
    expect(result.passed).toBe(false); // 33% < 60%
  });

  it("builds a per-category breakdown", () => {
    const result = scoreSession(makeSession(), questionsById);
    expect(result.categoryBreakdown["Routing"]).toEqual({ correct: 1, total: 2 });
    expect(result.categoryBreakdown["Switching"]).toEqual({ correct: 0, total: 1 });
  });

  it("computes duration from startedAt/submittedAt", () => {
    const result = scoreSession(makeSession(), questionsById);
    expect(result.durationSeconds).toBe(3); // (4000-1000)ms = 3s
  });
});

describe("remainingSeconds (timer)", () => {
  it("returns null for untimed sessions", () => {
    const session = { endsAt: null } as ExamSession;
    expect(remainingSeconds(session, 0)).toBeNull();
  });

  it("counts down toward zero as time passes", () => {
    const session = { endsAt: 10_000 } as ExamSession;
    expect(remainingSeconds(session, 0)).toBe(10);
    expect(remainingSeconds(session, 5_000)).toBe(5);
  });

  it("never goes negative after expiry", () => {
    const session = { endsAt: 1_000 } as ExamSession;
    expect(remainingSeconds(session, 5_000)).toBe(0);
  });

  it("survives a 'reload' because it derives from an absolute timestamp, not elapsed state", () => {
    const session = { endsAt: 60_000 } as ExamSession;
    // Simulate two independent calls (as if from two separate page loads)
    const first = remainingSeconds(session, 10_000);
    const second = remainingSeconds(session, 10_000);
    expect(first).toBe(second);
  });
});
