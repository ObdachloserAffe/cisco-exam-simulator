import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExamSessionStore } from "../store/examSessionStore";
import { useAllQuestions } from "../store/questionStore";
import { useResultsStore } from "../store/resultsStore";
import { useExamTimer } from "../hooks/useExamTimer";
import { isAnswerCorrect, scoreSession } from "../services/examEngine";
import { formatSeconds, renderFormattedText } from "../utils/format";
import "./ExamRunner.css";

export default function ExamRunner() {
  const navigate = useNavigate();
  const session = useExamSessionStore((s) => s.session);
  const goTo = useExamSessionStore((s) => s.goTo);
  const setAnswer = useExamSessionStore((s) => s.setAnswer);
  const toggleFlag = useExamSessionStore((s) => s.toggleFlag);
  const revealAnswer = useExamSessionStore((s) => s.revealAnswer);
  const submitSession = useExamSessionStore((s) => s.submit);
  const restoreFromStorage = useExamSessionStore((s) => s.restoreFromStorage);
  const allQuestions = useAllQuestions();
  const addResult = useResultsStore((s) => s.addResult);

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    if (!session) restoreFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const questionsById = useMemo(() => new Map(allQuestions.map((q) => [q.id, q])), [allQuestions]);

  const handleSubmit = useCallback(() => {
    if (!session) return;
    submitSession();
    const finished = { ...session, status: "submitted" as const, submittedAt: Date.now() };
    const result = scoreSession(finished, questionsById);
    addResult(result);
    navigate(`/results/${result.id}`, { state: { result } });
  }, [session, submitSession, questionsById, addResult, navigate]);

  const remaining = useExamTimer(session, handleSubmit);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [session?.currentIndex]);

  if (!session) {
    return (
      <div className="card empty-session">
        <p>Keine aktive Prüfung. Starte eine neue Prüfung über „Prüfung starten“.</p>
        <button className="btn btn-primary" onClick={() => navigate("/exam/new")}>
          Zur Prüfungsauswahl
        </button>
      </div>
    );
  }

  const currentId = session.questionIds[session.currentIndex];
  const question = questionsById.get(currentId);
  const isStudy = session.config.mode === "study";

  if (!question) {
    return <div className="card empty-session">Frage nicht gefunden (evtl. wurde der Fragenpool geändert).</div>;
  }

  const answer = session.answers[currentId];
  const selected = answer?.selectedOptionIds ?? [];
  const flagged = answer?.flagged ?? false;
  const revealed = isStudy && !!answer?.revealed;
  const optionOrder = session.optionOrder[currentId] ?? question.options.map((o) => o.id);
  const optionsById = new Map(question.options.map((o) => [o.id, o]));

  function commitTimeSpent() {
    if (!session) return;
    const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
    const existing = session.answers[currentId];
    const updated = {
      questionId: currentId,
      selectedOptionIds: existing?.selectedOptionIds ?? [],
      flagged: existing?.flagged ?? false,
      timeSpentSeconds: (existing?.timeSpentSeconds ?? 0) + elapsed,
      revealed: existing?.revealed,
    };
    session.answers[currentId] = updated;
  }

  function selectOption(optionId: string) {
    if (revealed) return;
    if (question!.type === "multiple_choice") {
      const next = selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId];
      setAnswer(currentId, next);
    } else {
      setAnswer(currentId, [optionId]);
    }
  }

  function goNext() {
    commitTimeSpent();
    if (session!.currentIndex < session!.questionIds.length - 1) goTo(session!.currentIndex + 1);
  }
  function goPrev() {
    commitTimeSpent();
    if (session!.currentIndex > 0) goTo(session!.currentIndex - 1);
  }

  const answeredCount = Object.values(session.answers).filter((a) => a.selectedOptionIds.length > 0).length;

  return (
    <div className="exam-runner">
      <div className="exam-topbar">
        <div className="exam-title mono">{isStudy ? "LERNMODUS" : "EXAM MODE"}</div>
        {remaining !== null && (
          <div className={`timer mono${remaining < 60 ? " timer-critical" : ""}`}>{formatSeconds(remaining)}</div>
        )}
        <button className="btn btn-danger" onClick={() => setShowSubmitConfirm(true)}>
          Prüfung abgeben
        </button>
      </div>

      <div className="exam-progress mono">
        Frage {session.currentIndex + 1} von {session.questionIds.length} · {answeredCount} beantwortet
      </div>

      <div className="card question-card">
        <div className="question-meta">
          <span className="q-category">{question.category}</span>
          {question.difficulty && <span className="q-difficulty">{question.difficulty}</span>}
          {question.type === "multiple_choice" && (
            <span className="q-multi">
              Mehrfachauswahl · {question.correct_answers.length} Antworten erforderlich
            </span>
          )}
        </div>
        <p className="question-text">{question.question}</p>
        {question.type === "multiple_choice" && (
          <p className="multi-progress mono">
            {selected.length} von {question.correct_answers.length} ausgewählt
          </p>
        )}

        <div className="options-list">
          {optionOrder.map((optId) => {
            const opt = optionsById.get(optId);
            if (!opt) return null;
            const isSelected = selected.includes(optId);
            const isCorrectOpt = question.correct_answers.includes(optId);
            let stateClass = "";
            if (revealed) {
              if (isCorrectOpt) stateClass = "correct";
              else if (isSelected && !isCorrectOpt) stateClass = "incorrect";
            } else if (isSelected) {
              stateClass = "selected";
            }
            return (
              <button
                key={optId}
                className={`option-row ${stateClass}`}
                onClick={() => selectOption(optId)}
                disabled={revealed}
              >
                <span className={`option-marker ${question.type === "multiple_choice" ? "checkbox" : "radio"}${isSelected ? " checked" : ""}`} />
                <span className="option-text">{renderFormattedText(opt.text)}</span>
              </button>
            );
          })}
        </div>

        {isStudy && !revealed && (
          <button className="btn btn-primary reveal-btn" onClick={() => revealAnswer(currentId)} disabled={selected.length === 0}>
            Antwort prüfen
          </button>
        )}

        {revealed && (
          <div className={`reveal-box ${isAnswerCorrect(question, selected) ? "correct" : "incorrect"}`}>
            <div className="reveal-verdict">
              {isAnswerCorrect(question, selected) ? "✓ Richtig" : "✗ Falsch"}
            </div>
            {question.explanation && <p className="reveal-explanation">{question.explanation}</p>}
          </div>
        )}
      </div>

      <div className="exam-controls">
        <button className="btn" onClick={goPrev} disabled={session.currentIndex === 0}>
          ← Zurück
        </button>
        <button className={`btn${flagged ? " flagged" : ""}`} onClick={() => toggleFlag(currentId)}>
          {flagged ? "★ Markiert" : "☆ Markieren"}
        </button>
        <button className="btn" onClick={goNext} disabled={session.currentIndex === session.questionIds.length - 1}>
          Weiter →
        </button>
      </div>

      <div className="nav-grid">
        {session.questionIds.map((qid, idx) => {
          const a = session.answers[qid];
          let cls = "idle";
          if (a?.selectedOptionIds.length) cls = "good";
          if (a?.flagged) cls = "warn";
          return (
            <button
              key={qid}
              className={`nav-port ${cls}${idx === session.currentIndex ? " current" : ""}`}
              onClick={() => {
                commitTimeSpent();
                goTo(idx);
              }}
              title={`Frage ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {showSubmitConfirm && (
        <div className="modal-backdrop" onClick={() => setShowSubmitConfirm(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h3>Prüfung abgeben?</h3>
            <p className="modal-text">
              {session.questionIds.length - answeredCount} von {session.questionIds.length} Fragen sind noch unbeantwortet.
              Nach der Abgabe kann die Prüfung nicht mehr geändert werden.
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowSubmitConfirm(false)}>Weiter bearbeiten</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Jetzt abgeben</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
