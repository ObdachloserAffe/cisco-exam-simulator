import { useNavigate } from "react-router-dom";
import { useCategoryStats } from "../store/resultsStore";
import { useAllQuestions } from "../store/questionStore";
import { useSettingsStore } from "../store/settingsStore";
import { useExamSessionStore } from "../store/examSessionStore";
import { formatPercent, weaknessColor } from "../utils/format";
import "./Weaknesses.css";

export default function Weaknesses() {
  const navigate = useNavigate();
  const categoryStats = useCategoryStats();
  const allQuestions = useAllQuestions();
  const settings = useSettingsStore((s) => s.settings);
  const startExam = useExamSessionStore((s) => s.startExam);

  const weak = categoryStats.filter((c) => c.percent < 80);

  function startWeaknessExam() {
    const weakCats = weak.length > 0 ? weak.map((c) => c.category) : categoryStats.map((c) => c.category);
    const pool = weakCats.length > 0 ? allQuestions.filter((q) => weakCats.includes(q.category)) : allQuestions;
    const session = startExam(pool, {
      templateType: "weakness",
      questionCount: settings.questionsPerExam,
      timeLimitMinutes: settings.examTimeMinutes,
      shuffleQuestions: settings.shuffleQuestions,
      shuffleOptions: settings.shuffleOptions,
      passThreshold: settings.passThreshold,
      mode: "exam",
    });
    if (session) navigate("/exam/run");
  }

  return (
    <div>
      <header className="page-header">
        <h1>Meine Schwächen</h1>
        <p className="page-sub">Kategorien mit niedriger Erfolgsquote aus allen bisherigen Prüfungen.</p>
      </header>

      {categoryStats.length === 0 ? (
        <div className="card empty-session">
          <p>Noch keine Prüfungsergebnisse vorhanden. Lege eine Prüfung ab, um Schwächen zu erkennen.</p>
          <button className="btn btn-primary" onClick={() => navigate("/exam/new")}>
            Prüfung starten
          </button>
        </div>
      ) : (
        <>
          <div className="card panel weakness-list">
            {categoryStats.map((c) => (
              <div className="weakness-row" key={c.category}>
                <span className={`status-dot ${weaknessColor(c.percent)}`} />
                <span className="weakness-name">{c.category}</span>
                <span className="weakness-count mono">{c.correct}/{c.total}</span>
                <span className={`weakness-percent mono tone-${weaknessColor(c.percent)}`}>
                  {formatPercent(c.percent)}
                </span>
              </div>
            ))}
          </div>

          <div className="cta-row" style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={startWeaknessExam}>
              Schwächen-Exam starten
            </button>
          </div>
        </>
      )}
    </div>
  );
}
