import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAllQuestions, useCategories } from "../store/questionStore";
import { useSettingsStore } from "../store/settingsStore";
import { useCategoryStats, useWrongQuestionIds } from "../store/resultsStore";
import { useExamSessionStore } from "../store/examSessionStore";
import type { Difficulty, ExamConfig, ExamTemplateType } from "../types";
import "./ExamSetup.css";

const TEMPLATES: { id: ExamTemplateType; label: string; desc: string }[] = [
  { id: "full", label: "Vollständige Prüfung", desc: "Alle Kategorien werden berücksichtigt." },
  { id: "random", label: "Zufallsprüfung", desc: "Komplett zufällige Auswahl aus dem gesamten Pool." },
  { id: "category", label: "Kategorieprüfung", desc: "Nur eine oder mehrere ausgewählte Kategorien." },
  { id: "weakness", label: "Schwächenprüfung", desc: "Bevorzugt Fragen aus schwachen Kategorien." },
  { id: "mistakes", label: "Fehlerprüfung", desc: "Nur bisher falsch beantwortete Fragen." },
  { id: "custom", label: "Benutzerdefiniert", desc: "Kategorien, Anzahl, Zeit und Schwierigkeit frei wählen." },
];

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export default function ExamSetup() {
  const navigate = useNavigate();
  const allQuestions = useAllQuestions();
  const categories = useCategories();
  const settings = useSettingsStore((s) => s.settings);
  const categoryStats = useCategoryStats();
  const wrongIds = useWrongQuestionIds();
  const startExam = useExamSessionStore((s) => s.startExam);

  const [template, setTemplate] = useState<ExamTemplateType>("full");
  const [mode, setMode] = useState<"exam" | "study">("exam");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);
  const [questionCount, setQuestionCount] = useState(settings.questionsPerExam);
  const [timeLimit, setTimeLimit] = useState(settings.examTimeMinutes);

  const weakCategories = useMemo(
    () => categoryStats.filter((c) => c.percent < 80).map((c) => c.category),
    [categoryStats]
  );

  const pool = useMemo(() => {
    if (template === "mistakes") {
      return allQuestions.filter((q) => wrongIds.includes(q.id));
    }
    if (template === "weakness") {
      const cats = weakCategories.length > 0 ? weakCategories : categories;
      return allQuestions.filter((q) => cats.includes(q.category));
    }
    return allQuestions;
  }, [template, allQuestions, wrongIds, weakCategories, categories]);

  const availableCount = pool.length;
  const effectiveCount = Math.min(questionCount, availableCount);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }
  function toggleDifficulty(d: Difficulty) {
    setSelectedDifficulties((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function handleStart() {
    const config: ExamConfig = {
      templateType: template,
      questionCount: template === "mistakes" ? availableCount : questionCount,
      timeLimitMinutes: mode === "study" ? 0 : timeLimit,
      categories: template === "category" || template === "custom" ? selectedCategories : undefined,
      difficulties: template === "custom" ? selectedDifficulties : undefined,
      shuffleQuestions: settings.shuffleQuestions,
      shuffleOptions: settings.shuffleOptions,
      passThreshold: settings.passThreshold,
      mode,
    };
    const session = startExam(pool, config);
    if (session) {
      navigate(`/exam/run`);
    }
  }

  const canStart = availableCount > 0 && (template !== "category" || selectedCategories.length > 0);

  return (
    <div>
      <header className="page-header">
        <h1>Prüfung starten</h1>
        <p className="page-sub">Wähle einen Prüfungstyp und passe die Parameter an.</p>
      </header>

      <div className="template-grid">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            className={`template-card${template === t.id ? " selected" : ""}`}
            onClick={() => setTemplate(t.id)}
          >
            <div className="template-label">{t.label}</div>
            <div className="template-desc">{t.desc}</div>
          </button>
        ))}
      </div>

      <div className="card config-panel">
        <div className="config-row">
          <label className="config-label">Modus</label>
          <div className="segmented">
            <button className={mode === "exam" ? "active" : ""} onClick={() => setMode("exam")}>
              Exam Mode
            </button>
            <button className={mode === "study" ? "active" : ""} onClick={() => setMode("study")}>
              Lernmodus
            </button>
          </div>
        </div>

        {(template === "category" || template === "custom") && (
          <div className="config-row">
            <label className="config-label">Kategorien</label>
            <div className="chip-list">
              {categories.map((c) => (
                <button
                  key={c}
                  className={`chip${selectedCategories.includes(c) ? " selected" : ""}`}
                  onClick={() => toggleCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {template === "custom" && (
          <div className="config-row">
            <label className="config-label">Schwierigkeit</label>
            <div className="chip-list">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  className={`chip${selectedDifficulties.includes(d) ? " selected" : ""}`}
                  onClick={() => toggleDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {template !== "mistakes" && (
          <div className="config-row">
            <label className="config-label">Anzahl Fragen</label>
            <input
              type="number"
              className="text-input"
              min={1}
              max={Math.max(availableCount, 1)}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            />
          </div>
        )}

        {mode === "exam" && (
          <div className="config-row">
            <label className="config-label">Zeitlimit (Minuten, 0 = kein Limit)</label>
            <input
              type="number"
              className="text-input"
              min={0}
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
            />
          </div>
        )}

        <div className="config-summary mono">
          {availableCount} Fragen verfügbar · {mode === "exam" ? `${effectiveCount} werden gestellt` : "alle im Lernmodus verfügbar"}
        </div>

        <button className="btn btn-primary start-btn" disabled={!canStart} onClick={handleStart}>
          {mode === "exam" ? "Prüfung starten" : "Lernmodus starten"}
        </button>
        {!canStart && <p className="warn-text">Keine passenden Fragen für diese Auswahl verfügbar.</p>}
      </div>
    </div>
  );
}
