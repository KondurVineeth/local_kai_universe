import type { ModelId } from '../../model/value-objects/ModelId';
import type { Quantization } from '../../model/value-objects/Quantization';
import type { Bytes } from '../../primitives/Bytes';
import type { Download, DownloadId, DownloadProgress } from '../entities/Download';

export interface EnqueueDownloadInput {
    readonly modelId: ModelId;

    readonly hfRepository: string;

    readonly quantization: Quantization;

    readonly sizeBytes?: Bytes;
}

export interface DownloadRepository {
  list(): Promise<readonly Download[]>;
  findById(id: DownloadId): Promise<Download | null>;
  enqueue(input: EnqueueDownloadInput): Promise<Download>;
  pause(id: DownloadId): Promise<void>;
  resume(id: DownloadId): Promise<void>;
  cancel(id: DownloadId): Promise<void>;

  // Hot updates from the simulator. Adapter implements either polling or push.
  observe(id: DownloadId): AsyncIterable<DownloadProgress>;
}
