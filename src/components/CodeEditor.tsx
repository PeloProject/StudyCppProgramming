import React from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
}

export function CodeEditor({ value, onChange, language = 'cpp' }: CodeEditorProps) {
  const monaco = useMonaco();

  React.useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('dracula', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { background: '1e1e1e', token: '' }
        ],
        colors: {
          'editor.background': '#1e1e1e',
        }
      });
      monaco.editor.setTheme('dracula');
    }
  }, [monaco]);

  return (
    <div className="w-full h-full">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={value}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        }}
      />
    </div>
  );
}
