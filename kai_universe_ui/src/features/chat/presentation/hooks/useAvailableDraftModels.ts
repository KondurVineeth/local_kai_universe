import { useEffect, useState } from 'react';

import { useContainer } from '@shared/container-context';

import type { Model } from '@shared/domain/model/entities/Model';

// CONFIG-007: dropdown was hard-coded; now reflects actual model availability
// from the shared modelRepository. "Draft model" candidates are small models
// (≤ 4B params is a common heuristic for speculative decoding) — the
// reference UI in ZL Universe shows every installed model and lets the user
// pick. We mirror that and surface every model; the Settings panel UX makes
// it clear that small models work better via the "Read how it works" link.
//
// Living in the chat feature directly (not pulling shell/presentation/hooks)
// to satisfy the boundaries plugin's barrel-only-imports-across-features
// rule. Wires straight to the shared modelRepository port.
export interface DraftModelsState {
  readonly models: readonly Model[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function useAvailableDraftModels(): DraftModelsState {
  const container = useContainer();
  const [state, setState] = useState<DraftModelsState>({
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
