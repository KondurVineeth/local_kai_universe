import type { Model } from '../entities/Model';
import type { ModelFormat } from '../value-objects/ModelFormat';
import type { ModelId } from '../value-objects/ModelId';

export interface ModelSearchQuery {
  readonly text?: string;
  readonly format?: ModelFormat;
  readonly compatibleOnly?: boolean;
  readonly tags?: readonly string[];
}

// Read-side port. Mutations on the catalog are out of scope for the mock.
export interface ModelRepository {
  list(): Promise<readonly Model[]>;
  search(query: ModelSearchQuery): Promise<readonly Model[]>;
  findById(id: ModelId): Promise<Model | null>;
  staffPicks(): Promise<readonly Model[]>;
}
