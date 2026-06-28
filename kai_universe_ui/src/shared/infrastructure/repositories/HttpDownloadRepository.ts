import type {
  Download,
  DownloadId,
  DownloadProgress,
} from '@shared/domain/download/entities/Download';

import type {
  DownloadRepository,
  EnqueueDownloadInput,
} from '@shared/domain/download/ports/DownloadRepository';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/downloads';

export class HttpDownloadRepository implements DownloadRepository {

  async list(): Promise<readonly Download[]> {

    const response = await fetch(API_BASE_URL);

    if (!response.ok) {
      throw new Error('Failed to fetch downloads');
    }

    return await response.json();
  }

  async findById(id: DownloadId): Promise<Download | null> {

    const response = await fetch(`${API_BASE_URL}/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch download');
    }

    return await response.json();
  }

  async enqueue(
    input: EnqueueDownloadInput,
  ): Promise<Download> {

    const response = await fetch(API_BASE_URL, {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({

        model_id: input.modelId,

        hf_repository: input.hfRepository,

        quantization: input.quantization,

        total_bytes: input.sizeBytes ?? 0,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start download');
    }

    return await response.json();
  }

  async pause(id: DownloadId): Promise<void> {

    await fetch(`${API_BASE_URL}/${id}/pause`, {

      method: 'POST',
    });
  }

  async resume(id: DownloadId): Promise<void> {

    await fetch(`${API_BASE_URL}/${id}/resume`, {

      method: 'POST',
    });
  }

  async cancel(id: DownloadId): Promise<void> {

    await fetch(`${API_BASE_URL}/${id}/cancel`, {

      method: 'POST',
    });
  }

  async *observe(
    id: DownloadId,
  ): AsyncIterable<DownloadProgress> {

    while (true) {

      const response = await fetch(
        `${API_BASE_URL}/${id}`,
      );

      if (!response.ok) {
        throw new Error('Failed to poll download');
      }

      const download = await response.json();

      yield {

        id: download.id,

        receivedBytes: download.receivedBytes,

        totalBytes: download.totalBytes,

        bytesPerSecond: download.bytesPerSecond,

        status: download.status,
      };

      if (
        download.status === 'completed' ||
        download.status === 'failed' ||
        download.status === 'cancelled'
      ) {
        break;
      }

      await new Promise(
        resolve => setTimeout(resolve, 1000),
      );
    }
  }
}