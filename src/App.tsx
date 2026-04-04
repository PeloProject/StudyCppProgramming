import { useState, useEffect } from 'react';
import { Bot, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { CodeEditor } from './components/CodeEditor';
import { problems } from './data/problems';
import { compileCode } from './services/compiler';

declare global {
  interface Window {
    MathJax: any;
  }
}

function App() {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(() => {
    const saved = localStorage.getItem('current-problem-index');
    return saved !== null ? Number(saved) : 0;
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return problems[currentProblemIndex]?.category || problems[0].category;
  });
  
  const problem = problems[currentProblemIndex] || problems[0];
  
  // Initialize code from localStorage if available, otherwise from the problem definition
  const [code, setCode] = useState(() => {
    const savedCode = localStorage.getItem(`problem-${problem.id}-code`);
    return savedCode || problem.initialCode;
  });
  
  const [isCompiling, setIsCompiling] = useState(false);
  const [testResult, setTestResult] = useState<{status: 'idle' | 'passed' | 'failed' | 'error', message?: string}>({ status: 'idle' });
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Update localStorage whenever code or index changes
  useEffect(() => {
    localStorage.setItem(`problem-${problem.id}-code`, code);
    localStorage.setItem('current-problem-index', currentProblemIndex.toString());
  }, [code, problem.id, currentProblemIndex]);

  useEffect(() => {
    setShowHint(false);
    setShowSolution(false);
    
    // Trigger MathJax typeset when problem changes
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  }, [currentProblemIndex]);

  const handleRunCode = async () => {
    setIsCompiling(true);
    setTestResult({ status: 'idle' });
    
    // 1. Client-side code validation (Regex/String matching)
    if (problem.clientValidation) {
       const clientError = problem.clientValidation(code);
       if (clientError) {
          setTestResult({ status: 'failed', message: clientError });
          setIsCompiling(false);
          return;
       }
    }

    // 2. Server-side compilation & execution via Wandbox
    // We use a macro to rename the user's main function so our test main() will run instead.
    const preCode = "#define main user_main\n";
    const postCode = "\n#undef main\n" + problem.testCode;
    const combinedCode = preCode + code + postCode;

    try {
      const response = await compileCode({ code: combinedCode });
      
      if (response.compiler_error) {
         // Compilation Error
         setTestResult({ 
            status: 'error', 
            message: response.compiler_error
         });
      } else {
         // Check runtime output for TEST_PASSED or TEST_FAILED
         const output = response.program_message || '';
         if (output.includes('TEST_PASSED')) {
            setTestResult({ status: 'passed', message: 'All tests passed successfully!' });
         } else if (output.includes('TEST_FAILED')) {
            // Extract the failure message
            const match = output.match(/TEST_FAILED:(.*)/);
            setTestResult({ status: 'failed', message: match ? match[1] : 'Tests failed.' });
         } else {
            setTestResult({ status: 'error', message: 'Unable to parse test results. Did you modify the main function?' });
         }
      }
    } catch (error: any) {
      setTestResult({ status: 'error', message: error.message || 'Network error occurred during compilation.' });
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-indigo-500" />
          <h1 className="text-xl font-bold tracking-tight">C++ Mastery</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <label className="text-sm font-medium text-muted-foreground mr-1">Category:</label>
             <select 
               value={selectedCategory}
               onChange={(e) => {
                 const newCat = e.target.value;
                 setSelectedCategory(newCat);
                 // Automatically select the first problem in the new category
                 const firstInCat = problems.findIndex(p => p.category === newCat);
                 if (firstInCat !== -1) {
                   setCurrentProblemIndex(firstInCat);
                   const newProblem = problems[firstInCat];
                   const savedCode = localStorage.getItem(`problem-${newProblem.id}-code`);
                   setCode(savedCode || newProblem.initialCode);
                   setTestResult({ status: 'idle' });
                 }
               }}
               className="bg-[#1e1e1e] border border-border text-foreground text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2"
             >
               {Array.from(new Set(problems.map(p => p.category))).map(category => (
                 <option key={category} value={category}>{category}</option>
               ))}
             </select>

             <label className="text-sm font-medium text-muted-foreground ml-2 mr-1">Problem:</label>
             <select 
               value={problem.id}
               onChange={(e) => {
                 const newId = e.target.value;
                 const newIdx = problems.findIndex(p => p.id === newId);
                 setCurrentProblemIndex(newIdx);
                 const newProblem = problems[newIdx];
                 const savedCode = localStorage.getItem(`problem-${newProblem.id}-code`);
                 setCode(savedCode || newProblem.initialCode);
                 setTestResult({ status: 'idle' });
               }}
               className="bg-[#1e1e1e] border border-border text-foreground text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block min-w-[180px] p-2"
             >
                {problems.filter(p => p.category === selectedCategory).map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
             </select>
          </div>
          
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to reset the code to its initial state? All your changes will be lost.")) {
                setCode(problem.initialCode);
                localStorage.removeItem(`problem-${problem.id}-code`);
                setTestResult({ status: 'idle' });
              }
            }}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
          
          <button 
            onClick={handleRunCode}
            disabled={isCompiling}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors shadow-sm"
          >
            {isCompiling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {isCompiling ? 'Running...' : 'Console / Run Code'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Problem Description */}
        <div className="w-1/3 min-w-[350px] border-r border-border flex flex-col bg-card/50">
          <div className="p-6 overflow-y-auto flex-1">
            <h2 className="text-2xl font-semibold mb-4">{problem.title}</h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground">
              <p>{problem.description}</p>
              <div className="mt-4 p-4 bg-muted rounded-md border border-border">
                <p className="font-medium text-foreground mb-2">Task:</p>
                <p className="whitespace-pre-wrap">{problem.task}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {problem.hint && (
                  <button 
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded transition-colors"
                  >
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                )}
                {problem.solution && (
                  <button 
                    onClick={() => setShowSolution(!showSolution)}
                    className="text-xs px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded transition-colors"
                  >
                    {showSolution ? 'Hide Solution' : 'Show Solution'}
                  </button>
                )}
              </div>

              {showHint && problem.hint && (
                <div className="mt-4 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-md text-sm text-indigo-300 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="font-semibold mb-1">💡 Hint:</p>
                  <p>{problem.hint}</p>
                </div>
              )}

              {showSolution && problem.solution && (
                <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-md text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="font-semibold text-green-400 mb-1">✅ Solution:</p>
                  <pre className="mt-2 p-3 bg-black/40 rounded border border-green-500/30 overflow-x-auto text-xs font-mono text-green-300/90">
                    {problem.solution}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="mt-8">
               <h3 className="text-lg font-medium mb-4 border-b border-border pb-2">Test Results</h3>
               
               <div className="space-y-4">
                  {testResult.status === 'idle' && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 p-4 rounded-md border border-border">
                      <span className="w-3 h-3 rounded-full bg-muted-foreground/30 flex items-center justify-center border border-border"></span>
                      No tests run yet. Click "Run Code" to compile and execute.
                    </div>
                  )}

                  {testResult.status === 'passed' && (
                    <div className="flex items-start gap-3 text-sm bg-green-500/10 p-4 rounded-md border border-green-500/20">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-500">Success!</p>
                        <p className="text-green-500/80 mt-1">{testResult.message}</p>
                      </div>
                    </div>
                  )}

                  {testResult.status === 'failed' && (
                    <div className="flex items-start gap-3 text-sm bg-red-500/10 p-4 rounded-md border border-red-500/20">
                       <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                       <div>
                         <p className="font-medium text-red-500">Test Failed</p>
                         <p className="text-red-500/80 mt-1">{testResult.message}</p>
                       </div>
                    </div>
                  )}
                  
                  {testResult.status === 'error' && (
                    <div className="flex flex-col gap-2 text-sm bg-destructive/10 p-4 rounded-md border border-destructive/20">
                       <div className="flex items-center gap-3">
                         <XCircle className="w-5 h-5 text-destructive" />
                         <span className="font-medium text-destructive">Compilation / Execution Error</span>
                       </div>
                       {testResult.message && (
                          <pre className="mt-2 p-3 bg-background rounded border border-border overflow-x-auto text-xs font-mono text-destructive/80">
                            {testResult.message}
                          </pre>
                       )}
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Code Editor */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
           <div className="bg-[#2d2d2d] text-gray-300 text-xs py-2 px-4 border-b border-[#1e1e1e] flex items-center font-mono">
             <Bot className="w-3 h-3 mr-2 text-indigo-400" />
             main.cpp
           </div>
           <div className="flex-1 relative">
             <CodeEditor 
                value={code} 
                onChange={(val) => setCode(val || '')} 
                language="cpp" 
             />
           </div>
        </div>
      </main>
    </div>
  )
}

export default App;
