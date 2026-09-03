import { Link } from "react-router-dom";
import { useResultsStore, useResultsOverview, useCategoryStats } from "../store/resultsStore";
import { formatDate, formatPercent, formatSeconds, weaknessColor } from "../utils/format";
import "./Statistics.css";

export default function Statistics() {
  const overview = useResultsOverview();
  const categoryStats = useCategoryStats();
  const results = useResultsStore((s) => s.results);
  const clearResults = useResultsStore((s) => s.clearResults);

  const sorted = [...results].sort((a, b) => b.submittedAt - a.submittedAt);

  function handleExport() {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <header className="page-header">
        <h1>Statistik</h1>
        <p className="page-sub">Lernfortschritt über alle bisherigen Prüfungen.</p>
      </header>

      <div className="stat-grid">
        <MiniStat label="Prüfungen" value={overview.totalExams.toString()} />
        <MiniStat label="Bestanden" value={overview.passedCount.toString()} tone="good" />
        <MiniStat label="Nicht bestanden" value={overview.failedCount.toString()} tone={overview.failedCount > 0 ? "bad" : undefined} />
        <MiniStat label="Erfolgsquote" value={overview.totalExams ? formatPercent((overview.passedCount / overview.totalExams) * 100) : "–"} />
        <MiniStat label="Durchschnitt" value={overview.totalExams ? formatPercent(overview.averagePercent) : "–"} />
        <MiniStat label="Ø Bearbeitungszeit" value={overview.totalExams ? formatSeconds(overview.averageDurationSeconds) : "–"} />
      </div>

      <section className="card panel">
        <h3 className="panel-title">Kategorien</h3>
        {categoryStats.length === 0 ? (
          <p className="empty-hint">Noch keine Daten.</p>
        ) : (
          <div className="cat-list">
            {categoryStats.map((c) => (
              <div className="cat-row" key={c.category}>
                <span className={`status-dot ${weaknessColor(c.percent)}`} />
                <span className="cat-name">{c.category}</span>
                <div className="cat-bar-track">
                  <div className={`cat-bar-fill ${weaknessColor(c.percent)}`} style={{ width: `${c.percent}%` }} />
                </div>
                <span className="cat-percent mono">{c.correct}/{c.total} ({formatPercent(c.percent)})</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card panel" style={{ marginTop: 16 }}>
        <h3 className="panel-title">Alle Prüfungen</h3>
        {sorted.length === 0 ? (
          <p className="empty-hint">Noch keine Prüfungen abgelegt.</p>
        ) : (
          <table className="results-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Typ</th>
                <th>Punktzahl</th>
                <th>Status</th>
                <th>Dauer</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{formatDate(r.submittedAt)}</td>
                  <td>{r.config.templateType}</td>
                  <td className="mono">{formatPercent(r.scorePercent)}</td>
                  <td className={r.passed ? "tone-good" : "tone-bad"}>{r.passed ? "Bestanden" : "Nicht bestanden"}</td>
                  <td className="mono">{formatSeconds(r.durationSeconds)}</td>
                  <td>
                    <Link to={`/results/${r.id}`} className="table-link">Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="cta-row" style={{ marginTop: 20 }}>
        <button className="btn" onClick={handleExport} disabled={results.length === 0}>
          Ergebnisse exportieren (JSON)
        </button>
        <button className="btn btn-danger" onClick={clearResults} disabled={results.length === 0}>
          Statistik zurücksetzen
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value mono${tone ? ` tone-${tone}` : ""}`}>{value}</div>
    </div>
  );
}
