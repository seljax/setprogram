import React, { useState, useEffect } from 'react';
import {
  MessageSquareQuote,
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  HelpCircle,
  Volume2,
  Wand2,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { STYLE_PRESETS } from '../data/defaults';

interface VoicePromptInstructionProps {
  currentPrompt: string;
  onApplyPrompt: (newPrompt: string) => void;
  selectedPreset?: string;
  onSelectPreset?: (presetId: string) => void;
  onSynthesizeNow?: (promptToUse?: string) => void;
  isSynthesizing?: boolean;
}

// Quick modifier tags that users can click to enrich their delivery instructions
const QUICK_TAGS = [
  { label: '🎙️ Низкий бархатный баритон', text: 'Глубоким, бархатным баритоном с тёплым грудным резонансом' },
  { label: '⏱️ С выразительными паузами', text: 'Делай вдумчивые смысловые паузы между фразами, не спеши' },
  { label: '🎞️ Документальная хроника', text: 'В манере сдержанного диктора исторической военной хроники' },
  { label: '🤫 Сокровенный монолог', text: 'Приглушённым, доверительным тоном со вздохом и искренним сопереживанием' },
  { label: '⚡ Напряжённый репортаж', text: 'Энергично, с чеканной артикуляцией и драматическим напряжением' },
  { label: '📖 Классический диктор аудиокниг', text: 'Выразительное литературное чтение с живыми интонациями диалогов' },
  { label: '🍂 Лёгкая хрипотца', text: 'С лёгкой благородной хрипотцой и уставшим, мудрым спокойствием' },
  { label: '🙂 Тёплая добрая ирония', text: 'С мягкой, доброй улыбкой в голосе при чтении шутливых строк' },
];

export const VoicePromptInstruction: React.FC<VoicePromptInstructionProps> = ({
  currentPrompt,
  onApplyPrompt,
  selectedPreset,
  onSelectPreset,
  onSynthesizeNow,
  isSynthesizing = false,
}) => {
  const [draftPrompt, setDraftPrompt] = useState<string>(currentPrompt);
  const [justApplied, setJustApplied] = useState<boolean>(false);
  const [showTips, setShowTips] = useState<boolean>(false);

  // Sync with external changes (e.g., when preset or audio analysis changes)
  useEffect(() => {
    setDraftPrompt(currentPrompt);
  }, [currentPrompt]);

  const hasUnappliedChanges = draftPrompt.trim() !== currentPrompt.trim();

  const handleApply = () => {
    const trimmed = draftPrompt.trim();
    onApplyPrompt(trimmed);
    setJustApplied(true);
    setTimeout(() => {
      setJustApplied(false);
    }, 3000);
  };

  const handleApplyAndSynthesize = () => {
    const trimmed = draftPrompt.trim();
    onApplyPrompt(trimmed);
    setJustApplied(true);
    if (onSynthesizeNow) {
      onSynthesizeNow(trimmed);
    }
  };

  const handleAppendTag = (tagText: string) => {
    setDraftPrompt((prev) => {
      const current = prev.trim();
      if (!current) {
        return tagText;
      }
      // If already contains this snippet, do not duplicate
      if (current.toLowerCase().includes(tagText.toLowerCase())) {
        return current;
      }
      // Append neatly with comma or sentence break
      const separator = current.endsWith('.') || current.endsWith(';') ? ' ' : ', ';
      return `${current}${separator}${tagText}`;
    });
  };

  const handleResetToDefault = () => {
    const defaultP = STYLE_PRESETS[0].prompt;
    setDraftPrompt(defaultP);
    onApplyPrompt(defaultP);
    if (onSelectPreset) {
      onSelectPreset(STYLE_PRESETS[0].id);
    }
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  };

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 text-stone-100 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-stone-100">
                Инструкция подачи для нейросети (Промпт)
              </h3>
              {justApplied ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3 h-3" /> Применено
                </span>
              ) : hasUnappliedChanges ? (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Есть изменения (нажмите «Применить»)
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700">
                  Активен
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
              Опишите своими словами, как нейросеть должна прочитать текст: тембр, эмоции, паузы, интонацию и дыхание
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
          title="Подсказки по составлению промпта"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Helper Tips (Collapsible) */}
      {showTips && (
        <div className="p-3 rounded-xl bg-stone-950/80 border border-amber-500/20 text-xs text-stone-300 space-y-1.5 animate-in fade-in">
          <div className="font-semibold text-amber-400 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5" />
            Как составить эффективный промпт для голоса:
          </div>
          <ul className="list-disc list-inside space-y-1 text-stone-400 leading-relaxed pl-1">
            <li><strong>Тембр и регистр:</strong> «глубокий мужской баритон», «мягкий грудной голос», «хриплый бас».</li>
            <li><strong>Темп и паузы:</strong> «размеренно, выдерживая паузы после важных слов», «динамично».</li>
            <li><strong>Эмоциональный контекст:</strong> «военная драма, сдержанная боль воспоминаний», «с тёплой ностальгией».</li>
            <li><strong>Подача прямой речи:</strong> «передавай юмор персонажа с улыбкой в голосе».</li>
          </ul>
        </div>
      )}

      {/* Preset Style Buttons */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span className="flex items-center gap-1 font-medium text-stone-300">
            <Sliders className="w-3.5 h-3.5 text-amber-400" /> Готовые стили подачи:
          </span>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-[11px] text-stone-500 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> По умолчанию
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STYLE_PRESETS.map((p) => {
            const isSelected = selectedPreset === p.id && draftPrompt === p.prompt;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setDraftPrompt(p.prompt);
                  if (onSelectPreset) onSelectPreset(p.id);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                    : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="font-semibold text-xs text-stone-200 mb-0.5 flex items-center justify-between">
                  <span>{p.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                </div>
                <div className="text-[11px] text-stone-400 line-clamp-2 leading-tight">
                  {p.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt Textarea */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            rows={3}
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            placeholder="Опишите желаемую манеру: например, 'Глубоким, размеренным мужским голосом рассказчика в документальном стиле, с выверенными паузами и тёплым грудным тембром...'"
            className={`w-full p-3.5 rounded-xl bg-stone-950 border text-xs sm:text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none transition-all resize-y leading-relaxed font-sans ${
              hasUnappliedChanges
                ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                : 'border-stone-800 focus:border-amber-500/50'
            }`}
          />
          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
            <span className="text-[10px] font-mono text-stone-600 bg-stone-900/80 px-1.5 py-0.5 rounded border border-stone-800">
              {draftPrompt.length} симв.
            </span>
          </div>
        </div>

        {/* Quick Modifier Chips */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-stone-400 flex items-center gap-1">
            <Tag className="w-3 h-3 text-amber-400" />
            <span>Добавить параметры кликом:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {QUICK_TAGS.map((tag, idx) => {
              const isIncluded = draftPrompt.toLowerCase().includes(tag.text.toLowerCase());
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAppendTag(tag.text)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    isIncluded
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-medium'
                      : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 hover:bg-stone-900'
                  }`}
                >
                  <span>{tag.label}</span>
                  {isIncluded && <Check className="w-2.5 h-2.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons: "Применить промпт" (Requested) + Quick Synthesize */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-800">
        <div className="text-xs text-stone-400 flex items-center gap-1.5">
          {hasUnappliedChanges ? (
            <span className="text-amber-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Промпт изменён, нажмите кнопку справа
            </span>
          ) : (
            <span className="text-stone-500 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Текущий промпт передаётся нейросети при каждой озвучке
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Main Requested Button: "Применить промпт" */}
          <button
            type="button"
            onClick={handleApply}
            disabled={!draftPrompt.trim()}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              justApplied
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : hasUnappliedChanges
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-500/20'
                : 'bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700'
            }`}
          >
            {justApplied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Промпт применён!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>Применить промпт</span>
              </>
            )}
          </button>

          {/* Quick Apply & Generate Voice Button */}
          {onSynthesizeNow && (
            <button
              type="button"
              onClick={handleApplyAndSynthesize}
              disabled={isSynthesizing || !draftPrompt.trim()}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-stone-800 hover:bg-stone-750 text-amber-300 border border-amber-500/40 hover:border-amber-500/70 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Применить данный промпт и сразу запустить озвучивание текста"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Озвучить с этим промптом</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
