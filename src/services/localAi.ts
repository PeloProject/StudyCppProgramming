import type { AiSettings, ReviewEvaluationRequest, ReviewEvaluationResult, ReviewVerdict } from '../types/review';

interface ConnectionStatus {
  ok: boolean;
  message: string;
}

const REQUEST_TIMEOUT_MS = 10000;

const sanitizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const createTimeoutSignal = () => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timeoutId),
  };
};

const createDefaultResult = (model: string): ReviewEvaluationResult => ({
  verdict: 'incorrect',
  score: 0,
  summary: 'AI の応答をうまく解釈できませんでした。',
  strengths: [],
  missedPoints: ['JSON 形式の応答が取得できませんでした。'],
  suggestedFix: 'AI の応答形式を確認して、もう一度判定してください。',
  rawModelName: model,
});

const normalizeVerdict = (value: unknown): ReviewVerdict => {
  if (value === 'correct' || value === 'partial' || value === 'incorrect') {
    return value;
  }

  return 'incorrect';
};

const parseEvaluationResult = (content: string, model: string): ReviewEvaluationResult => {
  const fallback = createDefaultResult(model);
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(match[0]) as Partial<ReviewEvaluationResult>;
    return {
      verdict: normalizeVerdict(parsed.verdict),
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.score))) : fallback.score,
      summary: typeof parsed.summary === 'string' && parsed.summary.trim().length > 0 ? parsed.summary.trim() : fallback.summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((item): item is string => typeof item === 'string') : [],
      missedPoints: Array.isArray(parsed.missedPoints) ? parsed.missedPoints.filter((item): item is string => typeof item === 'string') : fallback.missedPoints,
      suggestedFix:
        typeof parsed.suggestedFix === 'string' && parsed.suggestedFix.trim().length > 0 ? parsed.suggestedFix.trim() : fallback.suggestedFix,
      rawModelName:
        typeof parsed.rawModelName === 'string' && parsed.rawModelName.trim().length > 0 ? parsed.rawModelName.trim() : model,
    };
  } catch {
    return fallback;
  }
};

const createPrompt = (request: ReviewEvaluationRequest) => `
あなたは C++ コードレビュー問題の採点者です。
受験者の回答が模範観点に合っているかを日本語で採点してください。

必須条件:
- 返答は JSON のみ
- keys は verdict, score, summary, strengths, missedPoints, suggestedFix, rawModelName
- verdict は correct / partial / incorrect のいずれか
- strengths と missedPoints は文字列配列
- summary と suggestedFix は短い日本語
- rawModelName には利用モデル名を入れる

採点基準:
- requiredPoints を多く満たすほど高評価
- bonusPoints は加点対象
- antiPatterns に当てはまる場合は減点

問題ID: ${request.problemId}
出題文:
${request.prompt}

レビュー対象コード:
\`\`\`cpp
${request.reviewCode}
\`\`\`

必須観点:
${request.rubric.requiredPoints.map((item) => `- ${item}`).join('\n')}

加点観点:
${request.rubric.bonusPoints.map((item) => `- ${item}`).join('\n')}

減点観点:
${request.rubric.antiPatterns.map((item) => `- ${item}`).join('\n')}

受験者の回答:
${request.userAnswer}
`;

const createCommonHeaders = (settings: AiSettings) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (settings.apiKey) {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  }

  return headers;
};

async function callOllama(request: ReviewEvaluationRequest, settings: AiSettings): Promise<ReviewEvaluationResult> {
  const timeout = createTimeoutSignal();
  let response: Response;

  try {
    response = await fetch(`${sanitizeBaseUrl(settings.baseUrl)}/api/chat`, {
      method: 'POST',
      headers: createCommonHeaders(settings),
      signal: timeout.signal,
      body: JSON.stringify({
        model: settings.model,
        stream: false,
        format: 'json',
        messages: [
          {
            role: 'system',
            content: 'Return valid JSON only.',
          },
          {
            role: 'user',
            content: createPrompt(request),
          },
        ],
      }),
    });
  } finally {
    timeout.clear();
  }

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { message?: { content?: string }; model?: string };
  return parseEvaluationResult(data.message?.content || '', data.model || settings.model);
}

async function callOpenAiCompatible(request: ReviewEvaluationRequest, settings: AiSettings): Promise<ReviewEvaluationResult> {
  const timeout = createTimeoutSignal();
  let response: Response;

  try {
    response = await fetch(`${sanitizeBaseUrl(settings.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: createCommonHeaders(settings),
      signal: timeout.signal,
      body: JSON.stringify({
        model: settings.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a strict C++ code review grader. Return JSON only.',
          },
          {
            role: 'user',
            content: createPrompt(request),
          },
        ],
      }),
    });
  } finally {
    timeout.clear();
  }

  if (!response.ok) {
    throw new Error(`OpenAI-compatible request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };

  return parseEvaluationResult(data.choices?.[0]?.message?.content || '', data.model || settings.model);
}

export async function evaluateReviewAnswer(
  request: ReviewEvaluationRequest,
  settings: AiSettings,
): Promise<ReviewEvaluationResult> {
  if (settings.provider === 'ollama') {
    return callOllama(request, settings);
  }

  return callOpenAiCompatible(request, settings);
}

export async function checkAiConnection(settings: AiSettings): Promise<ConnectionStatus> {
  const timeout = createTimeoutSignal();

  try {
    if (settings.provider === 'ollama') {
      const response = await fetch(`${sanitizeBaseUrl(settings.baseUrl)}/api/tags`, {
        signal: timeout.signal,
      });
      if (!response.ok) {
        return { ok: false, message: `Ollama に接続できませんでした (${response.status})` };
      }

      return { ok: true, message: 'Ollama に接続できました。' };
    }

    const response = await fetch(`${sanitizeBaseUrl(settings.baseUrl)}/models`, {
      headers: createCommonHeaders(settings),
      signal: timeout.signal,
    });

    if (!response.ok) {
      return { ok: false, message: `OpenAI互換API に接続できませんでした (${response.status})` };
    }

    return { ok: true, message: 'OpenAI互換API に接続できました。' };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'ローカルAIへの接続確認に失敗しました。',
    };
  } finally {
    timeout.clear();
  }
}
