import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Flame,
  Home,
  Loader2,
  Medal,
  MessageSquareCode,
  Play,
  RefreshCcw,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
  XCircle,
} from 'lucide-react';
import { AiSettingsPanel } from './components/AiSettingsPanel';
import { CodeEditor } from './components/CodeEditor';
import { DailyReviewCard } from './components/DailyReviewCard';
import { ReviewProblemWorkspace } from './components/ReviewProblemWorkspace';
import reviewProblemData from './data/review-problems.json';
import { problems, type LearningProblem } from './data/problems';
import { compileCode } from './services/compiler';
import { checkAiConnection, evaluateReviewAnswer } from './services/localAi';
import { getTodayReviewProblem } from './services/reviewRecommendation';
import type { AiSettings, ReviewEvaluationResult, ReviewProblem, ReviewProgress, ReviewProgressMap } from './types/review';

type ViewMode = 'home' | 'practice' | 'review' | 'code-review';
type FeedbackStatus = 'idle' | 'passed' | 'failed' | 'error';
type ConnectionTone = 'idle' | 'success' | 'error';

interface RunFeedback {
  status: FeedbackStatus;
  headline: string;
  body: string;
  nextStep?: string;
  rawMessage?: string;
  badges?: string[];
}

interface ProblemProgress {
  runCount: number;
  solvedCount: number;
  failedCount: number;
  attemptsSinceSolved: number;
  lastSolveAttempts: number | null;
  solveAttemptHistory: number[];
  lastPlayedAt: string | null;
  lastSolvedAt: string | null;
  scheduledReviewAt: string | null;
  hintLevelUsed: number;
  skipWithLearningCount: number;
  bestAttempts: number | null;
}

interface LearningProfile {
  streakDays: number;
  lastActiveDate: string | null;
  progressMoments: string[];
  earnedBadges: string[];
  recentWins: Array<{
    problemId: string;
    at: string;
    message: string;
  }>;
}

type ProblemProgressMap = Record<string, ProblemProgress>;
type PracticeNotesMap = Record<string, string>;

const reviewProblems = reviewProblemData as ReviewProblem[];

const PROGRESS_STORAGE_KEY = 'cpp-learning-progress-v2';
const PROFILE_STORAGE_KEY = 'cpp-learning-profile-v2';
const NOTES_STORAGE_KEY = 'cpp-learning-notes-v2';
const CURRENT_PROBLEM_STORAGE_KEY = 'cpp-current-problem-id-v2';
const REVIEW_PROGRESS_STORAGE_KEY = 'cpp-review-progress-v1';
const REVIEW_SETTINGS_STORAGE_KEY = 'cpp-review-ai-settings-v1';
const CURRENT_REVIEW_PROBLEM_STORAGE_KEY = 'cpp-current-review-problem-id-v1';

const defaultAiSettings: AiSettings = {
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'llama3.1',
  apiKey: '',
};

const badgeLabels: Record<string, string> = {
  first_solve: 'はじめての正解',
  comeback: '再挑戦クリア',
  no_hint: 'ノーヒント達成',
  streak_3: '3日継続',
  steady_reviewer: '復習できた',
};

const createEmptyProblemProgress = (): ProblemProgress => ({
  runCount: 0,
  solvedCount: 0,
  failedCount: 0,
  attemptsSinceSolved: 0,
  lastSolveAttempts: null,
  solveAttemptHistory: [],
  lastPlayedAt: null,
  lastSolvedAt: null,
  scheduledReviewAt: null,
  hintLevelUsed: 0,
  skipWithLearningCount: 0,
  bestAttempts: null,
});

const createEmptyProfile = (): LearningProfile => ({
  streakDays: 0,
  lastActiveDate: null,
  progressMoments: [],
  earnedBadges: [],
  recentWins: [],
});

const createEmptyReviewProgress = (): ReviewProgress => ({
  lastAnswer: '',
  lastVerdict: null,
  lastScore: null,
  lastAnsweredAt: null,
  firstCorrectAt: null,
  retryCount: 0,
  reviewPriority: 0,
  manualFallbackUsed: false,
  attempts: 0,
});

const readStoredProgress = (): ProblemProgressMap => {
  const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as ProblemProgressMap;
    return Object.fromEntries(
      Object.entries(parsed).map(([problemId, progress]) => [
        problemId,
        {
          ...createEmptyProblemProgress(),
          ...progress,
          solveAttemptHistory: Array.isArray(progress.solveAttemptHistory) ? progress.solveAttemptHistory : [],
        },
      ]),
    );
  } catch {
    return {};
  }
};

const readStoredProfile = (): LearningProfile => {
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    return createEmptyProfile();
  }

  try {
    const parsed = JSON.parse(raw) as LearningProfile;
    return {
      ...createEmptyProfile(),
      ...parsed,
      progressMoments: Array.isArray(parsed.progressMoments) ? parsed.progressMoments : [],
      earnedBadges: Array.isArray(parsed.earnedBadges) ? parsed.earnedBadges : [],
      recentWins: Array.isArray(parsed.recentWins) ? parsed.recentWins : [],
    };
  } catch {
    return createEmptyProfile();
  }
};

const readStoredNotes = (): PracticeNotesMap => {
  const raw = localStorage.getItem(NOTES_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as PracticeNotesMap;
  } catch {
    return {};
  }
};

const readStoredReviewProgress = (): ReviewProgressMap => {
  const raw = localStorage.getItem(REVIEW_PROGRESS_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as ReviewProgressMap;
    return Object.fromEntries(
      Object.entries(parsed).map(([problemId, progress]) => [
        problemId,
        {
          ...createEmptyReviewProgress(),
          ...progress,
        },
      ]),
    );
  } catch {
    return {};
  }
};

