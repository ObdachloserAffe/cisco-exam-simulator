import { Link } from "react-router-dom";
import { useResultsStore, useResultsOverview, useCategoryStats } from "../store/resultsStore";
import { useAllQuestions, useCategories } from "../store/questionStore";
import { formatPercent, formatDate, weaknessColor } from "../utils/format";
import "./Dashboard.css";

export default function Dashboard() {
  const overview = useResultsOverview();
  const categoryStats = useCategoryStats();
  const results = useResultsStore((s) => s.results);
  const allQuestions = useAllQuestions();
  const categories = useCategories();

  const recent = [...results].sort((a, b) => b.submittedAt - a.submittedAt).slice(0, 5);

  return (
    <div>
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="page-sub">{allQuestions.length} Fragen im Pool · {categories.length} Kategorien</p>
      </header>

      <div className="stat-grid">
        <StatCard label="Prüfungen" value={overview.totalExams.toString()} />
        <StatCard label="Bestanden" value={overview.passedCount.toString()} tone="good" />
        <StatCard label="Nicht bestanden" value={overview.failedCount.toString()} tone={overview.failedCount > 0 ? "bad" : undefined} />
        <StatCard label="Durchschnitt" value={overview.totalExams ? formatPercent(overview.averagePercent) : "–"} />
        <StatCard label="Beste Prüfung" value={overview.bestPercent !== null ? formatPercent(overview.bestPercent) : "–"} tone="good" />
        <StatCard label="Schlechteste Prüfung" value={overview.worstPercent !== null ? formatPercent(overview.worstPercent) : "–"} />
      </div>

      <div className="dash-grid">
        <section className="card panel">
          <h3 className="panel-title">Kategorien</h3>
          {categoryStats.length === 0 ? (
            <p className="empty-hint">Noch keine Prüfungsergebnisse vorhanden.</p>
          ) : (
            <div className="cat-list">
              {categoryStats.map((c) => (
                <div className="cat-row" key={c.category}>
                  <span className={`status-dot ${weaknessColor(c.percent)}`} />
                  <span className="cat-name">{c.category}</span>
                  <div className="cat-bar-track">
                    <div
                      className={`cat-bar-fill ${weaknessColor(c.percent)}`}
                      style={{ width: `${c.percent}%` }}
                    />
                  </div>
                  <span className="cat-percent mono">{formatPercent(c.percent)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card panel">
          <h3 className="panel-title">Zuletzt bearbeitet</h3>
          {recent.length === 0 ? (
            <p className="empty-hint">Noch keine Prüfungen abgelegt.</p>
          ) : (
            <div className="recent-list">
              {recent.map((r) => (
                <Link to={`/results/${r.id}`} key={r.id} className="recent-row">
                  <span className={`status-dot ${r.passed ? "good" : "bad"}`} />
                  <span className="mono">{formatDate(r.submittedAt)}</span>
                  <span className="recent-score mono">{formatPercent(r.scorePercent)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="cta-row">
        <Link to="/exam/new" className="btn btn-primary">Neue Prüfung starten</Link>
        <Link to="/weaknesses" className="btn">Meine Schwächen ansehen</Link>
        <Link to="/questions" className="btn">Fragen importieren</Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value mono${tone ? ` tone-${tone}` : ""}`}>{value}</div>
    </div>
  );
}
