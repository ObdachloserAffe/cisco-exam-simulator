import { describe, expect, it } from "vitest";
import { validateAndNormalizeQuestions } from "../importValidation";

const validQuestion = {
  id: "Q001",
  category: "Routing",
  question: "Which protocol is used between autonomous systems?",
  type: "single_choice",
  options: [
    { id: "A", text: "OSPF" },
    { id: "B", text: "BGP" },
  ],
  correct_answers: ["B"],
  explanation: "BGP is used between autonomous systems.",
};

describe("validateAndNormalizeQuestions", () => {
  it("imports a well-formed question array", () => {
    const { questions, summary } = validateAndNormalizeQuestions([validQuestion]);
    expect(questions).toHaveLength(1);
    expect(summary.imported).toBe(1);
    expect(summary.errors).toHaveLength(0);
  });

  it("accepts a { questions: [...] } wrapper object", () => {
    const { summary } = validateAndNormalizeQuestions({ questions: [validQuestion] });
    expect(summary.imported).toBe(1);
  });

  it("rejects a question whose correct_answers references a non-existent option", () => {
    const bad = { ...validQuestion, id: "Q042", correct_answers: ["E"] };
    const { questions, summary } = validateAndNormalizeQuestions([bad]);
    expect(questions).toHaveLength(0);
    expect(summary.errors[0].questionId).toBe("Q042");
    expect(summary.errors[0].message).toContain("correct_answers enthält Antwort \"E\"");
  });

  it("rejects duplicate ids", () => {
    const { summary } = validateAndNormalizeQuestions([validQuestion, validQuestion]);
    expect(summary.imported).toBe(1);
    expect(summary.errors.some((e) => e.message.includes("Doppelte id"))).toBe(true);
  });

  it("rejects single_choice questions with more than one correct answer", () => {
    const bad = { ...validQuestion, id: "Q002", correct_answers: ["A", "B"] };
    const { questions, summary } = validateAndNormalizeQuestions([bad]);
    expect(questions).toHaveLength(0);
    expect(summary.errors[0].message).toContain("single_choice erfordert genau eine");
  });

  it("derives True/False options when omitted", () => {
    const tf = {
      id: "Q010",
      category: "IPv6",
      question: "IPv6 addresses are 128 bits long.",
      type: "true_false",
      correct_answers: ["true"],
    };
    const { questions, summary } = validateAndNormalizeQuestions([tf]);
    expect(summary.errors).toHaveLength(0);
    expect(questions[0].options.map((o) => o.id)).toEqual(["true", "false"]);
  });

  it("rejects questions missing required fields without inventing data", () => {
    const missingCategory = { ...validQuestion, id: "Q099", category: undefined };
    const { questions, summary } = validateAndNormalizeQuestions([missingCategory]);
    expect(questions).toHaveLength(0);
    expect(summary.errors[0].message).toContain("category");
  });

  it("rejects multiple_choice with mismatched option/correct_answers counts silently accepted only if valid ids", () => {
    const mc = {
      ...validQuestion,
      id: "Q020",
      type: "multiple_choice",
      options: [
        { id: "A", text: "A" },
        { id: "B", text: "B" },
        { id: "C", text: "C" },
      ],
      correct_answers: ["A", "C"],
    };
    const { questions, summary } = validateAndNormalizeQuestions([mc]);
    expect(summary.errors).toHaveLength(0);
    expect(questions[0].correct_answers).toEqual(["A", "C"]);
  });

  it("reports an empty catalog instead of silently succeeding", () => {
    const { questions, summary } = validateAndNormalizeQuestions([]);
    expect(questions).toHaveLength(0);
    expect(summary.errors.length).toBeGreaterThan(0);
  });

  it("tracks category counts for imported questions", () => {
    const q2 = { ...validQuestion, id: "Q003", category: "Security" };
    const { summary } = validateAndNormalizeQuestions([validQuestion, q2]);
    expect(summary.categoryCounts).toEqual({ Routing: 1, Security: 1 });
  });
});
