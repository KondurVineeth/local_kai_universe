import { useEffect, useState } from 'react';

import { useContainer } from '@shared/container-context';
import { useAppSelector } from '@shared/store/hooks';

import { selectLoadedModelId, selectModelLoadStatus } from '../store/selectors';

import type { ModelLoadStatus } from '../../domain/value-objects/ModelLoadStatus';
import type { Model } from '@shared/domain/model/entities/Model';

export interface LoadedModelState {
  readonly model: Model | null;
  readonly status: ModelLoadStatus;
}

// Resolves the currently-loaded model id (from the shell slice) to a full
// Model entity by querying the repository. Re-queries when the id changes.
export function useLoadedModel(): LoadedModelState {
  const container = useContainer();
  const loadedModelId = useAppSelector(selectLoadedModelId);
  const status = useAppSelector(selectModelLoadStatus);
  const [model, setModel] = useState<Model | null>(null);

  useEffect(() => {
    if (loadedModelId === null) {
      setModel(null);
      return;
    }
    let cancelled = false;
    void container.modelRepository.findById(loadedModelId).then((m) => {
      if (!cancelled) setModel(m);
    });
    return () => {
      cancelled = true;
    };
  }, [container, loadedModelId]);

  return { model, status };
}
