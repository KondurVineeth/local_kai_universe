import { createAsyncThunk } from '@reduxjs/toolkit';

import { ModelNotFoundError } from '../../application/use-cases/ModelNotFoundError';

import {
  modelEjectStarted,
  modelEjected,
  modelLoadFailed,
  modelLoadProgressed,
  modelLoadStarted,
  modelLoadSucceeded,
} from './slice';

import type { Container } from '@shared/container'; 
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';



export const loadModelThunk = createAsyncThunk<void, ModelId, { extra: Container }>(
  'shell/loadModel',
  async (modelId, { dispatch, extra }) => {
    dispatch(modelLoadStarted({ modelId }));
    // Tick the picker's progress bar in parallel with the use-case's
    // simulated 3–5s delay. Ease-out cubic so it moves quickly at the
    // start then slows past 80% — matches how real VRAM allocation feels
    // (mmap is instant, weights are I/O-bound, the warmup pass is slow).
    // Cleared when the use-case settles (success or failure).
    let cancelled = false;
    const start = Date.now();
    const TICK_MS = 80;
    const ASSUMED_DURATION_MS = 4000;
    const tick = () => {
      if (cancelled) return;
      const t = Math.min(1, (Date.now() - start) / ASSUMED_DURATION_MS);
      // ease-out cubic — fast → slow
      const eased = 1 - Math.pow(1 - t, 3);
      // Cap at 95% so the bar can't "complete" before the real-load
      // resolves; the success/failure dispatch flips to 100/0.
      const pct = Math.min(95, Math.round(eased * 100));
      dispatch(modelLoadProgressed(pct));
      if (t < 1) setTimeout(tick, TICK_MS);
    };
    setTimeout(tick, TICK_MS);

    try {
      // LoadModel returns the resolved Model so we can record whether it's a
      // reasoning ("thinking"-tagged) model without a second repo lookup —
      // this drives the chat reasoning pill / simulator trace gate.
      const model = await extra.shell.loadModel.execute(modelId);
      cancelled = true;
      dispatch(
        modelLoadSucceeded({ modelId, isReasoning: model.tags.includes('thinking') }),
      );
    } catch (error) {
      cancelled = true;
      const message = error instanceof ModelNotFoundError ? error.message : 'Failed to load model';
      dispatch(modelLoadFailed({ message, modelId }));
    }
  },
);

export const ejectModelThunk = createAsyncThunk<void, void, { extra: Container }>(
  'shell/ejectModel',
  async (_arg, { dispatch, extra, getState }) => {
    // Flip to `unloading` first so the picker can render the eject animation
    // while the use-case's delay plays out. The `modelEjected` dispatch at
    // the end clears `loadedModelId` and resets to `idle`.
    dispatch(modelEjectStarted());
    const modelId = getState().shell.loadedModelId;

    if (!modelId) {
      dispatch(modelEjected());
      return;
    }
    try {
      await extra.shell.ejectModel.execute(modelId);
      dispatch(modelEjected());
    } catch {
      // If the (mock) eject ever throws, settle the slice back to `idle`
      // anyway — the alternative is a permanently stuck `unloading` ring
      // around the picker with no recovery affordance. The model is
      // effectively gone from the user's POV; treat the error as a
      // successful eject.
      dispatch(modelEjected());
    }
  },
);
