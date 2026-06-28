import type { StarterRecommendation, StarterTier } from '../../domain/entities/StarterRecommendation';
import type { Model } from '@shared/domain/model/entities/Model';
import type { ModelRepository } from '@shared/domain/model/ports/ModelRepository';
import type { HardwareSpec } from '@shared/domain/system/entities/HardwareSpec';

// Picks three starter recommendations (small / balanced / large) from the
// model catalogue, scored against detected VRAM. Pure-ish — depends only on
// the model repository and a HardwareSpec snapshot. No I/O beyond the repo
// list call. Embeddings-only models are excluded from the chat starter set.
//
// Tiering rule (parameter count → tier):
//   < 5B  → small
//   5–8B  → balanced
//   > 8B  → large
//
// `fitsHardware` is true when the model's recommended quant fits in the
// detected VRAM with ~25% headroom for the runtime. The screen still shows
// "doesn't fit" recommendations so the user can see what's possible if they
// upgrade — but they're visually deprioritised.
export class RecommendStarterModels {
  constructor(private readonly models: ModelRepository) {}

  async execute(hardware: HardwareSpec): Promise<readonly StarterRecommendation[]> {
    const all = await this.models.list();
    const chatModels = all.filter((m) => !m.capabilities.embeddings);
    const sorted = [...chatModels].sort((a, b) => a.parameterCountB - b.parameterCountB);

    const small = pickByTier(sorted, 'small');
    const balanced = pickByTier(sorted, 'balanced');
    const large = pickByTier(sorted, 'large');

    return [small, balanced, large]
      .filter((x): x is Model => x !== null)
      .map((m) => toRecommendation(m, hardware));
  }
}

function pickByTier(sorted: readonly Model[], tier: StarterTier): Model | null {
  const inTier = sorted.filter((m) => tierOf(m.parameterCountB) === tier);
  // Prefer staff picks within the tier; fall back to first match.
  return inTier.find((m) => m.staffPick) ?? inTier[0] ?? null;
}

function tierOf(params: number): StarterTier {
  if (params < 5) return 'small';
  if (params <= 8) return 'balanced';
  return 'large';
}

function toRecommendation(model: Model, hw: HardwareSpec): StarterRecommendation {
  const recommendedVariant =
    model.variants.find((v) => v.recommended) ?? model.variants[0];
  const sizeBytes = recommendedVariant?.sizeBytes ?? 0;
  // Need ~25% runtime headroom on top of weight size.
  const requiredVram = sizeBytes * 1.25;
  const fitsHardware = hw.gpu.vramBytes >= requiredVram;
  return {
    tier: tierOf(model.parameterCountB),
    modelId: model.id,
    displayName: model.displayName,
    author: model.author,
    parameterCountB: model.parameterCountB,
    fitsHardware,
    headline: headlineFor(tierOf(model.parameterCountB), model),
  };
}

function headlineFor(tier: StarterTier, model: Model): string {
  if (tier === 'small') {
    return 'Fast on most laptops. Great for quick Q&A and short tasks.';
  }
  if (tier === 'balanced') {
    return model.capabilities.reasoning
      ? 'Balanced quality + speed. Good general-purpose default.'
      : 'Strong everyday model. Good general-purpose default.';
  }
  return model.capabilities.reasoning
    ? 'Highest quality answers, longer reasoning. Slower per token.'
    : 'Highest quality outputs at this size. Slower per token.';
}
