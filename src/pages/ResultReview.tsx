import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useResultsStore } from "../store/resultsStore";
import { useAllQuestions } from "../store/questionStore";
import { formatSeconds, stripFormatting } from "../utils/format";
import "./ResultReview.css";

type FilterMode = "all" | "correct" | "incorrect" | "skipped";

export default function ResultReview() {
  const { resultId } = useParams();
  const result = useResultsStore((s) => s.results.find((r) => r.id === resultId));
  const allQuestions = useAllQuestions();
  const questionsById = useMemo(() => new Map(allQuestions.map((q) => [q.id, q])), [allQuestions]);

  const [filter, setFilter] = useState<FilterMode>("all");
  const [category, setCategory] = useState<string>("all");

  if (!result) {
    return (
      <div className="card empty-session">
        <p>Ergebnis nicht gefunden.</p>
        <Link to="/" className="btn btn-primary">Zum Dashboard</Link>
      </div>
    );
  }

  const categories = Array.from(new Set(result.questionResults.map((r) => r.category))).sort();

  const filtered = result.questionResults.filter((r) => {
    if (category !== "all" && r.category !== category) return false;
    if (filter === "correct") return r.correct;
    if (filter === "incorrect") return !r.correct && !r.skipped;
    if (filter === "skipped") return r.skipped;
    return true;
  });

  return (
    <div>
      <header className="page-header">
        <h1>Detaillierte Auswertung</h1>
        <p className="page-sub">{filtered.length} von {result.questionResults.length} Fragen angezeigt</p>
      </header>

      <div className="review-filters">
        <div className="segmented">
          {(["all", "correct", "incorrect", "skipped"] as FilterMode[]).map((f) => (
            <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
              {{ all: "Alle", correct: "Richtig", incorrect: "Falsch", skipped: "Unbeantwortet" }[f]}
            </button>
          ))}
        </div>
        <select className="text-input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Alle Kategorien</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="review-list">
        {filtered.map((r) => {
          const q = questionsById.get(r.questionId);
          return (
            <div key={r.questionId} className={`card review-item ${r.skipped ? "skipped" : r.correct ? "correct" : "incorrect"}`}>
              <div className="review-item-header">
                <span className="mono review-qid">{r.questionId}</span>
                <span className="q-category">{r.category}</span>
                {q?.type === "multiple_choice" && (
                  <span className="q-multi review-multi-badge">Mehrfachauswahl</span>
                )}
                <span className="review-verdict">
                  {r.skipped ? "○ Unbeantwortet" : r.correct ? "✓ Richtig" : "✗ Falsch"}
                </span>
                <span className="review-time mono">{formatSeconds(r.timeSpentSeconds)}</span>
              </div>
              <p className="review-question">{q?.question ?? "(Frage nicht mehr im Pool vorhanden)"}</p>
              {q && (
                <div className="review-answers">
                  <div>
                    <span className="review-answer-label">Deine Antwort:</span>{" "}
                    {r.selected.length > 0 ? r.selected.map((id) => optionText(q, id)).join(", ") : "—"}
                  </div>
                  <div>
                    <span className="review-answer-label">Richtige Antwort:</span>{" "}
                    {r.correctAnswers.map((id) => optionText(q, id)).join(", ")}
                  </div>
                  {q.explanation && (
                    <div className="review-explanation">
                      <span className="review-answer-label">Erklärung:</span> {q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="empty-hint">Keine Fragen für diesen Filter.</p>}
      </div>
    </div>
  );
}

function optionText(question: { options: { id: string; text: string }[] }, id: string): string {
  const raw = question.options.find((o) => o.id === id)?.text ?? id;
  return stripFormatting(raw);
}
