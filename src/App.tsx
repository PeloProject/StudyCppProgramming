import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Flag,
  Loader2,
  Play,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { CodeEditor } from './components/CodeEditor';
import { problems } from './data/problems';
import { compileCode } from './services/compiler';

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: () => Promise<unknown>;
    };
  }
}

type ViewMode = 'practice' | 'analysis';
type TestStatus = 'idle' | 'passed' | 'failed' | 'error';

interface ProblemStats {
  runCount: number;
  solvedCount: number;
  failedCount: number;
  retireCount: number;
  attemptsSinceSolved: number;
  lastSolveAttempts: number | null;
  solveAttemptHistory: number[];
  lastPlayedAt: string | null;
  lastSolvedAt: string | null;
  retiredAfterAttempts: number;
}

type ProblemStatsMap = Record<string, ProblemStats>;

type ProblemNote = {
  issue: string;
  reflection: string;
  learned: string;
  updatedAt: string | null;
};

type ProblemNotesMap = Record<string, ProblemNote>;

const STATS_STORAGE_KEY = 'problem-progress-stats';
const NOTES_STORAGE_KEY = 'problem-notes';

const createEmptyStats = (): ProblemStats => ({
  runCount: 0,
  solvedCount: 0,
  failedCount: 0,
  retireCount: 0,
  attemptsSinceSolved: 0,
  lastSolveAttempts: null,
  solveAttemptHistory: [],
  lastPlayedAt: null,
  lastSolvedAt: null,
  retiredAfterAttempts: 0,
});

const createEmptyNote = (): ProblemNote => ({
  issue: '',
  reflection: '',
  learned: '',
  updatedAt: null,
});

const readStoredStats = (): ProblemStatsMap => {
  const raw = localStorage.getItem(STATS_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as ProblemStatsMap;
    return Object.fromEntries(
      Object.entries(parsed).map(([problemId, stats]) => [
        problemId,
        {
          ...createEmptyStats(),
          ...stats,
          solveAttemptHistory: Array.isArray(stats.solveAttemptHistory) ? stats.solveAttemptHistory : [],
        },
      ]),
    );
  } catch {
    return {};
  }
};

