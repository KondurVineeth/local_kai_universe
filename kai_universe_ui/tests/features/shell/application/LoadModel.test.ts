import { describe, expect, it, vi } from 'vitest';

import { ModelId } from '@shared/domain/model/value-objects/ModelId';

import { LoadModel } from '../../../../src/features/shell/application/use-cases/LoadModel';
import { ModelNotFoundError } from '../../../../src/features/shell/application/use-cases/ModelNotFoundError';

import type { Model } from '@shared/domain/model/entities/Model';
import type { ModelRepository } from '@shared/domain/model/ports/ModelRepository';

function makeRepo(model: Model | null): ModelRepository {
  return {
    list: vi.fn(),
    search: vi.fn(),
    findById: vi.fn().mockResolvedValue(model),
    staffPicks: vi.fn(),
  };
}

const FAKE_MODEL = {
  id: ModelId.of('test-7b'),
  displayName: 'Test 7B',
  author: 'tester',
  description: 'fixture',
  contextLengthTokens: 4096,
  parameterCountB: 7,
  format: 'gguf',
  capabilities: { tools: false, vision: false, reasoning: false, embeddings: false },
  variants: [],
  readmeMarkdown: '',
  downloadCount: 0,
  publishedAt: '2026-01-01T00:00:00Z',
  tags: [],
  staffPick: false,
} as unknown as Model;

describe('LoadModel', () => {
  it('returns the loaded model on success', async () => {
    const repo = makeRepo(FAKE_MODEL);
    const useCase = new LoadModel(repo);
    const result = await useCase.execute(ModelId.of('test-7b'));
    expect(result).toBe(FAKE_MODEL);
    expect(repo.findById).toHaveBeenCalledWith(ModelId.of('test-7b'));
  });

  it('throws ModelNotFoundError when the model does not exist', async () => {
    const repo = makeRepo(null);
    const useCase = new LoadModel(repo);
    await expect(useCase.execute(ModelId.of('does-not-exist'))).rejects.toBeInstanceOf(
      ModelNotFoundError,
    );
  });
});
