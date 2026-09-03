import { Link, useParams } from "react-router-dom";
import { useResultsStore } from "../store/resultsStore";
import { formatPercent, formatSeconds } from "../utils/format";
import "./ResultSummary.css";

export default function ResultSummary() {
  const { resultId } = useParams();
  const result = useResultsStore((s) => s.results.find((r) => r.id === resultId));

  if (!result) {
    return (
      <div className="card empty-session">
        <p>Ergebnis nicht gefunden.</p>
        <Link to="/" className="btn btn-primary">Zum Dashboard</Link>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <h1>Prüfungsergebnis</h1>
      </header>

      <div className={`card result-hero ${result.passed ? "pass" : "fail"}`}>
        <div className="result-score mono">{formatPercent(result.scorePercent)}</div>
        <div className="result-verdict">{result.passed ? "BESTANDEN" : "NICHT BESTANDEN"}</div>
        <div className="result-sub">
          Bestehensgrenze: {result.config.passThreshold}% · Dauer: {formatSeconds(result.durationSeconds)}
        </div>
      </div>

      <div className="stat-grid result-stats">
        <MiniStat label="Fragen gesamt" value={result.totalQuestions} />
        <MiniStat label="Richtig" value={result.correctCount} tone="good" />
        <MiniStat label="Falsch" value={result.incorrectCount} tone="bad" />
        <MiniStat label="Übersprungen" value={result.skippedCount} />
      </div>

      <section className="card panel">
        <h3 className="panel-title">Ergebnis nach Kategorie</h3>
        <div className="cat-list">
          {Object.entries(result.categoryBreakdown).map(([cat, stat]) => {
            const pct = stat.total === 0 ? 0 : Math.round((stat.correct / stat.total) * 100);
            return (
              <div className="cat-row" key={cat}>
                <span className="cat-name">{cat}</span>
                <div className="cat-bar-track">
                  <div
                    className={`cat-bar-fill ${pct < 65 ? "bad" : pct < 80 ? "warn" : "good"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="cat-percent mono">
                  {stat.correct}/{stat.total} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="cta-row">
        <Link to={`/results/${result.id}/review`} className="btn btn-primary">
          Detaillierte Auswertung
        </Link>
        <Link to="/exam/new" className="btn">
          Neue Prüfung
        </Link>
        <Link to="/" className="btn">
          Zum Dashboard
        </Link>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "good" | "bad" }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value mono${tone ? ` tone-${tone}` : ""}`}>{value}</div>
    </div>
  );
}
