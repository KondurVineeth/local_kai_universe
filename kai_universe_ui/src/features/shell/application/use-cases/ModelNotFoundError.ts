import type { ModelId } from '@shared/domain/model/value-objects/ModelId';

export class ModelNotFoundError extends Error {
  constructor(public readonly modelId: ModelId) {
    super(`Model not found: ${modelId}`);
    this.name = 'ModelNotFoundError';
  }
}
