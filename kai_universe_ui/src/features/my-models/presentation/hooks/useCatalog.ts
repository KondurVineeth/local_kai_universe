import { useEffect, useState } from 'react';

import { useContainer } from '@shared/container-context';

import type { Model } from '@shared/domain/model/entities/Model';

export interface CatalogState {
  readonly catalog: readonly Model[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

// Reads the full model catalogue (every known model). My-Models slices it
// to the user's installed set via `installedModelIds`; the catalogue stays
// pure feed data.
export function useCatalog(): CatalogState {
  const container = useContainer();
  const [state, setState] = useState<CatalogState>({
    catalog: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    container.modelRepository
      .list()
      .then((catalog) => {
        if (cancelled) return;
        setState({ catalog, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load models';
        setState({ catalog: [], isLoading: false, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [container]);

  return state;
}
