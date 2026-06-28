import type { ModelId } from '@shared/domain/model/value-objects/ModelId';

// One row on the "Pick a starter model" screen. Mapped at recommend-time
// from the catalogue + detected hardware; the screen itself only renders.
export type StarterTier = 'small' | 'balanced' | 'large';

export interface StarterRecommendation {
  readonly tier: StarterTier;
  readonly modelId: ModelId;
  readonly displayName: string;
  readonly author: string;
  readonly parameterCountB: number;
  readonly fitsHardware: boolean; // false when VRAM/RAM clearly insufficient
  readonly headline: string;       // one-line "good for X" copy
}
