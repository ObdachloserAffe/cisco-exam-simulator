// Thin wrapper around localStorage. Everything stays on-device: no network
// calls, no analytics, no telemetry (see README / requirement #23).

const PREFIX = "cisco-exam-sim:";

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — fail silently, app still works in-memory.
  }
}

export function removeKey(key: string): void {
  localStorage.removeItem(PREFIX + key);
}

export const STORAGE_KEYS = {
  userQuestions: "user-questions",
  settings: "settings",
  results: "results",
  activeSession: "active-session",
} as const;
