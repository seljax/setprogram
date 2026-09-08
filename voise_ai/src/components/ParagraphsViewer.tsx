import React, { useState } from 'react';
import { Play, Pause, Volume2, Sparkles, BookOpen } from 'lucide-react';

interface Props {
  text: string;
  onVoiceParagraph: (paragraphText: string) => void;
  isSynthesizing: boolean;
}

export const ParagraphsViewer: React.FC<Props> = ({
  text,
  onVoiceParagraph,
  isSynthesizing,
}) => {
  const [localPlayingIndex, setLocalPlayingIndex] = useState<number | null>(null);

  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const playBrowserSpeech = (pText: string, index: number) => {
    if (localPlayingIndex === index) {
      window.speechSynthesis.cancel();
      setLocalPlayingIndex(null);
      return;
    }

    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(pText);
    utterance.lang = 'ru-RU';
    utterance.pitch = 0.85;
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find((v) => v.lang.startsWith('ru'));
    if (ruVoice) utterance.voice = ruVoice;

    utterance.onend = () => setLocalPlayingIndex(null);
    utterance.onerror = () => setLocalPlayingIndex(null);

    setLocalPlayingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-5 text-stone-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          Разбивка текста по фрагментам и репликам ({paragraphs.length})
        </h3>
        <span className="text-xs text-stone-500">Можно озвучивать фрагменты по отдельности</span>
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
        {paragraphs.map((para, idx) => {
          const isDialogue = para.startsWith('«') || para.startsWith('-') || para.startsWith('—');
          const isPlayingThis = localPlayingIndex === idx;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                isDialogue
                  ? 'bg-stone-950/70 border-amber-500/20'
                  : 'bg-stone-950/40 border-stone-800/80'
              } hover:border-stone-700`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs text-stone-300 leading-relaxed font-sans flex-1">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-stone-500 bg-stone-900 mr-2">
                    #{idx + 1}
                  </span>
                  {para}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onVoiceParagraph(para)}
                    disabled={isSynthesizing}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-500/20 hover:text-amber-300 text-stone-400 text-xs transition-colors border border-stone-700/60 disabled:opacity-40"
                    title="Синтезировать нейросетью этот фрагмент"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => playBrowserSpeech(para, idx)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors border border-stone-700/60"
                    title="Быстрое прослушивание браузером"
                  >
                    {isPlayingThis ? (
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
