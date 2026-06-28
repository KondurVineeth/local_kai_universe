import { useEffect, useMemo, useState } from 'react';

import { selectInstalledModelIds } from '@features/my-models';
import { useContainer } from '@shared/container-context';
import { useAppSelector } from '@shared/store/hooks';

import type { Model } from '@shared/domain/model/entities/Model';


export interface ModelsListState {
  readonly models: readonly Model[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

// The global model picker in the top header only ever lists models the
// user has actually downloaded — loading a non-installed weight is
// nonsensical. We pull the full catalogue from the repository (still the
// canonical "what models exist" source) and intersect it with the
// installed-id set from my-models.
//
// Static-data read; the pragmatic-strict rule allows hooks to call repository
// ports directly. No use case is needed for a plain list query.
export function useModelsList(): ModelsListState {
  const container = useContainer();
  const installedIds = useAppSelector(selectInstalledModelIds);
  const [state, setState] = useState<{
    catalog: readonly Model[];
    isLoading: boolean;
    error: string | null;
  }>({ catalog: [], isLoading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    container.modelRepository
      .list()
      .then((models) => {
        if (cancelled) return;
        setState({ catalog: models, isLoading: false, error: null });
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

  const models = useMemo(
    () => state.catalog.filter((m) => installedIds.includes(m.id)),
    [state.catalog, installedIds],
  );

  return { models, isLoading: state.isLoading, error: state.error };
}
