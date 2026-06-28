import { useEffect, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectLastLoadedModelId,
  selectLoadedModelId,
  selectModelLoadStatus,
} from '../store/selectors';
import { loadModelThunk } from '../store/thunks';

/**
 * UX-SHELL-003 — silently re-load the user's last successfully-loaded model
 * on app boot. The shell slice persists `lastLoadedModelId` across restarts;
 * runtime load state (`loadedModelId`, `modelLoadStatus`) is intentionally
 * NOT persisted, so on cold launch:
 *   - `lastLoadedModelId` is whatever the user last loaded (or null)
 *   - `modelLoadStatus` is always 'idle'
 *   - `loadedModelId` is always null
 *
 * If the persisted hint is non-null and we're idle with nothing loaded, fire
 * `loadModelThunk` once. The ref guards against re-firing if the user
 * subsequently ejects (which clears `lastLoadedModelId` anyway, but the
 * effect would still see one `idle` frame between `unloading` and the clear).
 */
export function useAutoRestoreLastModel(): void {
  const dispatch = useAppDispatch();
  const lastLoadedModelId = useAppSelector(selectLastLoadedModelId);
  const modelLoadStatus = useAppSelector(selectModelLoadStatus);
  const loadedModelId = useAppSelector(selectLoadedModelId);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (lastLoadedModelId === null) return;
    if (modelLoadStatus !== 'idle') return;
    if (loadedModelId !== null) return;
    firedRef.current = true;
    void dispatch(loadModelThunk(lastLoadedModelId));
  }, [dispatch, lastLoadedModelId, modelLoadStatus, loadedModelId]);
}
