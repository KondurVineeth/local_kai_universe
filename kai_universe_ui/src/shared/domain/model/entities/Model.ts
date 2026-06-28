import type { Bytes } from '../../primitives/Bytes';
import type { Iso8601 } from '../../primitives/Iso8601';
import type { ModelFormat } from '../value-objects/ModelFormat';
import type { ModelId } from '../value-objects/ModelId';
import type { Quantization } from '../value-objects/Quantization';

export interface ModelCapabilities {
  readonly tools: boolean;
  readonly vision: boolean;
  readonly reasoning: boolean;
  readonly embeddings: boolean;
}

export interface ModelVariant {
  readonly quantization: Quantization;
  readonly format: ModelFormat;
  readonly sizeBytes: Bytes;
  readonly recommended: boolean;
}

export interface Model {
  readonly id: ModelId;
  readonly displayName: string;
  readonly hfRepository: string;
  readonly author: string;
  readonly description: string;
  readonly contextLengthTokens: number;
  readonly parameterCountB: number;
  readonly format: ModelFormat;
  // Architecture family — `lfm2`, `llama`, `qwen2`, `qwen3`, `gemma2`,
  // `phi3`, `mistral`, `mixtral`, `deepseek-v2`, etc. Surfaced as the
  // "Arch" chip in the detail pane and can drive future inference-engine
  // routing.
  readonly arch: string;
  readonly capabilities: ModelCapabilities;
  readonly variants: readonly ModelVariant[];
  readonly readmeMarkdown: string;
  readonly downloadCount: number;
  readonly starCount: number;
  readonly publishedAt: Iso8601;
  readonly tags: readonly string[];
  readonly staffPick: boolean;
}
