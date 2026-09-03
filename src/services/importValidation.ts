import type { ImportError, ImportSummary, Question, QuestionType } from "../types";

const VALID_TYPES: QuestionType[] = ["single_choice", "multiple_choice", "true_false"];

/**
 * Validates and normalizes a raw parsed JSON value into a list of Questions.
 * Never invents data: any question with unresolvable problems is rejected
 * and reported, not silently fixed with guessed values.
 */
export function validateAndNormalizeQuestions(raw: unknown): {
  questions: Question[];
  summary: ImportSummary;
} {
  const errors: ImportError[] = [];
  const questions: Question[] = [];
  const categoryCounts: Record<string, number> = {};

  const list: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as any).questions)
    ? (raw as any).questions
    : [];

  if (list.length === 0) {
    errors.push({ questionId: "-", message: "Keine Fragen gefunden. Erwartet wird ein Array oder { questions: [...] }." });
  }

  const seenIds = new Set<string>();

  list.forEach((entry, idx) => {
    const q = entry as Partial<Question> & Record<string, unknown>;
    const idLabel = typeof q.id === "string" && q.id.length > 0 ? q.id : `#${idx + 1}`;

    if (!q.id || typeof q.id !== "string") {
      errors.push({ questionId: idLabel, message: "Feld 'id' fehlt oder ist kein String." });
      return;
    }
    if (seenIds.has(q.id)) {
      errors.push({ questionId: q.id, message: `Doppelte id '${q.id}' im Fragenkatalog.` });
      return;
    }
    if (!q.question || typeof q.question !== "string") {
      errors.push({ questionId: idLabel, message: "Feld 'question' fehlt oder ist kein String." });
      return;
    }
    if (!q.category || typeof q.category !== "string") {
      errors.push({ questionId: idLabel, message: "Feld 'category' fehlt oder ist kein String." });
      return;
    }
    if (!q.type || !VALID_TYPES.includes(q.type as QuestionType)) {
      errors.push({
        questionId: idLabel,
        message: `Feld 'type' fehlt oder ist ungültig (erlaubt: ${VALID_TYPES.join(", ")}).`,
      });
      return;
    }

    let options = q.options;
    // true_false questions may omit options; we derive them, we do not invent content.
    if (q.type === "true_false" && (!options || options.length === 0)) {
      options = [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ];
    }
    if (!Array.isArray(options) || options.length < 2) {
      errors.push({ questionId: idLabel, message: "Feld 'options' fehlt oder enthält weniger als 2 Antworten." });
      return;
    }
    const optionIds = new Set(options.map((o) => o.id));
    if (optionIds.size !== options.length) {
      errors.push({ questionId: idLabel, message: "Doppelte Antwort-IDs in 'options'." });
      return;
    }

    if (!Array.isArray(q.correct_answers) || q.correct_answers.length === 0) {
      errors.push({ questionId: idLabel, message: "Feld 'correct_answers' fehlt oder ist leer." });
      return;
    }
    const invalidRefs = q.correct_answers.filter((a) => !optionIds.has(a));
    if (invalidRefs.length > 0) {
      errors.push({
        questionId: idLabel,
        message: `correct_answers enthält Antwort "${invalidRefs[0]}", aber es existiert keine Antwort ${invalidRefs[0]}.`,
      });
      return;
    }

    if (q.type === "single_choice" && q.correct_answers.length !== 1) {
      errors.push({
        questionId: idLabel,
        message: "single_choice erfordert genau eine korrekte Antwort in 'correct_answers'.",
      });
      return;
    }

    if (q.difficulty && !["easy", "medium", "hard"].includes(q.difficulty as string)) {
      errors.push({ questionId: idLabel, message: `Ungültiger Schwierigkeitsgrad '${q.difficulty}'.` });
      return;
    }

    seenIds.add(q.id);
    const normalized: Question = {
      id: q.id,
      category: q.category,
      question: q.question,
      type: q.type as QuestionType,
      options,
      correct_answers: q.correct_answers,
      explanation: typeof q.explanation === "string" ? q.explanation : undefined,
      difficulty: q.difficulty as Question["difficulty"],
      image: typeof q.image === "string" ? q.image : undefined,
      isDemo: false,
    };
    questions.push(normalized);
    categoryCounts[normalized.category] = (categoryCounts[normalized.category] ?? 0) + 1;
  });

  return {
    questions,
    summary: {
      totalAttempted: list.length,
      imported: questions.length,
      errors,
      categoryCounts,
    },
  };
}
