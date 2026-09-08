import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, AlertCircle, ExternalLink, X, Trash2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string;
  onSaveApiKey: (key: string) => void;
  onClearApiKey: () => void;
  currentYandexKey?: string;
  currentYandexFolderId?: string;
  onSaveYandexKey?: (key: string, folderId: string) => void;
  onClearYandexKey?: () => void;
  initialTab?: 'gemini' | 'yandex';
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentApiKey,
  onSaveApiKey,
  onClearApiKey,
  currentYandexKey = '',
  currentYandexFolderId = '',
  onSaveYandexKey,
  onClearYandexKey,
  initialTab = 'gemini',
}) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'yandex'>(initialTab);

  // Gemini state
  const [keyInput, setKeyInput] = useState(currentApiKey);
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  // Yandex state
  const [yandexKeyInput, setYandexKeyInput] = useState(currentYandexKey);
  const [yandexFolderInput, setYandexFolderInput] = useState(currentYandexFolderId);
  const [showYandexPassword, setShowYandexPassword] = useState(false);
  const [isValidatingYandex, setIsValidatingYandex] = useState(false);
  const [yandexValidationResult, setYandexValidationResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  useEffect(() => {
    setKeyInput(currentApiKey);
    setValidationResult({ status: 'idle' });
    setYandexKeyInput(currentYandexKey);
    setYandexFolderInput(currentYandexFolderId);
    setYandexValidationResult({ status: 'idle' });
  }, [currentApiKey, currentYandexKey, currentYandexFolderId, isOpen]);

  if (!isOpen) return null;

  const handleValidateGemini = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setValidationResult({
        status: 'error',
        message: 'Пожалуйста, введите API ключ Google Gemini для проверки.',
      });
      return;
    }

    setIsValidating(true);
    setValidationResult({ status: 'idle' });

    try {
      const res = await fetch('/api/tts/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': trimmed,
        },
        body: JSON.stringify({ customApiKey: trimmed }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setValidationResult({
          status: 'success',
          message: 'API-ключ действителен! Модели Gemini активны и готовы к генерации.',
        });
      } else {
        setValidationResult({
          status: 'error',
          message: data.error || 'Ключ отклонён Google AI API. Проверьте правильность строки.',
        });
      }
    } catch (err: any) {
      setValidationResult({
        status: 'error',
        message: `Ошибка проверки соединения: ${err?.message || 'Сервер недоступен'}`,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidateYandex = async () => {
    const trimmedKey = yandexKeyInput.trim();
    const trimmedFolder = yandexFolderInput.trim();
    if (!trimmedKey) {
      setYandexValidationResult({
        status: 'error',
        message: 'Пожалуйста, введите API-ключ Яндекс.Cloud (начинается с AQVN...).',
      });
      return;
    }

    setIsValidatingYandex(true);
    setYandexValidationResult({ status: 'idle' });

    try {
      const res = await fetch('/api/yandex/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-yandex-api-key': trimmedKey,
          'x-yandex-folder-id': trimmedFolder,
        },
        body: JSON.stringify({ yandexApiKey: trimmedKey, yandexFolderId: trimmedFolder }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setYandexValidationResult({
          status: 'success',
          message: 'API-ключ Яндекс.SpeechKit успешно подтверждён! Синтез готов к работе.',
        });
      } else {
        setYandexValidationResult({
          status: 'error',
          message: data.error || 'Не удалось авторизоваться в Яндекс.Cloud. Проверьте ключ и каталог.',
        });
      }
    } catch (err: any) {
      setYandexValidationResult({
        status: 'error',
        message: `Ошибка проверки: ${err?.message || 'Сервер недоступен'}`,
      });
    } finally {
      setIsValidatingYandex(false);
    }
  };

  const handleSaveAll = () => {
    // Save Gemini
    const trimmedGemini = keyInput.trim();
    if (!trimmedGemini) {
      onClearApiKey();
    } else {
      onSaveApiKey(trimmedGemini);
    }

    // Save Yandex
    if (onSaveYandexKey) {
      const trimmedYandexKey = yandexKeyInput.trim();
      const trimmedYandexFolder = yandexFolderInput.trim();
      if (!trimmedYandexKey) {
        onClearYandexKey?.();
      } else {
        onSaveYandexKey(trimmedYandexKey, trimmedYandexFolder);
      }
    }

    onClose();
  };

  const handleClear = () => {
    setKeyInput('');
    setValidationResult({ status: 'idle' });
    onClearApiKey();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-stone-100 relative space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Engine Tabs */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Подключение своих API ключей
                </h2>
                <p className="text-xs text-stone-400">
                  Снятие лимитов запросов и студийные дикторы
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Provider Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-950 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => setActiveTab('gemini')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'gemini'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Gemini API</span>
              {currentApiKey && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('yandex')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'yandex'
                  ? 'bg-red-500 text-white shadow-md font-bold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <span className="font-bold text-[11px] px-1 py-0.5 rounded bg-red-600/40 text-red-200 border border-red-500/50">Я</span>
              <span>Яндекс.SpeechKit</span>
              {currentYandexKey && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
            </button>
          </div>
        </div>

        {/* TAB 1: GOOGLE GEMINI */}
        {activeTab === 'gemini' && (
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 text-xs text-stone-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <ShieldCheck className="w-4 h-4" />
                <span>Зачем указывать ключ Gemini?</span>
              </div>
              <p className="leading-relaxed text-stone-400">
                Бесплатный общий сервер имеет лимит 10 озвучек в сутки. Персональный API-ключ Google AI Studio даёт собственную квоту. Если в Google AI Studio привязан платежный аккаунт (Pay-as-you-go), лимиты расширяются до 1000+ запросов в минуту.
              </p>
            </div>

            {/* Input field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                <span>Google AI Studio API Key:</span>
                {currentApiKey && (
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Сохранён
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    setValidationResult({ status: 'idle' });
                  }}
                  placeholder="AIzaSy..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 pr-20 text-sm font-mono text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
                    title={showPassword ? 'Скрыть' : 'Показать'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Validation Result Notice */}
            {validationResult.status === 'success' && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{validationResult.message}</span>
              </div>
            )}

            {validationResult.status === 'error' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{validationResult.message}</span>
              </div>
            )}

            {/* Guide */}
            <div className="pt-2 border-t border-stone-800 text-xs text-stone-400 space-y-1.5">
              <span className="font-semibold text-stone-300">Как получить ключ Gemini бесплатно:</span>
              <ol className="list-decimal list-inside space-y-1 text-stone-400">
                <li>
                  Перейдите в{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Google AI Studio API Keys <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Войдите в аккаунт Google и нажмите «Create API key»</li>
                <li>Скопируйте ключ и вставьте в поле выше</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 2: YANDEX SPEECHKIT */}
        {activeTab === 'yandex' && (
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 text-xs text-stone-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-red-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Преимущества Яндекс.SpeechKit</span>
              </div>
              <p className="leading-relaxed text-stone-400">
                Студийный синтез русской речи с легендарными дикторами (Филипп, Ермил, Захар, Антон). Не имеет суточных квот, идеально ставит смысловые ударения в военных хрониках и аудиокнигах.
              </p>
            </div>

            {/* Yandex API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                <span>API-ключ сервисного аккаунта Yandex Cloud:</span>
                {currentYandexKey && (
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Сохранён
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showYandexPassword ? 'text' : 'password'}
                  value={yandexKeyInput}
                  onChange={(e) => {
                    setYandexKeyInput(e.target.value);
                    setYandexValidationResult({ status: 'idle' });
                  }}
                  placeholder="AQVN..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 pr-20 text-sm font-mono text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/60 transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowYandexPassword(!showYandexPassword)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
                    title={showYandexPassword ? 'Скрыть' : 'Показать'}
                  >
                    {showYandexPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Yandex Folder ID (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                <span>Идентификатор каталога (Folder ID, опционально):</span>
                <span className="text-[11px] text-stone-500">например b1g...</span>
              </label>
              <input
                type="text"
                value={yandexFolderInput}
                onChange={(e) => {
                  setYandexFolderInput(e.target.value);
                  setYandexValidationResult({ status: 'idle' });
                }}
                placeholder="b1g123456789abcdef..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/60 transition-all"
              />
            </div>

            {/* Validation Notice */}
            {yandexValidationResult.status === 'success' && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{yandexValidationResult.message}</span>
              </div>
            )}

            {yandexValidationResult.status === 'error' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{yandexValidationResult.message}</span>
              </div>
            )}

            {/* Guide */}
            <div className="pt-2 border-t border-stone-800 text-xs text-stone-400 space-y-1.5">
              <span className="font-semibold text-stone-300">Как получить ключ Яндекс.SpeechKit:</span>
              <ol className="list-decimal list-inside space-y-1 text-stone-400">
                <li>
                  Зайдите в консоль{' '}
                  <a
                    href="https://console.cloud.yandex.ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Yandex Cloud Console <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Создайте сервисный аккаунт с ролью <code className="text-stone-200 bg-stone-800 px-1 py-0.5 rounded">ai.speechkit-tts.user</code></li>
                <li>Создайте для него API-ключ (начинается с <code className="text-stone-200">AQVN...</code>) и вставьте его выше.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-800">
          <div>
            {activeTab === 'gemini' && currentApiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Сбросить ключ Gemini
              </button>
            )}
            {activeTab === 'yandex' && currentYandexKey && (
              <button
                type="button"
                onClick={() => {
                  setYandexKeyInput('');
                  setYandexFolderInput('');
                  setYandexValidationResult({ status: 'idle' });
                  onClearYandexKey?.();
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Удалить ключ Яндекс
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'gemini' ? (
              <button
                type="button"
                onClick={handleValidateGemini}
                disabled={isValidating || !keyInput.trim()}
                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Проверка...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Проверить Gemini</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleValidateYandex}
                disabled={isValidatingYandex || !yandexKeyInput.trim()}
                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isValidatingYandex ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                    <span>Проверка...</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-[10px] text-red-400">Я</span>
                    <span>Проверить Яндекс</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAll}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Сохранить настройки
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
