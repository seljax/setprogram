import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Download, Volume2, VolumeX, FastForward, Rewind, Sparkles } from 'lucide-react';

interface Props {
  audioUrl: string | null;
  duration?: number;
  voiceName?: string;
  isGenerating?: boolean;
}

export const AudioPlayerControls: React.FC<Props> = ({
  audioUrl,
  duration = 0,
  voiceName = 'Charon',
  isGenerating = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      setTotalDuration(duration);
    }
  }, [duration]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Audio play error:', e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setTotalDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const seekRelative = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(totalDuration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.8, 0.9, 1.0, 1.1, 1.25];

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-2xl text-stone-100 relative">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleTimeUpdate}
        />
      )}

      {/* Top info bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-800/80 text-xs text-stone-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-stone-200">
            {audioUrl ? `Готовая дорожка (${voiceName})` : 'Ожидание аудиозаписи'}
          </span>
          <span className="text-stone-500">· 24 000 Hz Studio</span>
        </div>

        {audioUrl && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-stone-400 text-[11px] font-medium hidden md:inline">Скачать:</span>
            
            {/* MP3 Download button */}
            <a
              href={`${audioUrl}?format=mp3&download=true`}
              download="ozvuchka_narration.mp3"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-amber-500/40 transition-all shadow-sm active:scale-95"
              title="Скачать в компактном формате MP3 (192 kbps, подходит для мобильных устройств, мессенджеров и соцсетей)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать .MP3</span>
            </a>

            {/* WAV Download button */}
            <a
              href={`${audioUrl}?format=wav&download=true`}
              download="ozvuchka_narration.wav"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 text-xs font-medium border border-stone-700 transition-all active:scale-95"
              title="Скачать в несжатом студийном качестве .WAV (16-bit PCM 24 kHz)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.WAV</span>
            </a>
          </div>
        )}
      </div>

      {/* Waveform graphic visualization */}
      <div className="h-14 sm:h-16 w-full flex items-center justify-center gap-1 sm:gap-1.5 px-2 bg-stone-950/70 rounded-xl border border-stone-800/80 mb-5 overflow-hidden">
        {Array.from({ length: 48 }).map((_, idx) => {
          const progress = totalDuration > 0 ? currentTime / totalDuration : 0;
          const barProgress = idx / 48;
          const isPassed = barProgress <= progress;
          // Deterministic natural heights
          const baseHeight = Math.sin((idx * Math.PI) / 10) * 0.4 + Math.cos((idx * Math.PI) / 5) * 0.3 + 0.35;
          const activeHeight = isPlaying ? Math.max(0.15, (baseHeight * (0.8 + Math.random() * 0.4))) : baseHeight;
          const heightPercent = Math.min(95, Math.max(12, Math.round(activeHeight * 100)));

          return (
            <div
              key={idx}
              className={`w-1 sm:w-1.5 rounded-full transition-all duration-75 ${
                isPassed
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                  : 'bg-stone-800 hover:bg-stone-700'
              }`}
              style={{ height: `${heightPercent}%` }}
            />
          );
        })}
      </div>

      {/* Timeline track */}
      <div className="space-y-1.5 mb-5">
        <input
          type="range"
          min={0}
          max={totalDuration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          disabled={!audioUrl || isGenerating}
          className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40"
        />
        <div className="flex justify-between text-xs font-mono text-stone-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Main playback control row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Rewind 5s */}
          <button
            onClick={() => seekRelative(-5)}
            disabled={!audioUrl || isGenerating}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 disabled:opacity-40 transition-colors"
            title="Назад на 5 секунд"
          >
            <Rewind className="w-5 h-5" />
          </button>

          {/* Big Play / Pause button */}
          <button
            onClick={togglePlay}
            disabled={!audioUrl || isGenerating}
            className="w-13 h-13 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/20 disabled:opacity-40 transition-transform active:scale-95"
            title={isPlaying ? 'Пауза' : 'Воспроизвести'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-stone-950" />
            ) : (
              <Play className="w-6 h-6 fill-stone-950 ml-0.5" />
            )}
          </button>

          {/* Forward 5s */}
          <button
            onClick={() => seekRelative(5)}
            disabled={!audioUrl || isGenerating}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 disabled:opacity-40 transition-colors"
            title="Вперёд на 5 секунд"
          >
            <FastForward className="w-5 h-5" />
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            disabled={!audioUrl || isGenerating}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 disabled:opacity-40 transition-colors"
            title="Сначала"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed presets */}
        <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
          <span className="text-[11px] text-stone-500 px-1.5 font-medium">Скорость:</span>
          {speedOptions.map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                playbackRate === rate
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-stone-400 hover:text-stone-100 transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setIsMuted(false);
            }}
            className="w-16 sm:w-20 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>
    </div>
  );
};
