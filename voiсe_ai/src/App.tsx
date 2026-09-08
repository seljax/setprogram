import React, { useState, useEffect } from 'react';
import { Sparkles, Radio, AlertCircle, RefreshCw, Volume2, Mic, CheckCircle, Key } from 'lucide-react';
import { DEFAULT_TEXT, STYLE_PRESETS } from './data/defaults';
import { VoiceAnalyzerSection } from './components/VoiceAnalyzerSection';
import { AudioPlayerControls } from './components/AudioPlayerControls';
import { TextEditor } from './components/TextEditor';
import { VoicePromptInstruction } from './components/VoicePromptInstruction';
import { VoiceSelector } from './components/VoiceSelector';
import { ParagraphsViewer } from './components/ParagraphsViewer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { VoiceAnalysisResult, TTSEngine } from './types';

const INITIAL_ANALYSIS: VoiceAnalysisResult = {
  timbre: 'Зрелый мужской баритон',
  tempo: 'Размеренный (~115 сл/мин)',
  emotion: 'Проникновенная, сдержанная',
  pitchDescription: 'Низкий грудной регистр',
  recommendedVoice: 'Charon',
  recommendedPrompt:
    'Читай вдумчиво, размеренно, глубоким бархатным баритоном, как военный документалист и свидетель событий.',
  explanation:
    'Исходный образец голоса Алексея содержит глубокий грудной резонанс, умеренный повествовательный темп с выразительными паузами. Наиболее точное попадание в тембр и интонацию обеспечивает модель Charon.',
  confidence: 96,
};

