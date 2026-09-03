import { useRef, useState } from "react";
import { useQuestionStore, useAllQuestions, useCategories } from "../store/questionStore";
import type { ImportSummary } from "../types";
import "./QuestionsPage.css";

export default function QuestionsPage() {
  const userQuestions = useQuestionStore((s) => s.userQuestions);
  const useDemoQuestions = useQuestionStore((s) => s.useDemoQuestions);
  const toggleDemoQuestions = useQuestionStore((s) => s.toggleDemoQuestions);
  const importQuestions = useQuestionStore((s) => s.importQuestions);
  const clearUserQuestions = useQuestionStore((s) => s.clearUserQuestions);
  const allQuestions = useAllQuestions();
  const categories = useCategories();

  const fileInput = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        const result = importQuestions(raw);
        setSummary(result);
      } catch {
        setSummary({
          totalAttempted: 0,
          imported: 0,
          errors: [{ questionId: "-", message: "Die Datei enthält kein gültiges JSON." }],
          categoryCounts: {},
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleExportQuestions() {
    const blob = new Blob([JSON.stringify(userQuestions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cisco-fragenkatalog-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <header className="page-header">
        <h1>Fragenkatalog</h1>
        <p className="page-sub">{allQuestions.length} Fragen aktiv · {categories.length} Kategorien</p>
      </header>

      <div className="card panel">
        <h3 className="panel-title">Fragen importieren</h3>
        <p className="import-hint">
          JSON-Datei mit einem Array von Fragen (siehe Schema). Bereits vorhandene Fragen mit gleicher ID werden ersetzt.
          Es werden ausschließlich die von dir bereitgestellten Fragen verwendet — nichts wird erfunden oder verändert.
        </p>
        <input ref={fileInput} type="file" accept="application/json" onChange={handleFile} style={{ display: "none" }} />
        <button className="btn btn-primary" onClick={() => fileInput.current?.click()}>
          JSON-Datei auswählen
        </button>

        {summary && (
          <div className="import-summary">
            {summary.imported > 0 && (
              <div className="import-success mono">✓ {summary.imported} Fragen importiert</div>
            )}
            {summary.imported > 0 && (
              <div className="cat-counts">
                {Object.entries(summary.categoryCounts).map(([cat, count]) => (
                  <span key={cat} className="cat-count-chip mono">
                    {cat}: {count}
                  </span>
                ))}
              </div>
            )}
            {summary.errors.length > 0 && (
              <div className="import-errors">
                <div className="import-errors-title">
                  {summary.errors.length} Fehler beim Import:
                </div>
                {summary.errors.map((err, i) => (
                  <div key={i} className="import-error-row mono">
                    {err.questionId}: {err.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card panel" style={{ marginTop: 16 }}>
        <h3 className="panel-title">Verwaltung</h3>
        <div className="manage-row">
          <label className="toggle-row">
            <input type="checkbox" checked={useDemoQuestions} onChange={(e) => toggleDemoQuestions(e.target.checked)} />
            Demo-Fragen anzeigen ({useDemoQuestions ? "aktiv" : "ausgeblendet"})
          </label>
        </div>
        <div className="manage-row">
          <span className="mono">{userQuestions.length} importierte Fragen gespeichert</span>
        </div>
        <div className="cta-row">
          <button className="btn" onClick={handleExportQuestions} disabled={userQuestions.length === 0}>
            Fragenkatalog exportieren (JSON)
          </button>
          <button className="btn btn-danger" onClick={clearUserQuestions} disabled={userQuestions.length === 0}>
            Importierte Fragen löschen
          </button>
        </div>
      </div>

      <div className="card panel" style={{ marginTop: 16 }}>
        <h3 className="panel-title">Kategorien im Pool</h3>
        <div className="chip-list">
          {categories.map((c) => (
            <span key={c} className="chip">{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
