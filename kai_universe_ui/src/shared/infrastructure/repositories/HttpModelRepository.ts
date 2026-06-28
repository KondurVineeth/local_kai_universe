import type { Model } from '@shared/domain/model/entities/Model';
import type {
  ModelRepository,
  ModelSearchQuery,
} from '@shared/domain/model/ports/ModelRepository';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/discover';

export class HttpModelRepository implements ModelRepository {
  async list(): Promise<readonly Model[]> {
    const response = await fetch(`${API_BASE_URL}/models`);

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    return (await response.json()) as Model[];
  }

  async findById(id: ModelId): Promise<Model | null> {
    const response = await fetch(`${API_BASE_URL}/models/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch model');
    }

    return (await response.json()) as Model;
  }

  async staffPicks(): Promise<readonly Model[]> {
    const response = await fetch(`${API_BASE_URL}/staff-picks`);

    if (!response.ok) {
      throw new Error('Failed to fetch staff picks');
    }

    return (await response.json()) as Model[];
  }

  async search(
    query: ModelSearchQuery,
  ): Promise<readonly Model[]> {
    const params = new URLSearchParams();

    if (query.text) {
      params.append('text', query.text);
    }

    if (query.format) {
      params.append('format', query.format);
    }

    const response = await fetch(
      `${API_BASE_URL}/search?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error('Failed to search models');
    }

    return (await response.json()) as Model[];
  }
}