const readStoredNotes = (): ProblemNotesMap => {
  const raw = localStorage.getItem(NOTES_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as ProblemNotesMap;
    return Object.fromEntries(
      Object.entries(parsed).map(([problemId, note]) => [
        problemId,
        {
          ...createEmptyNote(),
          ...note,
        },
      ]),
    );
  } catch {
    return {};
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

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('practice');
  const [currentProblemIndex, setCurrentProblemIndex] = useState(() => {
    const saved = localStorage.getItem('current-problem-index');
    return saved !== null ? Number(saved) : 0;
  });
  const [problemStats, setProblemStats] = useState<ProblemStatsMap>(() => readStoredStats());
  const [problemNotes, setProblemNotes] = useState<ProblemNotesMap>(() => readStoredNotes());
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return problems[currentProblemIndex]?.category || problems[0].category;
  });

  const problem = problems[currentProblemIndex] || problems[0];

  const [code, setCode] = useState(() => {
    const savedCode = localStorage.getItem(`problem-${problem.id}-code`);
    return savedCode || problem.initialCode;
  });
  const [isCompiling, setIsCompiling] = useState(false);
  const [testResult, setTestResult] = useState<{ status: TestStatus; message?: string }>({ status: 'idle' });
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showProblemProgress, setShowProblemProgress] = useState(false);

  useEffect(() => {
    localStorage.setItem(`problem-${problem.id}-code`, code);
    localStorage.setItem('current-problem-index', currentProblemIndex.toString());
  }, [code, problem.id, currentProblemIndex]);

  useEffect(() => {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(problemStats));
  }, [problemStats]);

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(problemNotes));
  }, [problemNotes]);

  useEffect(() => {
    setShowHint(false);
    setShowSolution(false);

    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  }, [currentProblemIndex]);

  const currentStats = problemStats[problem.id] || createEmptyStats();
  const averageAttemptsToSolve =
    currentStats.solveAttemptHistory.length > 0
      ? (
          currentStats.solveAttemptHistory.reduce((sum, count) => sum + count, 0) /
          currentStats.solveAttemptHistory.length
        ).toFixed(1)
      : '-';

  const problemSummaries = useMemo(() => {
    return problems.map((item) => {
      const stats = problemStats[item.id] || createEmptyStats();
      const averageSolveAttempts =
        stats.solveAttemptHistory.length > 0
          ? stats.solveAttemptHistory.reduce((sum, count) => sum + count, 0) / stats.solveAttemptHistory.length
          : null;
      const weaknessScore =
        stats.retireCount * 3 +
        stats.failedCount * 1.5 +
        stats.retiredAfterAttempts * 0.5 +
        (averageSolveAttempts ?? 0) -
        stats.solvedCount * 0.75;

      return {
        ...item,
        stats,
        averageSolveAttempts,
        weaknessScore,
        isUntouched: stats.runCount === 0 && stats.retireCount === 0,
        isInProgress: (stats.runCount > 0 || stats.retireCount > 0) && stats.solvedCount === 0,
      };
    });
  }, [problemStats]);

  const weakProblems = useMemo(() => {
    return problemSummaries
      .filter((item) => item.stats.runCount > 0 || item.stats.retireCount > 0)
      .sort((a, b) => b.weaknessScore - a.weaknessScore)
      .slice(0, 5);
  }, [problemSummaries]);

  const inProgressProblems = useMemo(() => {
    return problemSummaries.filter((item) => item.isInProgress);
  }, [problemSummaries]);

  const activeProblems = useMemo(() => {
    return [...problemSummaries]
      .filter((item) => item.stats.lastPlayedAt)
      .sort((a, b) => new Date(b.stats.lastPlayedAt || 0).getTime() - new Date(a.stats.lastPlayedAt || 0).getTime())
      .slice(0, 8);
  }, [problemSummaries]);

  const solvedProblemsCount = useMemo(() => {
    return problemSummaries.filter((item) => item.stats.solvedCount > 0).length;
  }, [problemSummaries]);

  const totalRetires = useMemo(() => {
    return problemSummaries.reduce((sum, item) => sum + item.stats.retireCount, 0);
  }, [problemSummaries]);

  const totalRuns = useMemo(() => {
    return problemSummaries.reduce((sum, item) => sum + item.stats.runCount, 0);
  }, [problemSummaries]);

  const updateProblemStats = (problemId: string, updater: (current: ProblemStats) => ProblemStats) => {
    setProblemStats((current) => {
      const base = current[problemId] || createEmptyStats();
      return {
        ...current,
        [problemId]: updater(base),
      };
    });
  };

  const updateProblemNote = (problemId: string, updater: (current: ProblemNote) => ProblemNote) => {
    setProblemNotes((current) => {
      const base = current[problemId] || createEmptyNote();
      return {
        ...current,
        [problemId]: updater(base),
      };
    });
  };

  const moveToProblem = (problemId: string) => {
    const newIdx = problems.findIndex((item) => item.id === problemId);
    if (newIdx === -1) {
      return;
    }

    setViewMode('practice');
    setSelectedCategory(problems[newIdx].category);
    setCurrentProblemIndex(newIdx);
    const savedCode = localStorage.getItem(`problem-${problems[newIdx].id}-code`);
    setCode(savedCode || problems[newIdx].initialCode);
    setTestResult({ status: 'idle' });
  };

  const handleRunCode = async () => {
    setIsCompiling(true);
    setTestResult({ status: 'idle' });

    if (problem.clientValidation) {
      const clientError = problem.clientValidation(code);
      if (clientError) {
        updateProblemStats(problem.id, (current) => ({
          ...current,
          runCount: current.runCount + 1,
          failedCount: current.failedCount + 1,
          attemptsSinceSolved: current.attemptsSinceSolved + 1,
          lastPlayedAt: new Date().toISOString(),
        }));
        setTestResult({ status: 'failed', message: clientError });
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
        updateProblemStats(problem.id, (current) => ({
          ...current,
          runCount: current.runCount + 1,
          failedCount: current.failedCount + 1,
          attemptsSinceSolved: current.attemptsSinceSolved + 1,
          lastPlayedAt: new Date().toISOString(),
        }));
        setTestResult({
          status: 'error',
          message: response.compiler_error,
        });
      } else {
        const output = response.program_message || '';
        if (output.includes('TEST_PASSED')) {
          updateProblemStats(problem.id, (current) => {
            const attemptsNeeded = current.attemptsSinceSolved + 1;
            return {
              ...current,
              runCount: current.runCount + 1,
              solvedCount: current.solvedCount + 1,
              attemptsSinceSolved: 0,
              lastSolveAttempts: attemptsNeeded,
              solveAttemptHistory: [...current.solveAttemptHistory, attemptsNeeded],
              lastPlayedAt: new Date().toISOString(),
              lastSolvedAt: new Date().toISOString(),
            };
          });
          setTestResult({ status: 'passed', message: 'All tests passed successfully!' });
        } else if (output.includes('TEST_FAILED')) {
          updateProblemStats(problem.id, (current) => ({
            ...current,
            runCount: current.runCount + 1,
            failedCount: current.failedCount + 1,
            attemptsSinceSolved: current.attemptsSinceSolved + 1,
            lastPlayedAt: new Date().toISOString(),
          }));
          const match = output.match(/TEST_FAILED:(.*)/);
          setTestResult({ status: 'failed', message: match ? match[1] : 'Tests failed.' });
        } else {
          updateProblemStats(problem.id, (current) => ({
            ...current,
            runCount: current.runCount + 1,
            failedCount: current.failedCount + 1,
            attemptsSinceSolved: current.attemptsSinceSolved + 1,
            lastPlayedAt: new Date().toISOString(),
          }));
          setTestResult({ status: 'error', message: 'Unable to parse test results. Did you modify the main function?' });
        }
      }
    } catch (error: unknown) {
      updateProblemStats(problem.id, (current) => ({
        ...current,
        runCount: current.runCount + 1,
        failedCount: current.failedCount + 1,
        attemptsSinceSolved: current.attemptsSinceSolved + 1,
        lastPlayedAt: new Date().toISOString(),
      }));
      const message = error instanceof Error ? error.message : 'Network error occurred during compilation.';
      setTestResult({ status: 'error', message });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleRetire = () => {
    updateProblemStats(problem.id, (current) => ({
      ...current,
      retireCount: current.retireCount + 1,
      retiredAfterAttempts: current.retiredAfterAttempts + current.attemptsSinceSolved,
      attemptsSinceSolved: 0,
      lastPlayedAt: new Date().toISOString(),
    }));
    setShowHint(true);
    setShowSolution(true);
    setTestResult({
      status: 'idle',
      message: 'この問題はリタイアとして記録しました。ヒントと解答を表示しています。',
    });
  };

  const PracticeView = (
    <main className="flex-1 flex overflow-hidden">
      <div className="w-1/3 min-w-[380px] border-r border-border flex flex-col bg-card/50">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">{problem.title}</h2>
              </div>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                {problem.category}
              </span>
            </div>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-muted-foreground">
            <p>{problem.description}</p>
            <div className="mt-4 rounded-md border border-border bg-muted p-4">
              <p className="mb-2 font-medium text-foreground">Task:</p>
              <p className="whitespace-pre-wrap">{problem.task}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {problem.hint && (
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="rounded border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-400 transition-colors hover:bg-indigo-500/20"
                >
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
              )}
              {problem.solution && (
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="rounded border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs text-green-400 transition-colors hover:bg-green-500/20"
                >
                  {showSolution ? 'Hide Solution' : 'Show Solution'}
                </button>
              )}
            </div>

            {showHint && problem.hint && (
              <div className="mt-4 rounded-md border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm text-indigo-300">
                <p className="mb-1 font-semibold">Hint</p>
                <p>{problem.hint}</p>
              </div>
            )}

            {showSolution && problem.solution && (
              <div className="mt-4 rounded-md border border-green-500/20 bg-green-500/5 p-4 text-sm">
                <p className="mb-1 font-semibold text-green-400">Solution</p>
                <pre className="mt-2 overflow-x-auto rounded border border-green-500/30 bg-black/40 p-3 text-xs text-green-300/90">
                  {problem.solution}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-8">
            <h3 className="border-b border-border pb-2 text-lg font-medium">Test Results</h3>

            <div className="mt-4 space-y-4">
              {testResult.status === 'idle' && (
                <div className="flex items-center gap-3 rounded-md border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                  <span className="flex h-3 w-3 items-center justify-center rounded-full border border-border bg-muted-foreground/30"></span>
                  {testResult.message || 'No tests run yet. Click "Run Code" to compile and execute.'}
                </div>
              )}

              {testResult.status === 'passed' && (
                <div className="flex items-start gap-3 rounded-md border border-green-500/20 bg-green-500/10 p-4 text-sm">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-500">Success!</p>
                    <p className="mt-1 text-green-500/80">{testResult.message}</p>
                  </div>
                </div>
              )}

              {testResult.status === 'failed' && (
                <div className="flex items-start gap-3 rounded-md border border-red-500/20 bg-red-500/10 p-4 text-sm">
                  <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-500">Test Failed</p>
                    <p className="mt-1 text-red-500/80">{testResult.message}</p>
                  </div>
                </div>
              )}

              {testResult.status === 'error' && (
                <div className="flex flex-col gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="font-medium text-destructive">Compilation / Execution Error</span>
                  </div>
                  {testResult.message && (
                    <pre className="mt-2 overflow-x-auto rounded border border-border bg-background p-3 text-xs text-destructive/80">
                      {testResult.message}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-background/70">
            <button
              onClick={() => setShowProblemProgress((current) => !current)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-card/40"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Problem Progress</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  正解 {currentStats.solvedCount} / リタイア {currentStats.retireCount} / 実行 {currentStats.runCount}
                </p>
              </div>
              {showProblemProgress ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showProblemProgress && (
              <div className="border-t border-border px-4 pb-4 pt-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-card px-3 py-3">
                    <p className="text-muted-foreground">正解回数</p>
                    <p className="mt-1 text-xl font-semibold text-green-400">{currentStats.solvedCount}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card px-3 py-3">
                    <p className="text-muted-foreground">リタイア回数</p>
                    <p className="mt-1 text-xl font-semibold text-amber-300">{currentStats.retireCount}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card px-3 py-3">
                    <p className="text-muted-foreground">今回の正解まで残り挑戦数</p>
                    <p className="mt-1 text-xl font-semibold">{currentStats.attemptsSinceSolved}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card px-3 py-3">
                    <p className="text-muted-foreground">直近の正解までの回数</p>
                    <p className="mt-1 text-xl font-semibold">{currentStats.lastSolveAttempts ?? '-'}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>平均正解回数: {averageAttemptsToSolve}</span>
                  <span>実行回数: {currentStats.runCount}</span>
                  <span>失敗回数: {currentStats.failedCount}</span>
                  <span>最終正解: {formatDateTime(currentStats.lastSolvedAt)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-background/70 p-4">
            <h3 className="border-b border-border pb-2 text-lg font-medium">Learning Notes</h3>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">つまずいた点</label>
                <textarea
                  value={(problemNotes[problem.id] || createEmptyNote()).issue}
                  onChange={(event) =>
                    updateProblemNote(problem.id, (current) => ({
                      ...current,
                      issue: event.target.value,
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  rows={4}
                  className="w-full rounded-md border border-border bg-card p-3 text-sm text-foreground focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="何がわからなかったかを簡単に書いておきましょう。"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">振り返り / 解法のポイント</label>
                <textarea
                  value={(problemNotes[problem.id] || createEmptyNote()).reflection}
                  onChange={(event) =>
                    updateProblemNote(problem.id, (current) => ({
                      ...current,
                      reflection: event.target.value,
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  rows={4}
                  className="w-full rounded-md border border-border bg-card p-3 text-sm text-foreground focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="どのように解いたか、自分の考えをまとめておきましょう。"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">学んだこと</label>
                <textarea
                  value={(problemNotes[problem.id] || createEmptyNote()).learned}
                  onChange={(event) =>
                    updateProblemNote(problem.id, (current) => ({
                      ...current,
                      learned: event.target.value,
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  rows={4}
                  className="w-full rounded-md border border-border bg-card p-3 text-sm text-foreground focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="今回の学習で得た事実や注意点を書いておきましょう。"
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              最終更新: {formatDateTime((problemNotes[problem.id] || createEmptyNote()).updatedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#1e1e1e]">
        <div className="flex items-center justify-between border-b border-[#1e1e1e] bg-[#2d2d2d] px-4 py-2 text-xs text-gray-300">
          <div className="flex items-center font-mono">
            <Bot className="mr-2 h-3 w-3 text-indigo-400" />
            main.cpp
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRetire}
              className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-200 transition-colors hover:bg-amber-500/20"
            >
              <Flag className="h-3.5 w-3.5" />
              Retire
            </button>
            <button
              onClick={handleRunCode}
              disabled={isCompiling}
              className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-1.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-600/50"
            >
              {isCompiling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              {isCompiling ? 'Running...' : 'Console / Run Code'}
            </button>
          </div>
        </div>
        <div className="flex-1 relative">
          <CodeEditor value={code} onChange={(val) => setCode(val || '')} language="cpp" />
        </div>
      </div>
    </main>
  );

  const AnalysisView = (
    <main className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Trophy className="h-5 w-5 text-green-400" />
              解いた問題
            </div>
            <p className="mt-3 text-3xl font-semibold">{solvedProblemsCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Play className="h-5 w-5 text-indigo-400" />
              総実行回数
            </div>
            <p className="mt-3 text-3xl font-semibold">{totalRuns}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Flag className="h-5 w-5 text-amber-300" />
              総リタイア
            </div>
            <p className="mt-3 text-3xl font-semibold">{totalRetires}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Target className="h-5 w-5 text-cyan-300" />
              進行中
            </div>
            <p className="mt-3 text-3xl font-semibold">{inProgressProblems.length}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-red-400" />
              <h2 className="text-lg font-semibold">弱点になりやすい問題</h2>
            </div>
            <div className="mt-4 space-y-3">
              {weakProblems.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  まだ分析できる記録がありません。いくつか問題を解くとここに苦手候補が表示されます。
                </p>
              )}
              {weakProblems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => moveToProblem(item.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-4 text-left transition-colors hover:border-indigo-500/40 hover:bg-background"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">#{index + 1} {item.category}</p>
                    <p className="mt-1 font-medium">{item.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      失敗 {item.stats.failedCount} / リタイア {item.stats.retireCount} / 平均正解回数 {item.averageSolveAttempts?.toFixed(1) ?? '-'}
                    </p>
                  </div>
                  <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                    score {item.weaknessScore.toFixed(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">進行中の問題</h2>
            <div className="mt-4 space-y-3">
              {inProgressProblems.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  まだ進行中の問題はありません。未正解で触った問題がここに並びます。
                </p>
              )}
              {inProgressProblems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => moveToProblem(item.id)}
                  className="block w-full rounded-xl border border-border bg-background/60 px-4 py-4 text-left transition-colors hover:border-cyan-500/40 hover:bg-background"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    実行 {item.stats.runCount} / 失敗 {item.stats.failedCount} / リタイア {item.stats.retireCount}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">最近解いている問題</h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-background/70">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">問題</th>
                    <th className="px-4 py-3 font-medium">状態</th>
                    <th className="px-4 py-3 font-medium">最終操作</th>
                    <th className="px-4 py-3 font-medium">正解回数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeProblems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                        まだ履歴がありません。
                      </td>
                    </tr>
                  )}
                  {activeProblems.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer bg-card/40 transition-colors hover:bg-background/70"
                      onClick={() => moveToProblem(item.id)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </td>
                      <td className="px-4 py-3">
                        {item.isUntouched ? '未着手' : item.isInProgress ? '進行中' : '学習済み'}
                      </td>
                      <td className="px-4 py-3">{formatDateTime(item.stats.lastPlayedAt)}</td>
                      <td className="px-4 py-3">{item.stats.solvedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">全問題の進み具合</h2>
            <div className="mt-4 space-y-3">
              {problemSummaries.map((item) => (
                <button
                  key={item.id}
                  onClick={() => moveToProblem(item.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3 text-left transition-colors hover:border-indigo-500/40 hover:bg-background"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      実行 {item.stats.runCount} / 正解 {item.stats.solvedCount} / リタイア {item.stats.retireCount}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.isUntouched ? '未着手' : item.isInProgress ? '進行中' : '学習済み'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-indigo-500" />
            <h1 className="text-xl font-bold tracking-tight">C++ Mastery</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-background/60 p-1">
            <button
              onClick={() => setViewMode('practice')}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                viewMode === 'practice' ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Practice
            </button>
            <button
              onClick={() => setViewMode('analysis')}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                viewMode === 'analysis' ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Analysis
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="mr-1 text-sm font-medium text-muted-foreground">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const newCategory = e.target.value;
                setSelectedCategory(newCategory);
                const firstInCategory = problems.findIndex((item) => item.category === newCategory);
                if (firstInCategory !== -1) {
                  setCurrentProblemIndex(firstInCategory);
                  const newProblem = problems[firstInCategory];
                  const savedCode = localStorage.getItem(`problem-${newProblem.id}-code`);
                  setCode(savedCode || newProblem.initialCode);
                  setTestResult({ status: 'idle' });
                }
              }}
              className="block rounded-md border border-border bg-[#1e1e1e] p-2 text-sm text-foreground focus:border-indigo-500 focus:ring-indigo-500"
            >
              {Array.from(new Set(problems.map((item) => item.category))).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <label className="ml-2 mr-1 text-sm font-medium text-muted-foreground">Problem:</label>
            <select
              value={problem.id}
              onChange={(e) => moveToProblem(e.target.value)}
              className="block min-w-[220px] rounded-md border border-border bg-[#1e1e1e] p-2 text-sm text-foreground focus:border-indigo-500 focus:ring-indigo-500"
            >
              {problems
                .filter((item) => item.category === selectedCategory)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset the code to its initial state? All your changes will be lost.')) {
                setCode(problem.initialCode);
                localStorage.removeItem(`problem-${problem.id}-code`);
                setTestResult({ status: 'idle' });
              }
            }}
            className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Reset
          </button>
        </div>
      </header>

      {viewMode === 'practice' ? PracticeView : AnalysisView}
    </div>
  );
}

export default App;
