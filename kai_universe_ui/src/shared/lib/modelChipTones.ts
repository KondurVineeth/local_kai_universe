// Per-token chip colour palette. The detail pane shows several categories
// of small chips side-by-side (formats, quantizations, capabilities, params,
// arch, domain); using one accent tone for all of them flattens the
// information hierarchy and hurts scannability. Each category gets its own
// token here so the user can pick the type at a glance.
//
// Returned classes are Tailwind utility strings — bg, text, and optional
// border in one bundle. Consumers just spread it into the chip's className.

export interface ChipTone {
  readonly bg: string;
  readonly text: string;
}

const NEUTRAL: ChipTone = {
  bg: 'bg-bg-raised',
  text: 'text-fg-default',
};

const FORMAT_TONES: Record<string, ChipTone> = {
  gguf: { bg: 'bg-sky-500/20', text: 'text-sky-300' },
  mlx: { bg: 'bg-pink-500/20', text: 'text-pink-300' },
  onnx: { bg: 'bg-violet-500/20', text: 'text-violet-300' },
};

const CAPABILITY_TONES: Record<string, ChipTone> = {
  'Tool Use': { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  Reasoning: { bg: 'bg-violet-500/20', text: 'text-violet-300' },
  Vision: { bg: 'bg-cyan-500/20', text: 'text-cyan-300' },
  Embeddings: { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
};

const ARCH_TONES: Record<string, ChipTone> = {
  llama: { bg: 'bg-orange-500/20', text: 'text-orange-300' },
  qwen2: { bg: 'bg-rose-500/20', text: 'text-rose-300' },
  qwen3: { bg: 'bg-rose-500/20', text: 'text-rose-300' },
  'qwen2-vl': { bg: 'bg-rose-500/20', text: 'text-rose-300' },
  gemma2: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
  phi3: { bg: 'bg-indigo-500/20', text: 'text-indigo-300' },
  mistral: { bg: 'bg-red-500/20', text: 'text-red-300' },
  mixtral: { bg: 'bg-red-500/20', text: 'text-red-300' },
  'deepseek-v2': { bg: 'bg-teal-500/20', text: 'text-teal-300' },
  lfm2: { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300' },
  mllama: { bg: 'bg-orange-500/20', text: 'text-orange-300' },
  starcoder2: { bg: 'bg-yellow-500/20', text: 'text-yellow-300' },
  granite: { bg: 'bg-slate-500/20', text: 'text-slate-300' },
  olmo2: { bg: 'bg-lime-500/20', text: 'text-lime-300' },
  cohere: { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  bert: { bg: 'bg-stone-500/20', text: 'text-stone-300' },
  'nomic-bert': { bg: 'bg-stone-500/20', text: 'text-stone-300' },
};

const DOMAIN_TONES: Record<string, ChipTone> = {
  llm: { bg: 'bg-indigo-500/15', text: 'text-indigo-300' },
  embedding: { bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
};

export function formatChipTone(format: string): ChipTone {
  return FORMAT_TONES[format.toLowerCase()] ?? NEUTRAL;
}

export function capabilityChipTone(label: string): ChipTone {
  return CAPABILITY_TONES[label] ?? NEUTRAL;
}

export function archChipTone(arch: string): ChipTone {
  return ARCH_TONES[arch] ?? NEUTRAL;
}

export function domainChipTone(domain: string): ChipTone {
  return DOMAIN_TONES[domain] ?? NEUTRAL;
}

// Params chips stay neutral — the value (e.g. "8B") is the signal, not the
// category; tinting it would compete with arch/format for the user's eye.
export function paramsChipTone(): ChipTone {
  return NEUTRAL;
}

// Quantization stays neutral too — it's a sub-attribute of the format chip
// next to it; tinting it duplicates the format's signal.
export function quantChipTone(): ChipTone {
  return NEUTRAL;
}