const readStoredAiSettings = (): AiSettings => {
  const raw = localStorage.getItem(REVIEW_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return defaultAiSettings;
  }

  try {
    return {
      ...defaultAiSettings,
      ...(JSON.parse(raw) as Partial<AiSettings>),
    };
  } catch {
    return defaultAiSettings;
  }
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const formatDayLabel = (value: string | null) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(value));
};

const getDayKey = (date: Date) => date.toLocaleDateString('en-CA');

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getProgress = (progressMap: ProblemProgressMap, problemId: string) => progressMap[problemId] || createEmptyProblemProgress();

const getReviewProgress = (progressMap: ReviewProgressMap, problemId: string) => progressMap[problemId] || createEmptyReviewProgress();

const getVisibleHintCount = (progress: ProblemProgress, problem: LearningProblem) => {
  const autoCount =
    progress.attemptsSinceSolved >= 4 ? Math.min(problem.hintSteps.length, 3) : progress.attemptsSinceSolved >= 3 ? Math.min(problem.hintSteps.length, 2) : progress.attemptsSinceSolved >= 2 ? 1 : 0;
  return Math.max(progress.hintLevelUsed, autoCount);
};

const summarizeCompilerError = (raw: string) => {
  const importantLine =
    raw
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.includes('error:') || line.includes('undefined reference') || line.includes('expected')) ||
    raw.split('\n').map((line) => line.trim()).find(Boolean) ||
    raw;

  return {
    headline: 'コンパイラが止まった場所が見つかりました',
    body: `まず直すのは1か所で大丈夫です。気になる最初のエラーは「${importantLine}」です。`,
    nextStep: 'エラーが出ている行の直前にある括弧・セミコロン・型名を順番に確認してみましょう。',
  };
};

const getFailureFeedback = (problem: LearningProblem, progress: ProblemProgress, message: string): RunFeedback => {
  const hintCount = getVisibleHintCount(progress, problem);
  const nextHint = hintCount > 0 ? problem.hintSteps[hintCount - 1] : '';
  const practiceMode = progress.attemptsSinceSolved >= 4 ? (problem.starterCode ? '穴埋めモード' : 'ガイドモード') : '通常モード';

  return {
    status: 'failed',
    headline: progress.attemptsSinceSolved === 1 ? 'あと1歩です' : '方向はつかめています',
    body: message,
    nextStep:
      progress.attemptsSinceSolved >= 4
        ? `${practiceMode}に切り替えました。${problem.starterCode ? '下の補助コードを使って進めてみましょう。' : nextHint || '下のステップだけに絞って進めましょう。'}`
        : nextHint || '次は TODO に関係する1か所だけ直して、もう一度試してみましょう。',
  };
};

const chooseBadges = (
  current: ProblemProgress,
  profile: LearningProfile,
  streakDays: number,
  usedHints: number,
): string[] => {
  const earned = new Set<string>();
  const already = new Set(profile.earnedBadges);

  if (current.solvedCount === 0 && !already.has('first_solve')) {
    earned.add('first_solve');
  }
  if ((current.failedCount > 0 || current.skipWithLearningCount > 0) && !already.has('comeback')) {
    earned.add('comeback');
  }
  if (usedHints === 0 && !already.has('no_hint')) {
    earned.add('no_hint');
  }
  if (streakDays >= 3 && !already.has('streak_3')) {
    earned.add('streak_3');
  }
  if (current.scheduledReviewAt && current.solvedCount > 0 && !already.has('steady_reviewer')) {
    earned.add('steady_reviewer');
  }

  return Array.from(earned);
};

