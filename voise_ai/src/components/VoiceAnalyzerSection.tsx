import React, { useState, useRef } from 'react';
import {
  Upload,
  Mic,
  Music,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  FileAudio,
  Sliders,
  AlertCircle,
  HelpCircle,
  Volume2
} from 'lucide-react';
import { VoiceAnalysisResult } from '../types';

interface Props {
  analysis: VoiceAnalysisResult;
  onApplyAnalysis: (recommendedVoice: string, recommendedPrompt: string) => void;
  onSynthesizeWithVoice: (recommendedVoice: string, recommendedPrompt: string) => void;
  onAnalysisSuccess: (analysis: VoiceAnalysisResult, audioUrl?: string, fileName?: string) => void;
  selectedVoice: string;
  isSynthesizing?: boolean;
  customApiKey?: string;
}

export const VoiceAnalyzerSection: React.FC<Props> = ({
  analysis,
  onApplyAnalysis,
  onSynthesizeWithVoice,
  onAnalysisSuccess,
  selectedVoice,
  isSynthesizing = false,
  customApiKey,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [sampleAudioUrl, setSampleAudioUrl] = useState<string | null>(null);
  const [sampleFileName, setSampleFileName] = useState<string>('sample_speech.mp3 (образец из запроса)');
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(wav|mp3|ogg|m4a|aac|flac)$/i)) {
      setError('Пожалуйста, выберите аудиофайл (.wav, .mp3, .ogg, .m4a, .flac)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Размер аудиофайла не должен превышать 20 МБ');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setSampleFileName(file.name);

    // Create local preview URL
    const localUrl = URL.createObjectURL(file);
    setSampleAudioUrl(localUrl);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (customApiKey) {
            headers['x-gemini-api-key'] = customApiKey;
          }

          const res = await fetch('/api/tts/analyze-voice', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              audioData: base64Data,
              mimeType: file.type || 'audio/wav',
              fileName: file.name,
              customApiKey: customApiKey || undefined,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || data.error || 'Не удалось проанализировать аудиофайл.');
          }

          if (data.analysis) {
            onAnalysisSuccess(data.analysis, localUrl, file.name);
          }
        } catch (serverErr: any) {
          console.error('Server analysis error:', serverErr);
          setError(serverErr.message || 'Ошибка связи с сервером при анализе голоса.');
        } finally {
          setIsAnalyzing(false);
        }
      };

      reader.onerror = () => {
        setIsAnalyzing(false);
        setError('Не удалось прочитать файл на устройстве.');
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsAnalyzing(false);
      setError(err.message || 'Ошибка при обработке файла');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const togglePlaySample = () => {
    if (!sampleAudioRef.current) return;
    if (isPlayingSample) {
      sampleAudioRef.current.pause();
      setIsPlayingSample(false);
    } else {
      sampleAudioRef.current.play().catch(console.warn);
      setIsPlayingSample(true);
    }
  };

  return (
    <div className="bg-stone-900/90 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm text-stone-100 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-800/80">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Анализ голоса и подбор профиля нейросети
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Активный профиль: {analysis.recommendedVoice}
              </span>
            </div>
            <p className="text-stone-400 text-xs sm:text-sm mt-1 leading-relaxed max-w-2xl">
              Загрузите аудиозапись с любым образцом речи. Gemini проанализирует тембр, частоту, темп и эмоции, подберёт нейросетевой дикторский профиль и настроит параметры синтеза.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
          <button
            onClick={() => onApplyAnalysis(analysis.recommendedVoice, analysis.recommendedPrompt)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Загрузить параметры этого голоса в редактор"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Выбрать в редакторе
          </button>

          <button
            onClick={() => onSynthesizeWithVoice(analysis.recommendedVoice, analysis.recommendedPrompt)}
            disabled={isSynthesizing}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSynthesizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Генерация озвучки...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-stone-950" />
                <span>Применить этот голос на текст</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Zone & Live Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        {/* Left: Drag & Drop upload zone */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] ${
              dragOver
                ? 'border-amber-400 bg-amber-500/10 scale-[0.99]'
                : isAnalyzing
                ? 'border-amber-500/50 bg-stone-950/60'
                : 'border-stone-700/80 hover:border-amber-500/50 bg-stone-950/40 hover:bg-stone-950/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.wav,.mp3,.ogg,.m4a,.flac"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                <div className="text-sm font-medium text-stone-200">Нейросеть слушает и анализирует голос...</div>
                <div className="text-xs text-stone-400">Определение спектра частот, тембра и интонации</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-stone-200 hover:text-amber-300">
                    Перетащите аудиофайл с голосом
                  </span>
                  <span className="text-xs text-stone-400 block mt-0.5">
                    или нажмите для выбора (MP3, WAV, M4A, OGG)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-stone-400 bg-stone-900 px-2.5 py-1 rounded-md border border-stone-800">
                  до 20 МБ
                </span>
              </div>
            )}
          </div>

          {/* Sample audio player bar if sample is available */}
          {sampleAudioUrl && (
            <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileAudio className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-stone-300 truncate font-mono">
                  {sampleFileName}
                </span>
              </div>

              <button
                onClick={togglePlaySample}
                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                {isPlayingSample ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    <span>Пауза</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>Слушать</span>
                  </>
                )}
              </button>

              <audio
                ref={sampleAudioRef}
                src={sampleAudioUrl}
                onEnded={() => setIsPlayingSample(false)}
                onPause={() => setIsPlayingSample(false)}
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right: Detailed acoustic specifications */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          {/* Analysis cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80">
              <div className="text-stone-400 font-medium">Тембр голоса</div>
              <div className="text-stone-100 font-semibold mt-1 truncate" title={analysis.timbre}>
                {analysis.timbre}
              </div>
            </div>

            <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80">
              <div className="text-stone-400 font-medium">Темп речи</div>
              <div className="text-stone-100 font-semibold mt-1 truncate" title={analysis.tempo}>
                {analysis.tempo}
              </div>
            </div>

            <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80">
              <div className="text-stone-400 font-medium">Эмоциональный тон</div>
              <div className="text-stone-100 font-semibold mt-1 truncate" title={analysis.emotion}>
                {analysis.emotion}
              </div>
            </div>

            <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80">
              <div className="text-stone-400 font-medium">Регистр / Высота</div>
              <div className="text-stone-100 font-semibold mt-1 truncate" title={analysis.pitchDescription}>
                {analysis.pitchDescription}
              </div>
            </div>
          </div>

          {/* Expert acoustic conclusion */}
          <div className="bg-stone-950/70 border border-stone-800/90 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300/90 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Экспертное заключение нейросети:
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                Точность совпадения: {analysis.confidence || 95}%
              </span>
            </div>
            <p className="text-stone-300 leading-relaxed text-xs sm:text-sm">
              {analysis.explanation}
            </p>
          </div>

          {/* Suggested Style Prompt Box */}
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <span className="text-stone-400 block text-[11px] mb-0.5">
                Сгенерированная инструкция для нейросети (Style Prompt):
              </span>
              <span className="text-amber-200 font-mono italic line-clamp-1 block">
                «{analysis.recommendedPrompt}»
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onApplyAnalysis(analysis.recommendedVoice, analysis.recommendedPrompt)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium whitespace-nowrap transition-colors cursor-pointer text-xs"
              >
                Вставить в поле
              </button>
              <button
                onClick={() => onSynthesizeWithVoice(analysis.recommendedVoice, analysis.recommendedPrompt)}
                disabled={isSynthesizing}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold whitespace-nowrap transition-colors cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Volume2 className="w-3.5 h-3.5 text-stone-950" />
                Озвучить текст этим голосом
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
