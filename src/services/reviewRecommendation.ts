import type { ReviewProblem, ReviewProgressMap } from '../types/review';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const getDayIndex = (today: Date) => Math.floor(today.getTime() / DAY_IN_MS);

const getProgressScore = (problemId: string, progressMap: ReviewProgressMap) => {
  const progress = progressMap[problemId];
  if (!progress) {
    return 0;
  }

  return progress.reviewPriority + progress.retryCount + (progress.lastVerdict === 'correct' ? 0 : 2);
};

export function getTodayReviewProblem(
  reviewProblems: ReviewProblem[],
  progressMap: ReviewProgressMap,
  today: Date,
): ReviewProblem | undefined {
  const eligible = reviewProblems.filter((problem) => problem.dailyEligible && problem.estimatedMinutes <= 5);
  if (eligible.length === 0) {
    return reviewProblems[0];
  }

  const newCandidates = eligible.filter((problem) => !progressMap[problem.id] || progressMap[problem.id].attempts === 0);
  const reviewCandidates = eligible.filter((problem) => {
    const progress = progressMap[problem.id];
    if (!progress || progress.attempts === 0) {
      return false;
    }

    if (progress.lastVerdict !== 'correct') {
      return true;
    }

    if (!progress.lastAnsweredAt) {
      return true;
    }

    return today.getTime() - new Date(progress.lastAnsweredAt).getTime() >= DAY_IN_MS;
  });

  const preferReview = getDayIndex(today) % 2 === 1;
  const primaryPool = preferReview ? reviewCandidates : newCandidates;
  const secondaryPool = preferReview ? newCandidates : reviewCandidates;
  const activePool = primaryPool.length > 0 ? primaryPool : secondaryPool.length > 0 ? secondaryPool : eligible;

  return [...activePool].sort((left, right) => {
    const scoreDiff = getProgressScore(right.id, progressMap) - getProgressScore(left.id, progressMap);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    if (left.estimatedMinutes !== right.estimatedMinutes) {
      return left.estimatedMinutes - right.estimatedMinutes;
    }

    return left.id.localeCompare(right.id);
  })[0];
}
