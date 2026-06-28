import { useEffect, useState } from 'react';

import { useContainer } from '@shared/container-context';

import type { Model } from '@shared/domain/model/entities/Model';

export interface ModelsState {
  readonly models: readonly Model[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

// Static-data read — pragmatic-strict allows hooks to call repository ports
// directly. Owned by discover so this feature doesn't reach into shell's
// hooks (cross-feature boundary).
export function useModels(): ModelsState {
  const container = useContainer();
  const [state, setState] = useState<ModelsState>({
    models: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    container.modelRepository
      .list()
      .then((models) => {
        if (cancelled) return;
        setState({ models, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load models';
        setState({ models: [], isLoading: false, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [container]);

  return state;
}
