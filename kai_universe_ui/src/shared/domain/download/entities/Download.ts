import type { ModelId } from '../../model/value-objects/ModelId';
import type { Quantization } from '../../model/value-objects/Quantization';
import type { Bytes } from '../../primitives/Bytes';
import type { EntityId } from '../../primitives/EntityId';
import type { Iso8601 } from '../../primitives/Iso8601';

export type DownloadId = EntityId<'Download'>;

export type DownloadStatus =
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Download {
  readonly id: DownloadId;
  readonly modelId: ModelId;
  readonly quantization: Quantization;
  readonly totalBytes: Bytes;
  readonly receivedBytes: Bytes;
  readonly status: DownloadStatus;
  readonly bytesPerSecond: number;
  readonly startedAt: Iso8601;
  readonly completedAt: Iso8601 | null;
  readonly errorMessage: string | null;
}

export interface DownloadProgress {
  readonly id: DownloadId;
  readonly receivedBytes: Bytes;
  readonly totalBytes: Bytes;
  readonly bytesPerSecond: number;
  readonly status: DownloadStatus;
}
