/**
 * Renders a small subset of inline formatting used by imported questions to
 * reproduce visual emphasis (e.g. highlighted permission segments) that plain
 * text alone can't express. Only **bold** is supported.
 */
export function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i} className="option-highlight">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/** Strips formatting markers for contexts that only render plain text (e.g. comma-joined lists). */
export function stripFormatting(text: string): string {
  return text.replace(/\*\*/g, "");
}

export function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

export function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function weaknessColor(percent: number): "bad" | "warn" | "good" {
  if (percent < 65) return "bad";
  if (percent < 80) return "warn";
  return "good";
}
