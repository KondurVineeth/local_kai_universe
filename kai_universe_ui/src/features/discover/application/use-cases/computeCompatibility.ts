import type { ModelVariant } from '@shared/domain/model/entities/Model';
import type { HardwareSpec } from '@shared/domain/system/entities/HardwareSpec';

export type CompatibilityTier =
  | 'unknown' // no hardware probe
  | 'full-gpu' // variant fits in VRAM with headroom
  | 'partial-gpu' // variant exceeds VRAM but fits in system RAM (offload split)
  | 'cpu-only' // variant fits in RAM but no usable GPU
  | 'too-large'; // variant exceeds available memory entirely

export interface CompatibilityResult {
  readonly tier: CompatibilityTier;
  readonly label: string;
  readonly tone: 'success' | 'warning' | 'neutral' | 'danger';
}

const VRAM_HEADROOM_FRACTION = 0.85;
const RAM_HEADROOM_FRACTION = 0.7;

// Lightweight compat estimate. Real ZL Universe uses model-architecture-aware
// memory math; here we use total variant size + a tier headroom. Acceptable
// for the mock — gives users a directionally correct badge instead of a
// hardcoded green lie.
export function computeCompatibility(
  variant: ModelVariant,
  hardware: HardwareSpec | null,
): CompatibilityResult {
  if (!hardware) {
    return { tier: 'unknown', label: 'Compatibility unknown', tone: 'neutral' };
  }
  const size = Number(variant.sizeBytes);
  const vram = Number(hardware.gpu.vramBytes);
  const ram = Number(hardware.memory.totalBytes);
  const hasGpu = hardware.gpu.vendor !== 'none' && vram > 0;

  if (hasGpu && size <= vram * VRAM_HEADROOM_FRACTION) {
    return { tier: 'full-gpu', label: 'Full GPU Offload Possible', tone: 'success' };
  }
  if (size <= ram * RAM_HEADROOM_FRACTION) {
    return {
      tier: hasGpu ? 'partial-gpu' : 'cpu-only',
      label: hasGpu ? 'Partial GPU Offload' : 'CPU Only',
      tone: 'warning',
    };
  }
  return { tier: 'too-large', label: 'Likely Too Large', tone: 'danger' };
}
