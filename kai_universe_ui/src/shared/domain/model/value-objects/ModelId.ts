import { EntityId } from '../../primitives/EntityId';

export type ModelId = EntityId<'Model'>;

export const ModelId = {
  of(value: string): ModelId {
    if (!value || value.trim() !== value) {
      throw new RangeError('ModelId must be a non-empty trimmed string');
    }
    return EntityId.of<'Model'>(value);
  },
} as const;
