import type { ModelId } from '@shared/domain/model/value-objects/ModelId';
import type { Bytes } from '@shared/domain/primitives/Bytes';

// Snapshot of a model living on a remote device, as it appears in the
// right-rail "Models on Remote Device" list. We don't reuse the local
// `Model` aggregate because the surface is narrower (no variants array,
// no readme markdown, no capability metadata) and because we don't want
// presentation code that browses remote weights to accidentally treat
// them as locally-installable.
export interface RemoteModel {
  readonly modelId: ModelId;
  readonly displayName: string;
  readonly author: string;
  readonly parameterCountB: number;
  readonly format: string;
  readonly quantization: string;
  readonly sizeBytes: Bytes;
}
