import React, { useState } from 'react';
import { RotateCcw, Copy, Check, FileText, Trash2, Volume2, RefreshCw, Sparkles, Square, Play, Pause, Key } from 'lucide-react';
import { DEFAULT_TEXT } from '../data/defaults';
import { TTSEngine } from '../types';

interface Props {
  text: string;
  onChange: (newText: string) => void;
  onReset: () => void;
  onSynthesize?: () => void;
  isSynthesizing?: boolean;
  retrySeconds?: number | null;
  // Browser Speech Synthesis
  onBrowserSpeak?: () => void;
  onStopBrowserSpeak?: () => void;
  onToggleBrowserPause?: () => void;
  isSpeakingBrowser?: boolean;
  isBrowserPaused?: boolean;
  isDailyQuotaReached?: boolean;
  synthesisMode?: TTSEngine;
  onChangeSynthesisMode?: (mode: TTSEngine) => void;
  onToggleSynthesisMode?: () => void;
  onOpenApiKeyModal?: () => void;
  hasCustomApiKey?: boolean;
  hasCustomYandexKey?: boolean;
  activePrompt?: string;
  selectedVoiceName?: string;
}

export const TextEditor: React.FC<Props> = ({
  text,
  onChange,
  onReset,
  onSynthesize,
  isSynthesizing = false,
  retrySeconds = null,
  onBrowserSpeak,
  onStopBrowserSpeak,
  onToggleBrowserPause,
  isSpeakingBrowser = false,
  isBrowserPaused = false,
  isDailyQuotaReached = false,
  synthesisMode = 'gemini',
  onChangeSynthesisMode,
  onToggleSynthesisMode,
  onOpenApiKeyModal,
  hasCustomApiKey = false,
  hasCustomYandexKey = false,
  activePrompt,
  selectedVoiceName,
}) => {
  const [copied, setCopied] = useState(false);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  // Average Russian narrator reading speed: ~105-120 words per minute (~1.8 words/sec)
  const estimatedSeconds = Math.round(wordCount / 1.8);
  const estMins = Math.floor(estimatedSeconds / 60);
  const estSecs = estimatedSeconds % 60;
  const formattedEst = estMins > 0 ? `${estMins} мин ${estSecs} сек` : `${estSecs} сек`;

  const copyText = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMainAction = () => {
    if (isSpeakingBrowser) {
      onStopBrowserSpeak?.();
      return;
    }

    if (synthesisMode === 'browser' || (isDailyQuotaReached && synthesisMode === 'gemini' && !hasCustomApiKey)) {
      onBrowserSpeak?.();
    } else {
      onSynthesize?.();
    }
  };

  return (
    <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-5 text-stone-100 flex flex-col h-full shadow-lg">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <label className="text-sm font-semibold text-stone-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          Текст для озвучки
        </label>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={copyText}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors flex items-center gap-1.5 border border-stone-800 cursor-pointer"
            title="Скопировать текст"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Копировать</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors flex items-center gap-1.5 border border-stone-800 cursor-pointer"
            title="Восстановить текст из вашего запроса"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Вернуть текст из запроса</span>
          </button>

          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition-colors border border-stone-800 cursor-pointer"
            title="Очистить поле"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Banner */}
      <div className="mb-3 p-2.5 rounded-xl bg-stone-950/70 border border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-stone-400">Движок:</span>
          <div className="inline-flex rounded-lg bg-stone-900 p-0.5 border border-stone-800">
            {/* Gemini */}
            <button
              type="button"
              onClick={() => {
                if (onChangeSynthesisMode) onChangeSynthesisMode('gemini');
                else if (synthesisMode !== 'gemini') onToggleSynthesisMode?.();
              }}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 font-medium ${
                synthesisMode === 'gemini' && !isDailyQuotaReached
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Gemini TTS</span>
            </button>

            {/* Yandex SpeechKit */}
            <button
              type="button"
              onClick={() => {
                if (onChangeSynthesisMode) onChangeSynthesisMode('yandex');
              }}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 font-medium ${
                synthesisMode === 'yandex'
                  ? 'bg-red-500 text-white shadow-sm font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span className="font-bold text-[10px]">Я</span>
              <span>Яндекс.SpeechKit</span>
            </button>

            {/* Browser */}
            <button
              type="button"
              onClick={() => {
                if (onChangeSynthesisMode) onChangeSynthesisMode('browser');
                else if (synthesisMode !== 'browser') onToggleSynthesisMode?.();
              }}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 font-medium ${
                synthesisMode === 'browser' || (isDailyQuotaReached && synthesisMode === 'gemini' && !hasCustomApiKey)
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Volume2 className="w-3 h-3" />
              <span>Встроенный (без лимитов)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDailyQuotaReached && synthesisMode === 'gemini' && (
            <span className="text-[11px] text-amber-400/90 font-medium">
              * Суточный лимит Gemini
            </span>
          )}
          {onOpenApiKeyModal && (
            <button
              type="button"
              onClick={onOpenApiKeyModal}
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-white border border-stone-800 transition-colors cursor-pointer font-medium"
            >
              <Key className="w-3 h-3 text-amber-400" />
              <span>
                {hasCustomApiKey || hasCustomYandexKey ? 'Свои API ключи' : 'Настроить API'}
              </span>
              {(hasCustomApiKey || hasCustomYandexKey) && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Active prompt badge if Gemini mode */}
      {synthesisMode === 'gemini' && activePrompt && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold shrink-0 text-amber-400">Применённый промпт подачи:</span>
          <span className="truncate text-stone-300 italic">«{activePrompt}»</span>
        </div>
      )}

      {/* Editor textarea */}
      <div className="relative flex-1 min-h-[220px]">
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Введите или вставьте текст, который нужно озвучить..."
          rows={9}
          className="w-full h-full min-h-[220px] p-4 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm leading-relaxed placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60 resize-y font-sans"
        />
      </div>

      {/* Footer stats & Action button right near the text field */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-stone-800/80">
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-400">
          <span>Символов: <strong className="text-stone-300">{charCount.toLocaleString()}</strong></span>
          <span>·</span>
          <span>Слов: <strong className="text-stone-300">{wordCount}</strong></span>
          <span>·</span>
          <span>Примерно: <strong className="text-amber-400 font-medium">{formattedEst}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {/* If browser speech is running, show pause and stop buttons */}
          {isSpeakingBrowser && (
            <>
              {onToggleBrowserPause && (
                <button
                  type="button"
                  onClick={onToggleBrowserPause}
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title={isBrowserPaused ? "Продолжить" : "Пауза"}
                >
                  {isBrowserPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
                </button>
              )}
              {onStopBrowserSpeak && (
                <button
                  type="button"
                  onClick={onStopBrowserSpeak}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-rose-300" />
                  <span>Стоп</span>
                </button>
              )}
            </>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleMainAction}
            disabled={isSynthesizing || !text.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isSynthesizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                <span>Генерация озвучки...</span>
              </>
            ) : isSpeakingBrowser ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-stone-950 animate-ping" />
                <span>Идёт чтение вслух...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-stone-950" />
                <span>
                  {synthesisMode === 'browser' || isDailyQuotaReached
                    ? 'Озвучить (Web Speech без лимитов)'
                    : 'Озвучить текст'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
