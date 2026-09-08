import React, { useState } from 'react';
import { VOICES, YANDEX_VOICES } from '../data/defaults';
import { VoiceOption } from '../types';
import { Check, Sparkles, User, Search } from 'lucide-react';

interface Props {
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  onQuickSampleSynthesize?: (voiceId: string) => void;
}

export const VoiceSelector: React.FC<Props> = ({
  selectedVoice,
  onSelectVoice,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'all' | 'gemini' | 'yandex'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allCombinedVoices: VoiceOption[] = [...VOICES, ...YANDEX_VOICES];

  const categories = [
    { id: 'all', label: 'Все стили' },
    { id: 'documentary', label: 'Документальные' },
    { id: 'narrative', label: 'Повествование' },
    { id: 'conversational', label: 'Диалог и юмор' },
    { id: 'warm', label: 'Тёплые и тихие' },
    { id: 'dramatic', label: 'Драматические' },
  ];

  const filteredVoices = allCombinedVoices.filter((v) => {
    const matchesProvider =
      selectedProvider === 'all' ||
      (selectedProvider === 'yandex' ? v.provider === 'yandex' : v.provider !== 'yandex');
    const matchesCat = selectedCategory === 'all' || v.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.tone && v.tone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.tags && v.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesProvider && matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-5 bg-stone-900/80 border border-stone-800 rounded-2xl p-5 text-stone-100 shadow-lg">
      <div>
        {/* Header like ElevenLabs Voice Library */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
          <div>
            <label className="text-sm sm:text-base font-bold text-stone-100 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              Каталог нейросетевых голосов (Voice Library)
            </label>
            <p className="text-xs text-stone-400 mt-0.5">
              Выберите диктора в стиле ElevenLabs под задачу: документалистика, хроника, диалог или драма
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-stone-400 bg-stone-950 px-2.5 py-1 rounded-md border border-stone-800">
              {filteredVoices.length} {filteredVoices.length === 1 ? 'голос' : 'голосов'}
            </span>
          </div>
        </div>

        {/* Provider Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-stone-400 font-medium mr-1">Движок:</span>
          <button
            type="button"
            onClick={() => setSelectedProvider('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              selectedProvider === 'all'
                ? 'bg-stone-800 text-white border-stone-600'
                : 'bg-stone-950/60 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            Все ({allCombinedVoices.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedProvider('gemini')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
              selectedProvider === 'gemini'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                : 'bg-stone-950/60 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Google Gemini ({VOICES.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedProvider('yandex')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
              selectedProvider === 'yandex'
                ? 'bg-red-500/20 text-red-300 border-red-500/60'
                : 'bg-stone-950/60 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            <span className="font-bold text-[10px] text-red-400">Я</span>
            <span>Яндекс.SpeechKit ({YANDEX_VOICES.length})</span>
          </button>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по тембру, стилю, тегам (баритон, хроника, драма)..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-stone-950/90 border border-stone-800 text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                    active
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ElevenLabs-style Voice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredVoices.map((v) => {
            const isSelected = selectedVoice === v.id;
            return (
              <div
                key={v.id}
                onClick={() => onSelectVoice(v.id)}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : 'bg-stone-950/70 border-stone-800 hover:border-stone-700 hover:bg-stone-950'
                }`}
              >
                {v.recommended && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500 text-stone-950 shadow-sm flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Совпадает с аудиообразцом
                  </span>
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-stone-100">{v.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                        {v.gender === 'male' ? 'Мужской' : v.gender === 'female' ? 'Женский' : 'Нейтральный'}
                      </span>
                      {v.provider === 'yandex' ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-800/60">
                          Яндекс
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50">
                          Gemini
                        </span>
                      )}
                    </div>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-stone-950 shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-stone-700 hover:border-stone-500 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed mb-2.5">
                    {v.description}
                  </p>
                </div>

                {/* Badges and Tags row */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-800/60 mt-auto">
                  {v.tone && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-amber-400/90 font-medium">
                      {v.tone}
                    </span>
                  )}
                  {v.tags?.slice(0, 2).map((t, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-stone-900/80 text-stone-400 border border-stone-800/80">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
