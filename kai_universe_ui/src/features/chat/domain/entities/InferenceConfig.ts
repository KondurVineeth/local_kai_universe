// Inference + decoding parameters surfaced in the chat right panel. Mirrors
// the field set ZL Universe shows under System Prompt / Settings / Sampling /
// Structured Output / Speculative Decoding. Lower-level model-load knobs
// (GPU offload, mmap, threads, etc.) live in My Models > Load Tab and are
// not part of the chat config.
export type ContextOverflowStrategy = 'truncate-middle' | 'truncate-start' | 'rolling-window' | 'error';

export interface InferenceConfig {
  // System Prompt
  readonly systemPrompt: string;

  // Settings
  readonly temperature: number; // 0–2
  readonly limitResponseLength: boolean;
  readonly responseLengthLimit: number; // tokens, only when limit is on
  readonly contextOverflow: ContextOverflowStrategy;
  // Mutable array (not `readonly string[]`) because Immer's WritableDraft
  // can't accept readonly arrays when the slice replaces config wholesale.
  readonly stopStrings: string[];

  // Sampling
  readonly topK: number;
  readonly repeatPenaltyEnabled: boolean;
  readonly repeatPenalty: number;
  readonly topPEnabled: boolean;
  readonly topP: number;
  readonly minPEnabled: boolean;
  readonly minP: number;

  // Structured output
  readonly structuredOutputEnabled: boolean;
  readonly structuredOutputSchema: string;

  // Speculative decoding
  readonly speculativeDecodingEnabled: boolean;
  readonly draftModelId: string | null;
  readonly draftTokens: number;
  readonly visualizeDraftTokens: boolean;
}

export const DEFAULT_INFERENCE_CONFIG: InferenceConfig = {
  systemPrompt: '',
  temperature: 0.6,
  limitResponseLength: false,
  responseLengthLimit: 1024,
  contextOverflow: 'truncate-middle',
  stopStrings: [],
  topK: 20,
  repeatPenaltyEnabled: false,
  repeatPenalty: 1.1,
  topPEnabled: true,
  topP: 0.95,
  // CONFIG-004: `minP` default is 0, which makes the filter a no-op. Shipping
  // it `enabled: true` was misleading — the toggle visibly does nothing. Off
  // by default; users opt in explicitly. Migration v3 already wrote `true`
  // for existing users, so the persistence layer is the source of truth for
  // returning users; only fresh installs see this default.
  minPEnabled: false,
  minP: 0,
  structuredOutputEnabled: false,
  structuredOutputSchema:
    '{\n  "type": "object",\n  "properties": {\n    "answer": { "type": "string" }\n  }\n}',
  speculativeDecodingEnabled: false,
  draftModelId: null,
  draftTokens: 2,
  visualizeDraftTokens: false,
};