export default function App() {
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [voice, setVoice] = useState<string>('Charon');
  const [preset, setPreset] = useState<string>('docu');
  const [customPrompt, setCustomPrompt] = useState<string>(STYLE_PRESETS[0].prompt);
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysisResult>(INITIAL_ANALYSIS);

  // Custom Gemini API Key from localStorage
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('user_gemini_api_key') || '';
    } catch {
      return '';
    }
  });

  // Custom Yandex SpeechKit credentials from localStorage
  const [yandexApiKey, setYandexApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('yandex_tts_api_key') || '';
    } catch {
      return '';
    }
  });
  const [yandexFolderId, setYandexFolderId] = useState<string>(() => {
    try {
      return localStorage.getItem('yandex_tts_folder_id') || '';
    } catch {
      return '';
    }
  });

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [apiKeyModalTab, setApiKeyModalTab] = useState<'gemini' | 'yandex'>('gemini');

  // Pre-rendered audio from Gemini TTS is already available at /narrated_sample.wav!
  const [audioUrl, setAudioUrl] = useState<string | null>('/narrated_sample.wav');
  const [audioDuration, setAudioDuration] = useState<number>(84.6);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retrySeconds, setRetrySeconds] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'paragraphs'>('editor');

  const handleSaveApiKey = (newKey: string) => {
    const trimmed = newKey.trim();
    setCustomApiKey(trimmed);
    try {
      localStorage.setItem('user_gemini_api_key', trimmed);
    } catch (e) {
      console.warn('Could not save key to localStorage:', e);
    }
    setIsDailyQuotaReached(false);
    setErrorMessage(null);
    setRetrySeconds(null);
  };

  const handleClearApiKey = () => {
    setCustomApiKey('');
    try {
      localStorage.removeItem('user_gemini_api_key');
    } catch (e) {
      console.warn('Could not clear key from localStorage:', e);
    }
  };

  const handleSaveYandexKey = (newKey: string, newFolder: string) => {
    const trimmedKey = newKey.trim();
    const trimmedFolder = newFolder.trim();
    setYandexApiKey(trimmedKey);
    setYandexFolderId(trimmedFolder);
    try {
      localStorage.setItem('yandex_tts_api_key', trimmedKey);
      localStorage.setItem('yandex_tts_folder_id', trimmedFolder);
    } catch (e) {
      console.warn('Could not save Yandex key to localStorage:', e);
    }
    setErrorMessage(null);
  };

  const handleClearYandexKey = () => {
    setYandexApiKey('');
    setYandexFolderId('');
    try {
      localStorage.removeItem('yandex_tts_api_key');
      localStorage.removeItem('yandex_tts_folder_id');
    } catch (e) {
      console.warn('Could not clear Yandex key from localStorage:', e);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    setPreset(presetId);
    const p = STYLE_PRESETS.find((item) => item.id === presetId);
    if (p) {
      setCustomPrompt(p.prompt);
    }
  };

  const [isSpeakingBrowser, setIsSpeakingBrowser] = useState(false);
  const [isBrowserPaused, setIsBrowserPaused] = useState(false);
  const [isDailyQuotaReached, setIsDailyQuotaReached] = useState(false);
  const [synthesisMode, setSynthesisMode] = useState<TTSEngine>('gemini');
  const [autoRetryActive, setAutoRetryActive] = useState(false);

  const handleApplyAnalysis = (recVoice: string, recPrompt: string) => {
    setVoice(recVoice);
    setCustomPrompt(recPrompt);
  };

  const handleAnalysisSuccess = (newAnalysis: VoiceAnalysisResult) => {
    setVoiceAnalysis(newAnalysis);
    setVoice(newAnalysis.recommendedVoice);
    if (newAnalysis.recommendedPrompt) {
      setCustomPrompt(newAnalysis.recommendedPrompt);
    }
  };

  const handleBrowserSpeak = (speakText = text) => {
    if (!('speechSynthesis' in window)) {
      setErrorMessage('В вашем браузере не поддерживается встроенный Web Speech API.');
      return;
    }
    window.speechSynthesis.cancel();
    setIsBrowserPaused(false);

    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.95;
    utterance.pitch = 0.92;

    const voices = window.speechSynthesis.getVoices();
    const ruVoice =
      voices.find(
        (v) =>
          v.lang.startsWith('ru') &&
          (v.name.toLowerCase().includes('dmitry') ||
            v.name.toLowerCase().includes('yuri') ||
            v.name.toLowerCase().includes('pavel') ||
            v.name.toLowerCase().includes('male'))
      ) || voices.find((v) => v.lang.startsWith('ru'));

    if (ruVoice) {
      utterance.voice = ruVoice;
    }

    utterance.onstart = () => {
      setIsSpeakingBrowser(true);
      setIsBrowserPaused(false);
    };
    utterance.onend = () => {
      setIsSpeakingBrowser(false);
      setIsBrowserPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeakingBrowser(false);
      setIsBrowserPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopBrowserSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingBrowser(false);
    setIsBrowserPaused(false);
  };

  const handleToggleBrowserPause = () => {
    if (!('speechSynthesis' in window)) return;
    if (isBrowserPaused) {
      window.speechSynthesis.resume();
      setIsBrowserPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsBrowserPaused(true);
    }
  };

  const handleSynthesize = async (
    targetText = text,
    overrideVoice?: string,
    overridePrompt?: string
  ) => {
    if (!targetText.trim()) return;

    handleStopBrowserSpeak();

    const useVoice = overrideVoice || voice;
    const usePrompt = overridePrompt !== undefined ? overridePrompt : customPrompt;

    const isYandexVoice = useVoice.startsWith('yandex-');
    const effectiveEngine: TTSEngine = isYandexVoice ? 'yandex' : synthesisMode;

    // If user explicitly switched to browser speech, or daily quota reached on Gemini with no custom key
    if (
      effectiveEngine === 'browser' ||
      (effectiveEngine === 'gemini' && isDailyQuotaReached && !customApiKey)
    ) {
      handleBrowserSpeak(targetText);
      return;
    }

    setIsSynthesizing(true);
    setErrorMessage(null);
    setRetrySeconds(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (effectiveEngine === 'yandex') {
        if (yandexApiKey) headers['x-yandex-api-key'] = yandexApiKey;
        if (yandexFolderId) headers['x-yandex-folder-id'] = yandexFolderId;
      } else if (customApiKey) {
        headers['x-gemini-api-key'] = customApiKey;
      }

      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: targetText,
          voice: useVoice,
          stylePrompt: usePrompt,
          provider: effectiveEngine === 'yandex' ? 'yandex' : 'gemini',
          yandexApiKey: yandexApiKey || undefined,
          yandexFolderId: yandexFolderId || undefined,
          customApiKey: customApiKey || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'MISSING_YANDEX_KEY') {
          setApiKeyModalTab('yandex');
          setIsApiKeyModalOpen(true);
          setErrorMessage(
            data.message || 'Для озвучивания голосами Яндекс укажите API-ключ в настройках.'
          );
        } else if (response.status === 429) {
          if (data.isDailyQuota) {
            setIsDailyQuotaReached(true);
            setRetrySeconds(null);
            setAutoRetryActive(false);
            setErrorMessage(
              data.message ||
                'Суточный лимит Google Gemini TTS на бесплатном тарифе исчерпан. Используйте Яндекс.SpeechKit или встроенную озвучку.'
            );
          } else {
            setErrorMessage(
              data.message ||
                'Кратковременный лимит запросов к нейросети Google Gemini. Рекомендуем переключиться на Яндекс или встроенную озвучку.'
            );
            setRetrySeconds(data.retryAfter || null);
          }
        } else {
          setErrorMessage(data.message || data.error || 'Не удалось синтезировать речь.');
        }
        return;
      }

      setAudioUrl(data.audioUrl);
      setAudioDuration(data.duration || 0);
      setAutoRetryActive(false);
    } catch (err: any) {
      console.error('Synthesis network error:', err);
      setErrorMessage(
        'Ошибка соединения с сервером синтеза. Убедитесь, что сервер запущен.'
      );
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSynthesizeWithVoice = (recVoice: string, recPrompt: string) => {
    setVoice(recVoice);
    setCustomPrompt(recPrompt);
    handleSynthesize(text, recVoice, recPrompt);
  };

  // Countdown timer for rate limit retry
  useEffect(() => {
    if (retrySeconds === null || retrySeconds <= 0) return;
    const interval = setInterval(() => {
      setRetrySeconds((prev) => {
        if (prev === null || prev <= 1) {
          if (autoRetryActive) {
            setTimeout(() => handleSynthesize(), 500);
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [retrySeconds, autoRetryActive]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation / Branding Header */}
      <header className="border-b border-stone-800/80 bg-stone-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/20 text-stone-950">
              <Mic className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Генерация голоса by SelJax
                </h1>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  v3.1 Neural TTS
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Озвучивание текстов с точностью до тембра присланного образца
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Голосовой профиль: <strong>Charon (Баритон)</strong></span>
            </div>

            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                customApiKey || yandexApiKey
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-stone-100 hover:border-amber-500/50'
              }`}
              title="Настройка API-ключей (Google Gemini & Яндекс.SpeechKit)"
            >
              <Key className={`w-3.5 h-3.5 ${customApiKey || yandexApiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
              {customApiKey || yandexApiKey ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Свои API активны</span>
                  <span className="sm:hidden">API</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Настроить API (Gemini / Яндекс)</span>
                  <span className="sm:hidden">API</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleSynthesize()}
              disabled={isSynthesizing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-xs sm:text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSynthesizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                  <span>Генерация речи...</span>
                </>
              ) : isSpeakingBrowser ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-950 animate-ping" />
                  <span>Идёт чтение вслух...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-stone-950" />
                  <span>
                    {synthesisMode === 'browser' || isDailyQuotaReached
                      ? 'Озвучить (Web Speech)'
                      : 'Озвучить текст'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error / Rate limit alert banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-semibold text-amber-300 mb-0.5">
                <span>
                  {isDailyQuotaReached
                    ? 'Суточный лимит бесплатных запросов Gemini TTS (10/день)'
                    : 'Статус запросов Google Gemini TTS'}
                </span>
                {retrySeconds !== null && retrySeconds > 0 && !isDailyQuotaReached && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Ожидание: {retrySeconds}с
                  </span>
                )}
              </div>
              <p className="leading-relaxed">{errorMessage}</p>

              {/* Instant Action Buttons during Rate Limit */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!isSpeakingBrowser ? (
                  <button
                    type="button"
                    onClick={() => handleBrowserSpeak()}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:bg-amber-400 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Озвучить в браузере прямо сейчас (без ограничений и ожидания)
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggleBrowserPause}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-stone-700 transition-colors"
                    >
                      {isBrowserPaused ? 'Продолжить' : 'Пауза'}
                    </button>
                    <button
                      type="button"
                      onClick={handleStopBrowserSpeak}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/30 border border-rose-500/50 text-rose-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/40 transition-colors"
                    >
                      Остановить озвучку
                    </button>
                  </div>
                )}

                {isDailyQuotaReached && synthesisMode !== 'browser' && (
                  <button
                    type="button"
                    onClick={() => setSynthesisMode('browser')}
                    className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/20 text-amber-300 text-xs font-medium cursor-pointer hover:bg-amber-500/30 transition-colors"
                  >
                    Переключить на встроенный синтез по умолчанию
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-800 border border-amber-500/50 hover:bg-stone-700 text-amber-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  {customApiKey ? 'Управление своим API-ключом' : 'Вставить свой API ключ (снять лимит)'}
                </button>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-stone-400 hover:text-stone-200 text-xs ml-2 cursor-pointer p-1"
            >
              Закрыть
            </button>
          </div>
        )}

        {/* 1. Main Audio Player Component */}
        <AudioPlayerControls
          audioUrl={audioUrl}
          duration={audioDuration}
          voiceName={voice}
          isGenerating={isSynthesizing}
        />

        {/* Tab switcher for Text / Paragraph breakdown */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'editor'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Редактор текста
            </button>
            <button
              onClick={() => setActiveTab('paragraphs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'paragraphs'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Чтение по абзацам и репликам
            </button>
          </div>

          <div className="text-xs text-stone-400 hidden sm:block">
            Текст по запросу загружен и синхронизирован
          </div>
        </div>

        {/* Text & Voice Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Main column: Text Editor or Paragraphs */}
          <div className="lg:col-span-7 space-y-4">
            {activeTab === 'editor' ? (
              <TextEditor
                text={text}
                onChange={setText}
                onReset={() => setText(DEFAULT_TEXT)}
                onSynthesize={() => handleSynthesize()}
                isSynthesizing={isSynthesizing}
                retrySeconds={retrySeconds}
                onBrowserSpeak={() => handleBrowserSpeak()}
                onStopBrowserSpeak={handleStopBrowserSpeak}
                onToggleBrowserPause={handleToggleBrowserPause}
                isSpeakingBrowser={isSpeakingBrowser}
                isBrowserPaused={isBrowserPaused}
                isDailyQuotaReached={isDailyQuotaReached}
                synthesisMode={synthesisMode}
                onChangeSynthesisMode={(mode) => setSynthesisMode(mode)}
                onToggleSynthesisMode={() =>
                  setSynthesisMode((prev) => (prev === 'gemini' ? 'browser' : 'gemini'))
                }
                onOpenApiKeyModal={() => {
                  setApiKeyModalTab('gemini');
                  setIsApiKeyModalOpen(true);
                }}
                hasCustomApiKey={!!customApiKey}
                hasCustomYandexKey={!!yandexApiKey}
                activePrompt={customPrompt}
              />
            ) : (
              <ParagraphsViewer
                text={text}
                onVoiceParagraph={(pText) => handleSynthesize(pText)}
                isSynthesizing={isSynthesizing}
              />
            )}
          </div>

          {/* Right column: Delivery Instruction (Prompt) & Voice Library */}
          <div className="lg:col-span-5 space-y-4">
            {/* Custom Delivery Prompt Instruction with "Применить промпт" button */}
            <VoicePromptInstruction
              currentPrompt={customPrompt}
              onApplyPrompt={(newPrompt) => setCustomPrompt(newPrompt)}
              selectedPreset={preset}
              onSelectPreset={handleSelectPreset}
              onSynthesizeNow={(promptToUse) => handleSynthesize(undefined, undefined, promptToUse)}
              isSynthesizing={isSynthesizing}
            />

            <VoiceSelector
              selectedVoice={voice}
              onSelectVoice={(vId) => {
                setVoice(vId);
                if (vId.startsWith('yandex-')) {
                  setSynthesisMode('yandex');
                } else if (synthesisMode === 'yandex') {
                  setSynthesisMode('gemini');
                }
              }}
            />

            {/* Quality and acoustic specifications callout */}
            <div className="bg-stone-900/50 border border-stone-800/80 rounded-2xl p-4 text-xs text-stone-400 space-y-2">
              <div className="flex items-center gap-2 text-stone-200 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Студийные параметры синтеза
              </div>
              <p className="leading-relaxed">
                Поддерживаются два передовых движка: <strong>Google Gemini TTS</strong> (нейросеть с контекстными промптами) и <strong>Яндекс.SpeechKit</strong> (эталонные русские дикторы без суточных квот).
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-stone-800 text-[11px] text-stone-500">
                <span>Форматы: WAV (студийный) / MP3</span>
                <span>Частота: 24 000 / 48 000 Гц</span>
                <span>Движки: Gemini + Яндекс</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Voice Analyzer & Audio Comparison Section (Moved down) */}
        <div className="pt-2">
          <VoiceAnalyzerSection
            analysis={voiceAnalysis}
            onApplyAnalysis={handleApplyAnalysis}
            onSynthesizeWithVoice={handleSynthesizeWithVoice}
            onAnalysisSuccess={handleAnalysisSuccess}
            selectedVoice={voice}
            isSynthesizing={isSynthesizing}
            customApiKey={customApiKey}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-900 py-5 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Студия дикторской озвучки · Gemini TTS & Яндекс.SpeechKit</span>
          <span>Готовая аудиодорожка доступна для скачивания в форматах WAV и MP3</span>
        </div>
      </footer>

      {/* Api Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentApiKey={customApiKey}
        onSaveApiKey={handleSaveApiKey}
        onClearApiKey={handleClearApiKey}
        currentYandexKey={yandexApiKey}
        currentYandexFolderId={yandexFolderId}
        onSaveYandexKey={handleSaveYandexKey}
        onClearYandexKey={handleClearYandexKey}
        initialTab={apiKeyModalTab}
      />
    </div>
  );
}
