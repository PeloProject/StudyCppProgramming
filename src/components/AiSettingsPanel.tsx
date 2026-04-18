import { useState } from 'react';
import { Cpu, Settings2, Wifi } from 'lucide-react';
import type { AiSettings, AiProvider } from '../types/review';

interface AiSettingsPanelProps {
  settings: AiSettings;
  onChange: (settings: AiSettings) => void;
  onCheckConnection: () => Promise<void>;
  statusMessage: string;
  statusTone: 'idle' | 'success' | 'error';
}

const providerDefaults: Record<AiProvider, { baseUrl: string; model: string }> = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama3.1',
  },
  'openai-compatible': {
    baseUrl: 'http://localhost:1234/v1',
    model: 'local-model',
  },
};

export function AiSettingsPanel({
  settings,
  onChange,
  onCheckConnection,
  statusMessage,
  statusTone,
}: AiSettingsPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const setProvider = (provider: AiProvider) => {
    const defaults = providerDefaults[provider];
    onChange({
      provider,
      baseUrl: defaults.baseUrl,
      model: defaults.model,
      apiKey: provider === 'ollama' ? '' : settings.apiKey || '',
    });
  };

  const statusClass =
    statusTone === 'success'
      ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
      : statusTone === 'error'
        ? 'border-rose-300/20 bg-rose-300/10 text-rose-100'
        : 'border-white/10 bg-white/5 text-slate-200';

  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white">
            <Cpu className="h-5 w-5 text-amber-200" />
            <h2 className="text-lg font-semibold">ローカルAI設定</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            ふだんは接続先だけ選べば使えます。必要なときだけ詳細設定を開ける形にしています。
          </p>
        </div>
        <button
          onClick={() => setShowAdvanced((current) => !current)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
        >
          <Settings2 className="h-4 w-4" />
          {showAdvanced ? '詳細を閉じる' : '詳細設定'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setProvider('ollama')}
          className={`rounded-full px-4 py-2 text-sm transition ${
            settings.provider === 'ollama' ? 'bg-amber-300 text-slate-950' : 'border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'
          }`}
        >
          Ollama
        </button>
        <button
          onClick={() => setProvider('openai-compatible')}
          className={`rounded-full px-4 py-2 text-sm transition ${
            settings.provider === 'openai-compatible'
              ? 'bg-amber-300 text-slate-950'
              : 'border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'
          }`}
        >
          OpenAI互換API
        </button>
        <button
          onClick={onCheckConnection}
          className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-300/20"
        >
          <Wifi className="h-4 w-4" />
          接続確認
        </button>
      </div>

      {showAdvanced && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-sm text-slate-300">Base URL</span>
            <input
              value={settings.baseUrl}
              onChange={(event) => onChange({ ...settings, baseUrl: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Model</span>
            <input
              value={settings.model}
              onChange={(event) => onChange({ ...settings, model: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
            />
          </label>
          {settings.provider === 'openai-compatible' && (
            <label className="block md:col-span-2">
              <span className="text-sm text-slate-300">API Key</span>
              <input
                value={settings.apiKey || ''}
                onChange={(event) => onChange({ ...settings, apiKey: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                placeholder="必要な場合のみ入力"
              />
            </label>
          )}
        </div>
      )}

      <div className={`mt-4 rounded-2xl border p-4 text-sm ${statusClass}`}>{statusMessage}</div>
    </section>
  );
}
