import { AlertCircle, CheckCircle2, MessageSquareCode, Sparkles } from 'lucide-react';
import type { ReviewEvaluationResult, ReviewProblem, ReviewProgress } from '../types/review';

interface ReviewProblemWorkspaceProps {
  problem: ReviewProblem;
  answer: string;
  onAnswerChange: (value: string) => void;
  onEvaluate: () => Promise<void>;
  onResetAnswer: () => void;
  result: ReviewEvaluationResult | null;
  progress: ReviewProgress | undefined;
  isEvaluating: boolean;
  fallbackMessage: string | null;
  showManualFallback: boolean;
}

const verdictStyle = {
  correct: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
  partial: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
  incorrect: 'border-rose-300/20 bg-rose-300/10 text-rose-100',
};

export function ReviewProblemWorkspace({
  problem,
  answer,
  onAnswerChange,
  onEvaluate,
  onResetAnswer,
  result,
  progress,
  isEvaluating,
  fallbackMessage,
  showManualFallback,
}: ReviewProblemWorkspaceProps) {
  return (
    <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-rose-200/80">{problem.category}</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">{problem.title}</h1>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-200">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">難易度 {problem.difficulty}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{problem.estimatedMinutes}分目安</span>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-white">
              <MessageSquareCode className="h-4 w-4 text-rose-200" />
              <p className="font-medium">レビューのお題</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200">{problem.prompt}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {problem.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#111827] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Review Target</p>
            <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/90 p-4 text-xs leading-6 text-slate-100">
              {problem.reviewCode}
            </pre>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-white">確認したい模範観点を開く</summary>
              <div className="mt-3 space-y-2">
                {problem.expectedPoints.map((point) => (
                  <div key={point} className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-slate-200">
                    {point}
                  </div>
                ))}
              </div>
            </details>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">回答を書く</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                問題点と修正方針を、1つの文章欄にまとめて書けば大丈夫です。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onResetAnswer}
                disabled={isEvaluating && answer.trim().length === 0}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                回答をリセット
              </button>
              <button
                onClick={onEvaluate}
                disabled={isEvaluating || answer.trim().length === 0}
                className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEvaluating ? 'AIで判定中...' : 'AIで判定'}
              </button>
            </div>
          </div>

          <textarea
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            rows={11}
            className="mt-5 w-full rounded-[24px] border border-white/10 bg-[#111827] p-4 text-sm leading-7 text-white outline-none placeholder:text-slate-500"
            placeholder="例: 何が危険か、なぜ問題か、どう直すべきかを書きます。"
          />

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">前回判定</p>
              <p className="mt-2 text-sm text-white">{progress?.lastVerdict || '-'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">前回スコア</p>
              <p className="mt-2 text-sm text-white">{progress?.lastScore ?? '-'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">挑戦回数</p>
              <p className="mt-2 text-sm text-white">{progress?.attempts ?? 0}回</p>
            </div>
          </div>

          {result && (
            <div className={`mt-5 rounded-[24px] border p-5 ${verdictStyle[result.verdict]}`}>
              <div className="flex items-start gap-3">
                {result.verdict === 'correct' ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5" />
                ) : result.verdict === 'partial' ? (
                  <Sparkles className="mt-0.5 h-5 w-5" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {result.verdict === 'correct' ? '正解に近い回答です' : result.verdict === 'partial' ? '部分点です' : '見直す余地があります'}
                  </p>
                  <p className="mt-2 text-sm leading-6 opacity-90">{result.summary}</p>
                  <p className="mt-2 text-sm leading-6 opacity-90">スコア: {result.score} / 100</p>
                  <p className="mt-2 text-xs opacity-75">model: {result.rawModelName}</p>
                </div>
              </div>

              {result.strengths.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium">拾えていた観点</p>
                  <div className="mt-2 space-y-2">
                    {result.strengths.map((item) => (
                      <div key={item} className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.missedPoints.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium">不足していた観点</p>
                  <div className="mt-2 space-y-2">
                    {result.missedPoints.map((item) => (
                      <div key={item} className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6">
                次に意識する修正方針: {result.suggestedFix}
              </div>
            </div>
          )}

          {showManualFallback && (
            <div className="mt-5 rounded-[24px] border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
              <p className="font-medium">AI が使えなかったため、手動確認に切り替えました。</p>
              <p className="mt-2 text-sm leading-6 opacity-90">
                {fallbackMessage || 'AI への接続が確認できなかったため、模範観点と参考回答で手動確認できるようにしています。'}
              </p>
              <div className="mt-4 space-y-2">
                {problem.manualFallback.map((item) => (
                  <div key={item} className="rounded-xl border border-amber-100/10 bg-black/10 p-3 text-sm">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-amber-100/10 bg-black/10 p-4">
                <p className="text-sm font-medium">参考回答</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{problem.sampleAnswer}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
