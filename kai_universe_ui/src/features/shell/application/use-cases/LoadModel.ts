import { delayJittered } from '@shared/lib/delay';

import { ModelNotFoundError } from './ModelNotFoundError';

import type { Model } from '@shared/domain/model/entities/Model';
import type { ModelRepository } from '@shared/domain/model/ports/ModelRepository';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';
import type { HttpLocalServerService } from '@shared/infrastructure/repositories/HttpLocalServerService';



// Validates the model exists and simulates the time real ZL Universe takes to
// allocate VRAM and warm up an inference engine. Returns the loaded Model so
// the UI can show its display name immediately without a second round-trip.
export class LoadModel {

  constructor(
      private readonly modelRepository: ModelRepository,
      private readonly localServerService: HttpLocalServerService,
  ) {}

  async execute(modelId: ModelId): Promise<Model> {
    const model = await this.modelRepository.findById(modelId);
    if (!model) throw new ModelNotFoundError(modelId);
    // 3–5s window pairs with the picker's animated loading-border so the user
    // sees a progress affordance, not a blank freeze, before the model is
    // reported ready. Matches ZL Universe's real "allocating VRAM" delay shape.
    await this.localServerService.loadModel(
        model.id,
        `${model.author}/${model.id}`,
    );
    await delayJittered(3000, 5000);
    return model;
  }
}
