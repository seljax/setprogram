export type TTSEngine = 'gemini' | 'yandex' | 'browser';

export interface VoiceOption {
  id: string;
  name: string;
  label: string;
  category: 'narrative' | 'conversational' | 'dramatic' | 'documentary' | 'warm';
  description: string;
  gender: 'male' | 'female' | 'neutral';
  accent?: string;
  tone?: string;
  tags?: string[];
  geminiVoice: string; // The underlying neural TTS voice used for synthesis
  provider?: 'gemini' | 'yandex';
  yandexVoiceId?: string;
  recommended?: boolean;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export interface VoiceAnalysisResult {
  timbre: string;
  tempo: string;
  emotion: string;
  recommendedVoice: string;
  recommendedPrompt: string;
  explanation: string;
  pitchDescription: string;
  confidence: number;
}

export interface NarrationResult {
  audioUrl: string;
  duration: number;
  voice: string;
  cached: boolean;
  sampleRate: number;
  timestamp: number;
}
