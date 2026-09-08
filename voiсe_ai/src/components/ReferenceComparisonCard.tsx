import React, { useState, useRef } from 'react';
import { Volume2, CheckCircle2, Mic2, Play, Pause, Sparkles, Sliders } from 'lucide-react';
import { REFERENCE_AUDIO_TEXT } from '../data/defaults';

interface Props {
  onSelectRecommended: () => void;
}

export const ReferenceComparisonCard: React.FC<Props> = ({ onSelectRecommended }) => {
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const togglePlayReference = () => {
    if (isPlayingReference) {
      window.speechSynthesis.cancel();
      setIsPlayingReference(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Синтез речи не поддерживается браузером.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(REFERENCE_AUDIO_TEXT);
    utterance.lang = 'ru-RU';
    utterance.pitch = 0.82; // deeper pitch to match deep male baritone
    utterance.rate = 0.88; // measured tempo

    // Try to find Russian voice
    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find((v) => v.lang.startsWith('ru') && /male|dmitry|pavel|yuri/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith('ru'));
    if (ruVoice) {
      utterance.voice = ruVoice;
    }

    utterance.onend = () => setIsPlayingReference(false);
    utterance.onerror = () => setIsPlayingReference(false);

    synthRef.current = utterance;
    setIsPlayingReference(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-stone-900/90 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm text-stone-100 relative overflow-hidden">
      {/* Subtle warm acoustic glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                Анализ присланного голоса
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Профиль подобран: Charon
              </span>
            </div>
            <p className="text-stone-400 text-sm mt-1 leading-relaxed max-w-2xl">
              На основе вашего аудиофайла распознан <strong>глубокий мужской баритон</strong> с размеренной
              документальной подачей, теплыми грудными резонансами и проникновенной эмоциональной интонацией.
            </p>
          </div>
        </div>

        <button
          onClick={onSelectRecommended}
          className="self-start md:self-center px-4 py-2 text-xs sm:text-sm font-medium rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Применить настройки под образец
        </button>
      </div>

      {/* Reference sample excerpt box */}
      <div className="mt-4 pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-950/60 rounded-xl p-3.5 border border-stone-800/80">
        <div className="flex items-start gap-2.5 min-w-0">
          <Volume2 className="w-4 h-4 text-amber-400/80 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm text-stone-300 italic truncate sm:whitespace-normal">
            {REFERENCE_AUDIO_TEXT}
          </div>
        </div>

        <button
          onClick={togglePlayReference}
          className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 border border-stone-700/80"
          title="Прослушать контрольную фразу из примера"
        >
          {isPlayingReference ? (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>Остановить образец</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Слушать фразу из примера</span>
            </>
          )}
        </button>
      </div>

      {/* Voice specs grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 text-xs">
        <div className="bg-stone-950/50 p-2.5 rounded-lg border border-stone-800/60">
          <div className="text-stone-500 font-medium">Тембр голоса</div>
          <div className="text-stone-200 font-semibold mt-0.5">Низкий мужской баритон</div>
        </div>
        <div className="bg-stone-950/50 p-2.5 rounded-lg border border-stone-800/60">
          <div className="text-stone-500 font-medium">Стиль подачи</div>
          <div className="text-stone-200 font-semibold mt-0.5">Документальная хроника</div>
        </div>
        <div className="bg-stone-950/50 p-2.5 rounded-lg border border-stone-800/60">
          <div className="text-stone-500 font-medium">Темп речи</div>
          <div className="text-stone-200 font-semibold mt-0.5">Размеренный (~115 сл/мин)</div>
        </div>
        <div className="bg-stone-950/50 p-2.5 rounded-lg border border-stone-800/60">
          <div className="text-stone-500 font-medium">Акустика</div>
          <div className="text-stone-200 font-semibold mt-0.5">Студийный сухой звук 24 kHz</div>
        </div>
      </div>
    </div>
  );
};
