// Runtime engine catalogue — fixture data for the Settings → Runtime panel.
// Mirrors the engines/frameworks list ZL Universe ships; `installedVersion`
// vs `latestVersion` drives the per-row "update available" affordance.

export type EngineKindTag = 'gguf' | 'mlx' | 'other';

export interface EngineFixture {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly kind: EngineKindTag;
  readonly installedVersion: string;
  readonly latestVersion: string;
  // Whether the engine is compatible with the current hardware. Drives the
  // "Compatible only" filter in the Engines section.
  readonly compatible: boolean;
}

export const ENGINE_FIXTURES: readonly EngineFixture[] = [
  {
    id: 'zlu-mlx',
    name: 'ZL Universe MLX',
    desc: 'Apple MLX engine, based on the MLX Python implementation',
    kind: 'mlx',
    installedVersion: 'v1.6.0',
    latestVersion: 'v1.6.0',
    compatible: true,
  },
  {
    id: 'zlu-mlx-m5',
    name: 'ZL Universe MLX (Apple M5)',
    desc: 'Apple MLX engine, with M5 Neural Accelerator support',
    kind: 'mlx',
    installedVersion: 'v1.5.2',
    latestVersion: 'v1.6.0',
    compatible: true,
  },
  {
    id: 'metal-llamacpp',
    name: 'Metal llama.cpp',
    desc: 'Apple Metal accelerated llama.cpp engine',
    kind: 'gguf',
    installedVersion: 'v2.14.0',
    latestVersion: 'v2.14.0',
    compatible: true,
  },
  {
    id: 'cuda-llamacpp',
    name: 'CUDA llama.cpp',
    desc: 'NVIDIA CUDA accelerated llama.cpp engine',
    kind: 'gguf',
    installedVersion: 'v2.13.0',
    latestVersion: 'v2.14.0',
    compatible: false,
  },
  {
    id: 'harmony-mac',
    name: 'Harmony (Mac)',
    desc: 'Chat history renderer and parser from OpenAI',
    kind: 'other',
    installedVersion: 'v0.3.5',
    latestVersion: 'v0.3.5',
    compatible: true,
  },
];
