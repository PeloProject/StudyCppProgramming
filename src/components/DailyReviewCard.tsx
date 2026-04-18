import { ChevronRight, MessageSquareCode } from 'lucide-react';
import type { ReviewProblem, ReviewProgress } from '../types/review';

interface DailyReviewCardProps {
  problem?: ReviewProblem;
  progress?: ReviewProgress;
  onOpen: (problemId: string) => void;
}

export function DailyReviewCard({ problem, progress, onOpen }: DailyReviewCardProps) {
  if (!problem) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-2 text-rose-100">
          <MessageSquareCode className="h-4 w-4" />
          今日のレビュー1問
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">短いレビュー問題がまだ登録されていません。</p>
      </div>
    );
  }

  return (
    <button
      onClick={() => onOpen(problem.id)}
      className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-left transition hover:border-rose-300/40 hover:bg-white/10"
    >
      <div className="flex items-center gap-2 text-sm text-rose-100">
        <MessageSquareCode className="h-4 w-4" />
        今日のレビュー1問
      </div>
      <h2 className="mt-3 text-xl font-semibold text-white">{problem.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{problem.prompt}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300/80">
        <span className="rounded-full border border-white/10 px-3 py-1">{problem.category}</span>
        <span className="rounded-full border border-white/10 px-3 py-1">{problem.estimatedMinutes}分目安</span>
        <span className="rounded-full border border-white/10 px-3 py-1">
          {progress?.lastVerdict ? `前回: ${progress.lastVerdict}` : '未挑戦'}
        </span>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-rose-100">
        問題を開く
        <ChevronRight className="h-4 w-4" />
      </div>
    </button>
  );
}
