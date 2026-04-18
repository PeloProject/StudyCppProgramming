export type AiProvider = 'ollama' | 'openai-compatible';

export type ReviewVerdict = 'correct' | 'partial' | 'incorrect';

export interface ReviewAiRubric {
  requiredPoints: string[];
  bonusPoints: string[];
  antiPatterns: string[];
}

export interface ReviewProblem {
  id: string;
  title: string;
  category: string;
  estimatedMinutes: number;
  difficulty: 1 | 2 | 3;
  tags: string[];
  dailyEligible: boolean;
  prompt: string;
  reviewCode: string;
  expectedPoints: string[];
  sampleAnswer: string;
  aiRubric: ReviewAiRubric;
  manualFallback: string[];
}

export interface AiSettings {
  provider: AiProvider;
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export interface ReviewEvaluationRequest {
  problemId: string;
  prompt: string;
  reviewCode: string;
  userAnswer: string;
  rubric: ReviewAiRubric;
}

export interface ReviewEvaluationResult {
  verdict: ReviewVerdict;
  score: number;
  summary: string;
  strengths: string[];
  missedPoints: string[];
  suggestedFix: string;
  rawModelName: string;
}

export interface ReviewProgress {
  lastAnswer: string;
  lastVerdict: ReviewVerdict | null;
  lastScore: number | null;
  lastAnsweredAt: string | null;
  firstCorrectAt: string | null;
  retryCount: number;
  reviewPriority: number;
  manualFallbackUsed: boolean;
  attempts: number;
}

export type ReviewProgressMap = Record<string, ReviewProgress>;