function App() {
  const initialProblemId = localStorage.getItem(CURRENT_PROBLEM_STORAGE_KEY) || problems[0]?.id || '';
  const initialReviewProblemId = localStorage.getItem(CURRENT_REVIEW_PROBLEM_STORAGE_KEY) || reviewProblems[0]?.id || '';

  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [currentProblemId, setCurrentProblemId] = useState(initialProblemId);
  const [currentReviewProblemId, setCurrentReviewProblemId] = useState(initialReviewProblemId);
  const [progressMap, setProgressMap] = useState<ProblemProgressMap>(() => readStoredProgress());
  const [profile, setProfile] = useState<LearningProfile>(() => readStoredProfile());
  const [practiceNotes, setPracticeNotes] = useState<PracticeNotesMap>(() => readStoredNotes());
  const [reviewProgressMap, setReviewProgressMap] = useState<ReviewProgressMap>(() => readStoredReviewProgress());
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => readStoredAiSettings());
  const [code, setCode] = useState('');
  const [reviewAnswer, setReviewAnswer] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isEvaluatingReview, setIsEvaluatingReview] = useState(false);
  const [feedback, setFeedback] = useState<RunFeedback>({
    status: 'idle',
    headline: '今日の1問を始めましょう',
    body: '小さく直して、すぐ試す流れで十分です。',
  });
  const [showSolution, setShowSolution] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewEvaluationResult | null>(null);
  const [reviewFallbackMessage, setReviewFallbackMessage] = useState<string | null>(null);
  const [aiConnectionMessage, setAiConnectionMessage] = useState('Ollama または OpenAI互換API に接続して、レビュー回答を採点できます。');
  const [aiConnectionTone, setAiConnectionTone] = useState<ConnectionTone>('idle');
  const reviewProgressRef = useRef(reviewProgressMap);

  const problem = problems.find((item) => item.id === currentProblemId) || problems[0];
  const currentReviewProblem = reviewProblems.find((item) => item.id === currentReviewProblemId) || reviewProblems[0];

  useEffect(() => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
  }, [progressMap]);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(practiceNotes));
  }, [practiceNotes]);

  useEffect(() => {
    localStorage.setItem(REVIEW_PROGRESS_STORAGE_KEY, JSON.stringify(reviewProgressMap));
  }, [reviewProgressMap]);

  useEffect(() => {
    reviewProgressRef.current = reviewProgressMap;
  }, [reviewProgressMap]);

  useEffect(() => {
    localStorage.setItem(REVIEW_SETTINGS_STORAGE_KEY, JSON.stringify(aiSettings));
  }, [aiSettings]);

  useEffect(() => {
    if (!problem) {
      return;
    }

    localStorage.setItem(CURRENT_PROBLEM_STORAGE_KEY, problem.id);
    const savedCode = localStorage.getItem(`problem-${problem.id}-code`);
    setCode(savedCode || problem.initialCode);
    setShowSolution(false);
    setFeedback({
      status: 'idle',
      headline: '今日の1問を始めましょう',
      body: `${problem.estimatedMinutes}分くらいで進められる想定です。全部ではなく、次の1手だけに集中すれば大丈夫です。`,
    });
  }, [problem]);

  useEffect(() => {
    if (!problem) {
      return;
    }

    localStorage.setItem(`problem-${problem.id}-code`, code);
  }, [code, problem]);

  useEffect(() => {
    const targetReviewProblem = reviewProblems.find((item) => item.id === currentReviewProblemId);
    if (!targetReviewProblem) {
      return;
    }

    localStorage.setItem(CURRENT_REVIEW_PROBLEM_STORAGE_KEY, targetReviewProblem.id);
    const currentReviewProgress = getReviewProgress(reviewProgressRef.current, targetReviewProblem.id);
    setReviewAnswer(currentReviewProgress.lastAnswer);
    setReviewResult(null);
    setReviewFallbackMessage(null);
  }, [currentReviewProblemId]);

  const problemSummaries = useMemo(() => {
    return problems.map((item) => {
      const progress = getProgress(progressMap, item.id);
      const averageAttempts =
        progress.solveAttemptHistory.length > 0
          ? progress.solveAttemptHistory.reduce((sum, value) => sum + value, 0) / progress.solveAttemptHistory.length
          : null;
      const dueForReview = progress.scheduledReviewAt ? new Date(progress.scheduledReviewAt).getTime() <= Date.now() : false;
      const weaknessScore = progress.failedCount * 1.4 + progress.skipWithLearningCount * 2 + (averageAttempts || 0) - progress.solvedCount * 0.5;

      return {
        problem: item,
        progress,
        averageAttempts,
        dueForReview,
        weaknessScore,
        isUntouched: progress.runCount === 0 && progress.solvedCount === 0,
        isInProgress: progress.runCount > 0 && progress.solvedCount === 0,
      };
    });
  }, [progressMap]);

  const dueReviews = useMemo(
    () =>
      problemSummaries
        .filter((item) => item.dueForReview)
        .sort((a, b) => new Date(a.progress.scheduledReviewAt || 0).getTime() - new Date(b.progress.scheduledReviewAt || 0).getTime()),
    [problemSummaries],
  );

  const continueProblem = useMemo(
    () =>
      [...problemSummaries]
        .filter((item) => item.isInProgress)
        .sort((a, b) => new Date(b.progress.lastPlayedAt || 0).getTime() - new Date(a.progress.lastPlayedAt || 0).getTime())[0],
    [problemSummaries],
  );

  const gentleProblem = useMemo(
    () =>
      [...problemSummaries]
        .filter((item) => item.problem.difficulty === 1 && item.progress.solvedCount === 0)
        .sort((a, b) => a.progress.runCount - b.progress.runCount || a.problem.estimatedMinutes - b.problem.estimatedMinutes)[0],
    [problemSummaries],
  );

  const recommendedProblem = continueProblem || gentleProblem || problemSummaries[0];

  const comebackProblem = useMemo(
    () =>
      [...problemSummaries]
        .filter((item) => item.progress.failedCount > 0 || item.progress.skipWithLearningCount > 0)
        .sort((a, b) => b.weaknessScore - a.weaknessScore)[0],
    [problemSummaries],
  );

  const reviewSummaries = useMemo(() => {
    return reviewProblems.map((item) => {
      const progress = getReviewProgress(reviewProgressMap, item.id);
      return {
        problem: item,
        progress,
        isUntouched: progress.attempts === 0,
        isReadyForRetry:
          progress.attempts > 0 &&
          (progress.lastVerdict !== 'correct' ||
            !progress.lastAnsweredAt ||
            Date.now() - new Date(progress.lastAnsweredAt).getTime() >= 24 * 60 * 60 * 1000),
      };
    });
  }, [reviewProgressMap]);

  const todayReviewProblem = useMemo(
    () => getTodayReviewProblem(reviewProblems, reviewProgressMap, new Date()),
    [reviewProgressMap],
  );

  const solvedProblemsCount = problemSummaries.filter((item) => item.progress.solvedCount > 0).length;
  const weeklyForwardSteps = profile.progressMoments.filter((value) => Date.now() - new Date(value).getTime() <= 7 * 24 * 60 * 60 * 1000).length;
  const visibleHints = problem ? problem.hintSteps.slice(0, getVisibleHintCount(getProgress(progressMap, problem.id), problem)) : [];
  const currentProgress = problem ? getProgress(progressMap, problem.id) : createEmptyProblemProgress();
  const currentReviewProgress = currentReviewProblem ? getReviewProgress(reviewProgressMap, currentReviewProblem.id) : undefined;
  const showManualFallback = Boolean(reviewFallbackMessage);
  const practiceAssistMode = currentProgress.attemptsSinceSolved >= 4 ? (problem.starterCode ? 'fill-in-the-blank' : 'guided') : 'normal';

  const openProblem = (problemId: string, nextView: ViewMode = 'practice', overrideCode?: string) => {
    const targetProblem = problems.find((item) => item.id === problemId);
    if (!targetProblem) {
      return;
    }

    setCurrentProblemId(problemId);
    setViewMode(nextView);

    const savedCode = localStorage.getItem(`problem-${targetProblem.id}-code`);
    const nextCode = overrideCode || savedCode || targetProblem.initialCode;
    setCode(nextCode);

    if (overrideCode) {
      localStorage.setItem(`problem-${targetProblem.id}-code`, overrideCode);
    }
  };

  const openReviewProblem = (problemId: string) => {
    const targetProblem = reviewProblems.find((item) => item.id === problemId);
    if (!targetProblem) {
      return;
    }

    setCurrentReviewProblemId(problemId);
    setViewMode('code-review');
  };

  const recordActivity = () => {
    const now = new Date();
    const todayKey = getDayKey(now);

    let nextStreak = profile.streakDays;
    if (profile.lastActiveDate !== todayKey) {
      if (!profile.lastActiveDate) {
        nextStreak = 1;
      } else {
        const previousDay = addDays(now, -1);
        nextStreak = profile.lastActiveDate === getDayKey(previousDay) ? profile.streakDays + 1 : 1;
      }
    }

    setProfile((current) => ({
      ...current,
      streakDays: current.lastActiveDate === todayKey ? current.streakDays : nextStreak,
      lastActiveDate: todayKey,
    }));

    return nextStreak;
  };

  const appendProgressMoment = (message: string) => {
    const timestamp = new Date().toISOString();
    setProfile((current) => ({
      ...current,
      progressMoments: [...current.progressMoments, timestamp].slice(-50),
      recentWins: [...current.recentWins, { problemId: problem.id, at: timestamp, message }].slice(-8),
    }));
  };

  const grantBadges = (badgeIds: string[]) => {
    if (badgeIds.length === 0) {
      return [];
    }

    const labels = badgeIds.map((id) => badgeLabels[id]).filter(Boolean);
    setProfile((current) => ({
      ...current,
      earnedBadges: Array.from(new Set([...current.earnedBadges, ...badgeIds])),
    }));
    return labels;
  };

  const updateProblemProgress = (problemId: string, updater: (current: ProblemProgress) => ProblemProgress) => {
    setProgressMap((current) => {
      const base = current[problemId] || createEmptyProblemProgress();
      return {
        ...current,
        [problemId]: updater(base),
      };
    });
  };

  const updateReviewProgress = (problemId: string, updater: (current: ReviewProgress) => ReviewProgress) => {
    setReviewProgressMap((current) => {
      const base = current[problemId] || createEmptyReviewProgress();
      return {
        ...current,
        [problemId]: updater(base),
      };
    });
  };

  const handleRunCode = async () => {
    if (!problem) {
      return;
    }

    const streakAfterActivity = recordActivity();
    setIsCompiling(true);

    if (problem.clientValidation) {
      const clientError = problem.clientValidation(code);
      if (clientError) {
        const nextProgress = {
          ...currentProgress,
          runCount: currentProgress.runCount + 1,
          failedCount: currentProgress.failedCount + 1,
          attemptsSinceSolved: currentProgress.attemptsSinceSolved + 1,
          lastPlayedAt: new Date().toISOString(),
        };

        updateProblemProgress(problem.id, () => nextProgress);
        setFeedback(getFailureFeedback(problem, nextProgress, clientError));
        setIsCompiling(false);
        return;
      }
    }

    const preCode = '#define main user_main\n';
    const postCode = '\n#undef main\n' + problem.testCode;
    const combinedCode = preCode + code + postCode;

    try {
      const response = await compileCode({ code: combinedCode });

      if (response.compiler_error) {
        const nextProgress = {
          ...currentProgress,
          runCount: currentProgress.runCount + 1,
          failedCount: currentProgress.failedCount + 1,
          attemptsSinceSolved: currentProgress.attemptsSinceSolved + 1,
          lastPlayedAt: new Date().toISOString(),
        };

        updateProblemProgress(problem.id, () => nextProgress);
        const summary = summarizeCompilerError(response.compiler_error);
        setFeedback({
          status: 'error',
          headline: summary.headline,
          body: summary.body,
          nextStep: summary.nextStep,
          rawMessage: response.compiler_error,
        });
        return;
      }

      const output = response.program_message || '';

      if (output.includes('TEST_PASSED')) {
        const attemptsNeeded = currentProgress.attemptsSinceSolved + 1;
        const now = new Date();
        const scheduledReviewAt = addDays(now, problem.reviewAfterDays).toISOString();
        const nextProgress: ProblemProgress = {
          ...currentProgress,
          runCount: currentProgress.runCount + 1,
          solvedCount: currentProgress.solvedCount + 1,
          attemptsSinceSolved: 0,
          lastSolveAttempts: attemptsNeeded,
          solveAttemptHistory: [...currentProgress.solveAttemptHistory, attemptsNeeded],
          lastPlayedAt: now.toISOString(),
          lastSolvedAt: now.toISOString(),
          scheduledReviewAt,
          bestAttempts:
            currentProgress.bestAttempts === null ? attemptsNeeded : Math.min(currentProgress.bestAttempts, attemptsNeeded),
        };

        updateProblemProgress(problem.id, () => nextProgress);
        appendProgressMoment(problem.successMessage);
        const badgeIds = chooseBadges(currentProgress, profile, streakAfterActivity, currentProgress.hintLevelUsed);
        const earnedBadges = grantBadges(badgeIds);
        setFeedback({
          status: 'passed',
          headline: 'できました。ちゃんと前進しています',
          body: problem.successMessage,
          nextStep: `次の復習予定は ${formatDayLabel(scheduledReviewAt)} です。忘れる前にもう一度触れるようにしておきます。`,
          badges: earnedBadges,
        });
        return;
      }

      const failureMessage = output.match(/TEST_FAILED:(.*)/)?.[1]?.trim() || '要件にまだ少しだけ届いていません。';
      const nextProgress = {
        ...currentProgress,
        runCount: currentProgress.runCount + 1,
        failedCount: currentProgress.failedCount + 1,
        attemptsSinceSolved: currentProgress.attemptsSinceSolved + 1,
        lastPlayedAt: new Date().toISOString(),
      };

      updateProblemProgress(problem.id, () => nextProgress);
      setFeedback(getFailureFeedback(problem, nextProgress, failureMessage));
    } catch (error: unknown) {
      const nextProgress = {
        ...currentProgress,
        runCount: currentProgress.runCount + 1,
        failedCount: currentProgress.failedCount + 1,
        attemptsSinceSolved: currentProgress.attemptsSinceSolved + 1,
        lastPlayedAt: new Date().toISOString(),
      };

      updateProblemProgress(problem.id, () => nextProgress);
      const message = error instanceof Error ? error.message : 'コンパイル中にネットワークエラーが発生しました。';
      setFeedback({
        status: 'error',
        headline: '接続でつまずきました',
        body: 'コードの内容より先に通信が止まった可能性があります。',
        nextStep: '少し時間をおいてからもう一度試してみましょう。',
        rawMessage: message,
      });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleUseStarterCode = () => {
    if (!problem?.starterCode) {
      return;
    }

    setCode(problem.starterCode);
    localStorage.setItem(`problem-${problem.id}-code`, problem.starterCode);
    setFeedback({
      status: 'idle',
      headline: '穴埋めしやすい形に整えました',
      body: '全部を一度に解こうとせず、TODO の場所だけを埋めていきましょう。',
    });
  };

  const handleSkipWithLearning = () => {
    if (!problem) {
      return;
    }

    const nextReviewAt = addDays(new Date(), 1).toISOString();
    const nextProgress: ProblemProgress = {
      ...currentProgress,
      skipWithLearningCount: currentProgress.skipWithLearningCount + 1,
      attemptsSinceSolved: 0,
      scheduledReviewAt: nextReviewAt,
      lastPlayedAt: new Date().toISOString(),
    };

    updateProblemProgress(problem.id, () => nextProgress);
    setShowSolution(true);
    setFeedback({
      status: 'failed',
      headline: '今日はここで区切って大丈夫です',
      body: '解答を見て終わるのではなく、どこがポイントかだけ拾って明日に残します。',
      nextStep: `復習は ${formatDayLabel(nextReviewAt)} に再提案します。今は下の学びメモに1行だけ残しておくのがおすすめです。`,
    });
  };

  const handleReset = () => {
    if (!problem) {
      return;
    }

    setCode(problem.initialCode);
    localStorage.removeItem(`problem-${problem.id}-code`);
    setFeedback({
      status: 'idle',
      headline: '最初の状態に戻しました',
      body: 'やり直すときは、前回どこまで分かったかだけを意識すると進みやすいです。',
    });
  };

  const handleCheckAiConnection = async () => {
    const result = await checkAiConnection(aiSettings);
    setAiConnectionMessage(result.message);
    setAiConnectionTone(result.ok ? 'success' : 'error');
  };

  const handleEvaluateReview = async () => {
    if (!currentReviewProblem || reviewAnswer.trim().length === 0) {
      return;
    }

    setIsEvaluatingReview(true);
    setReviewFallbackMessage(null);

    try {
      const result = await evaluateReviewAnswer(
        {
          problemId: currentReviewProblem.id,
          prompt: currentReviewProblem.prompt,
          reviewCode: currentReviewProblem.reviewCode,
          userAnswer: reviewAnswer,
          rubric: currentReviewProblem.aiRubric,
        },
        aiSettings,
      );

      setReviewResult(result);
      setAiConnectionMessage('AIで採点できました。回答の抜け漏れも確認できます。');
      setAiConnectionTone('success');
      updateReviewProgress(currentReviewProblem.id, (current) => ({
        ...current,
        lastAnswer: reviewAnswer,
        lastVerdict: result.verdict,
        lastScore: result.score,
        lastAnsweredAt: new Date().toISOString(),
        firstCorrectAt: result.verdict === 'correct' && !current.firstCorrectAt ? new Date().toISOString() : current.firstCorrectAt,
        retryCount: current.lastVerdict && current.lastVerdict !== 'correct' ? current.retryCount + 1 : current.retryCount,
        reviewPriority: result.verdict === 'correct' ? Math.max(0, current.reviewPriority - 1) : current.reviewPriority + 2,
        manualFallbackUsed: false,
        attempts: current.attempts + 1,
      }));
      recordActivity();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ローカルAIへの接続に失敗しました。';
      setReviewResult(null);
      setReviewFallbackMessage(message);
      setAiConnectionMessage('AI採点に失敗したため、手動確認モードを表示しています。');
      setAiConnectionTone('error');
      updateReviewProgress(currentReviewProblem.id, (current) => ({
        ...current,
        lastAnswer: reviewAnswer,
        lastAnsweredAt: new Date().toISOString(),
        retryCount: current.retryCount + 1,
        reviewPriority: current.reviewPriority + 1,
        manualFallbackUsed: true,
        attempts: current.attempts + 1,
      }));
      recordActivity();
    } finally {
      setIsEvaluatingReview(false);
    }
  };

  const handleResetReviewAnswer = () => {
    if (!currentReviewProblem) {
      return;
    }

    setReviewAnswer('');
    setReviewResult(null);
    setReviewFallbackMessage(null);
    updateReviewProgress(currentReviewProblem.id, (current) => ({
      ...current,
      lastAnswer: '',
      manualFallbackUsed: false,
    }));
  };

  if (!problem || !currentReviewProblem) {
    return null;
  }

  const heroStats = [
    { label: '連続学習', value: `${profile.streakDays}日`, icon: Flame, tone: 'text-orange-300' },
    { label: '今週の前進', value: `${weeklyForwardSteps}回`, icon: TrendingUp, tone: 'text-emerald-300' },
    { label: '解けた問題', value: `${solvedProblemsCount}問`, icon: Medal, tone: 'text-sky-300' },
  ];

  const feedbackTone =
    feedback.status === 'passed'
      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
      : feedback.status === 'error'
        ? 'border-rose-400/30 bg-rose-500/10 text-rose-100'
        : feedback.status === 'failed'
          ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
          : 'border-white/10 bg-white/5 text-slate-100';

  const HomeView = (
    <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_28%),linear-gradient(135deg,_rgba(14,23,38,0.95),_rgba(19,41,61,0.92))] p-6 shadow-2xl shadow-slate-950/30">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,_rgba(125,211,252,0.16),_transparent_60%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-amber-200/80">Daily Momentum</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                実装問題とレビュー短問を、毎日少しずつ回せる学習フローです。
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/80 sm:text-base">
                今日は「続きの1問」「日次レビュー1問」「復習1問」をここから始められます。コードを書く日と、読む日を自然に混ぜられるようにしました。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => recommendedProblem && openProblem(recommendedProblem.problem.id)}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                >
                  今日の実装問題
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => todayReviewProblem && openReviewProblem(todayReviewProblem.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  今日のレビュー1問
                  <MessageSquareCode className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {heroStats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-slate-200/75">
                    <item.icon className={`h-5 w-5 ${item.tone}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          <button
            onClick={() => recommendedProblem && openProblem(recommendedProblem.problem.id)}
            className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-left transition hover:border-amber-300/40 hover:bg-white/10"
          >
            <div className="flex items-center gap-2 text-sm text-amber-200">
              <Target className="h-4 w-4" />
              今日のミッション
            </div>
            <h2 className="mt-3 text-xl font-semibold text-white">{recommendedProblem?.problem.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {continueProblem ? '前回の続きから再開すると、最短で手応えが出やすいです。' : '最初の1問として軽く始められる問題です。'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300/80">
              <span className="rounded-full border border-white/10 px-3 py-1">{recommendedProblem?.problem.category}</span>
              <span className="rounded-full border border-white/10 px-3 py-1">{recommendedProblem?.problem.estimatedMinutes}分目安</span>
            </div>
          </button>

          <DailyReviewCard
            problem={todayReviewProblem}
            progress={todayReviewProblem ? getReviewProgress(reviewProgressMap, todayReviewProblem.id) : undefined}
            onOpen={openReviewProblem}
          />

          <button
            onClick={() => (dueReviews[0] ? openProblem(dueReviews[0].problem.id, 'review') : setViewMode('review'))}
            className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-left transition hover:border-sky-300/40 hover:bg-white/10"
          >
            <div className="flex items-center gap-2 text-sm text-sky-200">
              <CalendarClock className="h-4 w-4" />
              復習ミッション
            </div>
            <h2 className="mt-3 text-xl font-semibold text-white">
              {dueReviews[0] ? dueReviews[0].problem.title : 'まだ復習予定はありません'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {dueReviews[0]
                ? '前回の正解から少し時間を空けたので、今やり直すと定着しやすいタイミングです。'
                : '今日の学習を終えると、ここに次回の復習候補が並ぶようになります。'}
            </p>
            <div className="mt-4 text-xs text-slate-300/80">
              {dueReviews[0] ? `提案日: ${formatDayLabel(dueReviews[0].progress.scheduledReviewAt)}` : '次の復習提案を準備中'}
            </div>
          </button>

          <button
            onClick={() => (gentleProblem ? openProblem(gentleProblem.problem.id) : comebackProblem && openProblem(comebackProblem.problem.id))}
            className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-left transition hover:border-emerald-300/40 hover:bg-white/10"
          >
            <div className="flex items-center gap-2 text-sm text-emerald-200">
              <Sparkles className="h-4 w-4" />
              気軽な1問
            </div>
            <h2 className="mt-3 text-xl font-semibold text-white">
              {gentleProblem?.problem.title || comebackProblem?.problem.title || '最初の1問から始めましょう'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {gentleProblem
                ? '短時間で終わりやすい問題を先に置いています。習慣化の入口に向いています。'
                : '少し苦手だった問題も、日を空けると意外と進むことがあります。'}
            </p>
            <div className="mt-4 text-xs text-slate-300/80">
              {gentleProblem ? `難易度 ${gentleProblem.problem.difficulty} / ${gentleProblem.problem.estimatedMinutes}分` : '再挑戦向け'}
            </div>
          </button>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/50 p-5">
            <div className="flex items-center gap-2 text-white">
              <Wand2 className="h-5 w-5 text-amber-200" />
              <h2 className="text-lg font-semibold">最近できるようになったこと</h2>
            </div>
            <div className="mt-4 space-y-3">
              {profile.recentWins.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm leading-6 text-slate-300">
                  まだ最初の成功ログがありません。1問クリアすると、ここに「できるようになったこと」が残ります。
                </div>
              )}
              {[...profile.recentWins].reverse().map((item) => {
                const target = problems.find((entry) => entry.id === item.problemId);
                if (!target) {
                  return null;
                }

                return (
                  <button
                    key={`${item.problemId}-${item.at}`}
                    onClick={() => openProblem(item.problemId)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
                  >
                    <p className="text-sm text-emerald-200">{formatDateTime(item.at)}</p>
                    <p className="mt-1 font-medium text-white">{target.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.message}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-950/50 p-5">
            <div className="flex items-center gap-2 text-white">
              <Medal className="h-5 w-5 text-sky-200" />
              <h2 className="text-lg font-semibold">レビュー短問ライブラリ</h2>
            </div>
            <div className="mt-4 space-y-2">
              {reviewSummaries.slice(0, 5).map((item) => (
                <button
                  key={item.problem.id}
                  onClick={() => openReviewProblem(item.problem.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                >
                  <div>
                    <p className="font-medium text-white">{item.problem.title}</p>
                    <p className="mt-1 text-xs text-slate-300">
                      {item.problem.estimatedMinutes}分 / {item.progress.lastVerdict || '未挑戦'}
                    </p>
                  </div>
                  <span className="text-xs text-slate-300">
                    {item.isReadyForRetry ? '復習向き' : item.isUntouched ? '新規' : '学習済み'}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setViewMode('code-review')}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              専用タブで見る
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );

  const ReviewView = (
    <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,_rgba(12,18,30,0.94),_rgba(17,60,74,0.88))] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-sky-200/80">Review Loop</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">忘れる前に、軽くもう一度。</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200/80">
            一度できた問題を少し時間を空けてやり直すと、理解が「知っている」から「使える」に近づきます。重くしすぎず、短い再挑戦だけを並べています。
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/50 p-5">
            <div className="flex items-center gap-2 text-white">
              <CalendarClock className="h-5 w-5 text-sky-200" />
              <h2 className="text-lg font-semibold">今日やる復習</h2>
            </div>
            <div className="mt-4 space-y-3">
              {dueReviews.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm leading-6 text-slate-300">
                  まだ期限が来た復習はありません。今日新しく解いた問題は、次回ここに並びます。
                </div>
              )}
              {dueReviews.map((item) => (
                <button
                  key={item.problem.id}
                  onClick={() => openProblem(item.problem.id, 'practice')}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{item.problem.title}</p>
                      <p className="mt-1 text-sm text-slate-300">{item.problem.successMessage}</p>
                    </div>
                    <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs text-sky-100">
                      {formatDayLabel(item.progress.scheduledReviewAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-950/50 p-5">
            <div className="flex items-center gap-2 text-white">
              <BookOpen className="h-5 w-5 text-amber-200" />
              <h2 className="text-lg font-semibold">次に定着させたい問題</h2>
            </div>
            <div className="mt-4 space-y-3">
              {problemSummaries
                .filter((item) => item.progress.solvedCount > 0)
                .sort((a, b) => new Date(a.progress.lastSolvedAt || 0).getTime() - new Date(b.progress.lastSolvedAt || 0).getTime())
                .slice(0, 6)
                .map((item) => (
                  <button
                    key={item.problem.id}
                    onClick={() => openProblem(item.problem.id, 'practice')}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                  >
                    <div>
                      <p className="font-medium text-white">{item.problem.title}</p>
                      <p className="mt-1 text-xs text-slate-300">
                        前回正解: {formatDateTime(item.progress.lastSolvedAt)} / ベスト {item.progress.bestAttempts ?? '-'}回
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );

  const PracticeView = (
    <main className="flex-1 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid h-full w-full max-w-[1600px] gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/60">
          <div className="overflow-y-auto p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-amber-200/80">{problem.category}</p>
                <h1 className="mt-2 text-2xl font-semibold text-white">{problem.title}</h1>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">難易度 {problem.difficulty}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{problem.estimatedMinutes}分目安</span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm leading-7 text-slate-200">{problem.description}</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Task</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-100">{problem.task}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {problem.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className={`mt-5 rounded-2xl border p-4 ${feedbackTone}`}>
              <div className="flex items-start gap-3">
                {feedback.status === 'passed' ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5" />
                ) : feedback.status === 'failed' || feedback.status === 'error' ? (
                  <XCircle className="mt-0.5 h-5 w-5" />
                ) : (
                  <Sparkles className="mt-0.5 h-5 w-5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{feedback.headline}</p>
                  <p className="mt-2 text-sm leading-6 opacity-90">{feedback.body}</p>
                  {feedback.nextStep && <p className="mt-2 text-sm leading-6 opacity-90">次の1手: {feedback.nextStep}</p>}
                  {feedback.badges && feedback.badges.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {feedback.badges.map((badge) => (
                        <span key={badge} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white">
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {visibleHints.length > 0 && (
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                <div className="flex items-center gap-2 text-amber-100">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-sm font-medium">段階ヒント</p>
                </div>
                <div className="mt-3 space-y-2">
                  {visibleHints.map((hint, index) => (
                    <div key={hint} className="rounded-xl border border-amber-200/10 bg-black/10 p-3 text-sm leading-6 text-amber-50">
                      ヒント {index + 1}: {hint}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {practiceAssistMode !== 'normal' && (
              <div className="mt-5 rounded-2xl border border-sky-300/20 bg-sky-300/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-sky-100">
                      {practiceAssistMode === 'fill-in-the-blank' ? '穴埋めモード' : 'ガイドモード'}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-sky-50/90">
                      ここでは全部を解こうとせず、決めた手順だけを順番に進めます。
                    </p>
                  </div>
                  {problem.starterCode && (
                    <button
                      onClick={handleUseStarterCode}
                      className="rounded-full border border-sky-100/20 bg-sky-100/10 px-4 py-2 text-xs font-medium text-sky-50 transition hover:bg-sky-100/20"
                    >
                      補助コードを使う
                    </button>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  {problem.templateSteps.map((step, index) => (
                    <div key={step} className="rounded-xl border border-sky-100/10 bg-black/10 p-3 text-sm leading-6 text-sky-50">
                      Step {index + 1}: {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">今回の進み具合</p>
                <div className="mt-3 space-y-2 text-sm text-slate-200">
                  <p>実行: {currentProgress.runCount}回</p>
                  <p>今回の挑戦回数: {currentProgress.attemptsSinceSolved}回</p>
                  <p>ベスト: {currentProgress.bestAttempts ?? '-'}回</p>
                  <p>次の復習: {formatDayLabel(currentProgress.scheduledReviewAt)}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">小さなメモ</p>
                <textarea
                  value={practiceNotes[problem.id] || ''}
                  onChange={(event) =>
                    setPracticeNotes((current) => ({
                      ...current,
                      [problem.id]: event.target.value,
                    }))
                  }
                  rows={5}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-sm text-white outline-none placeholder:text-slate-500"
                  placeholder="次に直す1点や、気づいたことを1行だけ残しておくと再開しやすいです。"
                />
              </div>
            </div>

            {(showSolution || feedback.status === 'passed') && problem.solution && (
              <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                <p className="text-sm font-medium text-emerald-100">学びの答え合わせ</p>
                <p className="mt-2 text-sm leading-6 text-emerald-50/90">
                  丸写しより、どこが自分のコードと違うかを1点だけ比べるのがおすすめです。
                </p>
                <pre className="mt-3 overflow-x-auto rounded-2xl border border-emerald-100/10 bg-slate-950/80 p-3 text-xs text-emerald-50">
                  {problem.solution}
                </pre>
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#111827]">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <BookOpen className="h-4 w-4 text-amber-200" />
              `main.cpp`
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSkipWithLearning}
                className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-300/20"
              >
                学び付きスキップ
              </button>
              <button
                onClick={handleReset}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/10"
              >
                <span className="inline-flex items-center gap-2">
                  <RefreshCcw className="h-3.5 w-3.5" />
                  やり直す
                </span>
              </button>
              <button
                onClick={handleRunCode}
                disabled={isCompiling}
                className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  {isCompiling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                  {isCompiling ? '試しています...' : '試してみる'}
                </span>
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor value={code} onChange={(value) => setCode(value || '')} language="cpp" />
          </div>
          {feedback.rawMessage && (
            <div className="border-t border-white/10 bg-black/25 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Raw Output</p>
              <pre className="mt-2 max-h-40 overflow-auto rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-xs text-slate-200">
                {feedback.rawMessage}
              </pre>
            </div>
          )}
        </section>
      </div>
    </main>
  );

  const CodeReviewView = (
    <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <AiSettingsPanel
          settings={aiSettings}
          onChange={setAiSettings}
          onCheckConnection={handleCheckAiConnection}
          statusMessage={aiConnectionMessage}
          statusTone={aiConnectionTone}
        />

        <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
            <div className="flex items-center gap-2 text-white">
              <MessageSquareCode className="h-5 w-5 text-rose-200" />
              <h2 className="text-lg font-semibold">レビュー問題一覧</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              日次おすすめも一覧もここから確認できます。未挑戦と復習候補を混ぜて選べます。
            </p>
            <div className="mt-4 space-y-2">
              {reviewSummaries.map((item) => (
                <button
                  key={item.problem.id}
                  onClick={() => openReviewProblem(item.problem.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    item.problem.id === currentReviewProblem.id
                      ? 'border-rose-300/40 bg-rose-300/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{item.problem.title}</p>
                      <p className="mt-1 text-xs text-slate-300">
                        {item.problem.estimatedMinutes}分 / {item.progress.lastVerdict || '未挑戦'}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-200">
                      {item.isReadyForRetry ? '復習' : item.isUntouched ? '新規' : '済'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <ReviewProblemWorkspace
            problem={currentReviewProblem}
            answer={reviewAnswer}
            onAnswerChange={setReviewAnswer}
            onEvaluate={handleEvaluateReview}
            onResetAnswer={handleResetReviewAnswer}
            result={reviewResult}
            progress={currentReviewProgress}
            isEvaluating={isEvaluatingReview}
            fallbackMessage={reviewFallbackMessage}
            showManualFallback={showManualFallback}
          />
        </section>
      </div>
    </main>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.08),_transparent_25%),linear-gradient(180deg,_#07111f,_#081421_32%,_#09131d)] text-white">
      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-slate-950 shadow-lg shadow-amber-300/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-amber-200/70">C++ Momentum</p>
              <h1 className="text-2xl font-semibold tracking-tight text-white">毎日少しずつ前に進む学習アプリ</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setViewMode('home')}
                className={`rounded-full px-4 py-2 text-sm transition ${viewMode === 'home' ? 'bg-amber-300 text-slate-950' : 'text-slate-200 hover:bg-white/10'}`}
              >
                <span className="inline-flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </span>
              </button>
              <button
                onClick={() => setViewMode('practice')}
                className={`rounded-full px-4 py-2 text-sm transition ${viewMode === 'practice' ? 'bg-amber-300 text-slate-950' : 'text-slate-200 hover:bg-white/10'}`}
              >
                <span className="inline-flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Practice
                </span>
              </button>
              <button
                onClick={() => setViewMode('review')}
                className={`rounded-full px-4 py-2 text-sm transition ${viewMode === 'review' ? 'bg-amber-300 text-slate-950' : 'text-slate-200 hover:bg-white/10'}`}
              >
                <span className="inline-flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Review
                </span>
              </button>
              <button
                onClick={() => setViewMode('code-review')}
                className={`rounded-full px-4 py-2 text-sm transition ${viewMode === 'code-review' ? 'bg-amber-300 text-slate-950' : 'text-slate-200 hover:bg-white/10'}`}
              >
                <span className="inline-flex items-center gap-2">
                  <MessageSquareCode className="h-4 w-4" />
                  Code Review
                </span>
              </button>
            </div>

            <select
              value={problem.id}
              onChange={(event) => openProblem(event.target.value, 'practice')}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
            >
              {problems.map((item) => (
                <option key={item.id} value={item.id} className="bg-slate-950 text-white">
                  {item.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {viewMode === 'home' ? HomeView : viewMode === 'review' ? ReviewView : viewMode === 'code-review' ? CodeReviewView : PracticeView}
    </div>
  );
}

export default App;
