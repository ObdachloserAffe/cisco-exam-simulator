// ---------------------------------------------------------------------------
// Core domain types for the Cisco Final Exam Simulator
// ---------------------------------------------------------------------------

export type QuestionType = "single_choice" | "multiple_choice" | "true_false";
export type Difficulty = "easy" | "medium" | "hard";

export interface AnswerOption {
  id: string; // e.g. "A", "B", "C", "D"
  text: string;
}

export interface Question {
  id: string; // e.g. "Q001"
  category: string;
  question: string;
  type: QuestionType;
  options: AnswerOption[];
  correct_answers: string[]; // option ids
  explanation?: string;
  difficulty?: Difficulty;
  image?: string; // optional base64 or URL
  isDemo?: boolean; // marks bundled demo questions
}

// A question as validated/normalized internally. Same shape as Question,
// kept separate so import validation has a clear "raw -> normalized" step.
export type NormalizedQuestion = Question;

// ---------------------------------------------------------------------------
// Exam session
// ---------------------------------------------------------------------------

export type ExamTemplateType =
  | "full"
  | "random"
  | "category"
  | "weakness"
  | "mistakes"
  | "custom";

export interface ExamConfig {
  templateType: ExamTemplateType;
  questionCount: number;
  timeLimitMinutes: number; // 0 = no limit
  categories?: string[]; // for category / custom exams
  difficulties?: Difficulty[]; // for custom exams
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  passThreshold: number; // percent, e.g. 80
  mode: "exam" | "study";
}

export interface ExamAnswer {
  questionId: string;
  selectedOptionIds: string[]; // empty = unanswered
  flagged: boolean;
  timeSpentSeconds: number;
  // study mode bookkeeping
  revealed?: boolean;
}

export interface ExamSession {
  id: string;
  config: ExamConfig;
  questionIds: string[]; // fixed order for this session
  // per-question shuffled option order, keyed by questionId
  optionOrder: Record<string, string[]>;
  answers: Record<string, ExamAnswer>;
  startedAt: number; // epoch ms
  endsAt: number | null; // epoch ms, null = untimed
  submittedAt: number | null;
  currentIndex: number;
  status: "in_progress" | "submitted";
}

export interface QuestionResult {
  questionId: string;
  category: string;
  correct: boolean;
  skipped: boolean;
  selected: string[];
  correctAnswers: string[];
  timeSpentSeconds: number;
}

export interface ExamResult {
  id: string;
  sessionId: string;
  config: ExamConfig;
  startedAt: number;
  submittedAt: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  scorePercent: number;
  passed: boolean;
  categoryBreakdown: Record<string, { correct: number; total: number }>;
  questionResults: QuestionResult[];
  durationSeconds: number;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface AppSettings {
  questionsPerExam: number;
  examTimeMinutes: number;
  passThreshold: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  questionsPerExam: 60,
  examTimeMinutes: 90,
  passThreshold: 80,
  shuffleQuestions: true,
  shuffleOptions: true,
};

// ---------------------------------------------------------------------------
// Import validation
// ---------------------------------------------------------------------------

export interface ImportError {
  questionId: string;
  message: string;
}

export interface ImportSummary {
  totalAttempted: number;
  imported: number;
  errors: ImportError[];
  categoryCounts: Record<string, number>;
}
