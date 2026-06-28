import { modelInstalled } from '@features/my-models';

import {
  downloadFinished,
  downloadIdAssigned,
  downloadProgressed,
  downloadStarted,
  downloadStatusChanged,
  type DiscoverState,
} from './slice';

import type { AnyAction, ThunkAction } from '@reduxjs/toolkit';
import type { Container } from '@shared/container';
import type { DownloadId } from '@shared/domain/download/entities/Download';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';
import type { Quantization } from '@shared/domain/model/value-objects/Quantization';
import type { Bytes } from '@shared/domain/primitives/Bytes';

type DiscoverThunk<TReturn = void> = ThunkAction<
  TReturn,
  { discover: DiscoverState },
  Container,
  AnyAction
>;

// Kicks off a model download. Enqueues via the shared DownloadRepository,
// then pumps the simulator's AsyncIterable into the discover slice so the
// detail card's progress bar reflects real bytes-received numbers.
//
// On `completed`, ALSO dispatches `myModels.modelInstalled` — the catalogue
// (fixture) tracks what models EXIST; the myModels slice tracks what the
// user OWNS. Without this dispatch a downloaded model would never appear in
// the My Models table.
//
// The repo guards against duplicate observe loops via a generation token, so
// a retry-after-cancel can't double-pump progress into the slice.
export function startModelDownloadThunk(
  modelId: ModelId,
  hfRepository: string,
  quantization: Quantization,
  totalBytes: number,
): DiscoverThunk<Promise<void>> {
  return async (dispatch, _getState, container) => {
    dispatch(downloadStarted({ modelId, quantization, totalBytes }));
    try {
      const download = await container.downloadRepository.enqueue({
        modelId,
        quantization,
        hfRepository,
        sizeBytes: totalBytes as Bytes
      });
      dispatch(downloadIdAssigned({ modelId, downloadId: String(download.id) }));
      for await (const progress of container.downloadRepository.observe(download.id)) {
        dispatch(
          downloadProgressed({
            modelId,
            receivedBytes: Number(progress.receivedBytes),
          }),
        );
        if (progress.status === 'completed') {
          dispatch(downloadFinished({ modelId, status: 'completed' }));
          dispatch(modelInstalled({ modelId, quantization }));
          return;
        }
        if (progress.status === 'cancelled') {
          dispatch(downloadFinished({ modelId, status: 'cancelled' }));
          return;
        }
        // 'paused' / 'downloading' heartbeats keep the slice status honest so
        // the Download button reflects pause/resume in real time.
        if (progress.status === 'paused' || progress.status === 'downloading') {
          dispatch(downloadStatusChanged({ modelId, status: progress.status }));
        }
      }
      // Stream ended without a terminal event — treat as completed (the
      // simulator never spontaneously fails).
      dispatch(downloadFinished({ modelId, status: 'completed' }));
      dispatch(modelInstalled({ modelId, quantization }));
    } catch (_err) {
      // Defensive: enqueue/observe shouldn't throw in the fixture, but if
      // they do we don't want a half-finished entry stuck "downloading".
      dispatch(downloadFinished({ modelId, status: 'cancelled' }));
    }
  };
}

// Pause/resume/cancel are user-initiated. They flip the repo's record; the
// running observe loop reads that status each tick and reacts.
export function pauseModelDownloadThunk(
  _modelId: ModelId,
  downloadId: string,
): DiscoverThunk<Promise<void>> {
  return async (_dispatch, _getState, container) => {
    try {
      await container.downloadRepository.pause(downloadId as DownloadId);
    } catch (_err) {
      // No-op: a pause that can't apply just leaves the download running.
    }
  };
}

export function resumeModelDownloadThunk(
  _modelId: ModelId,
  downloadId: string,
): DiscoverThunk<Promise<void>> {
  return async (_dispatch, _getState, container) => {
    try {
      await container.downloadRepository.resume(downloadId as DownloadId);
    } catch (_err) {
      // No-op.
    }
  };
}

export function cancelModelDownloadThunk(
  modelId: ModelId,
  downloadId: string,
): DiscoverThunk<Promise<void>> {
  return async (dispatch, _getState, container) => {
    try {
      await container.downloadRepository.cancel(downloadId as DownloadId);
    } catch (_err) {
      // Even if the repo call fails, reflect the user's intent in the slice
      // so the UI doesn't get stuck mid-download.
      dispatch(downloadFinished({ modelId, status: 'cancelled' }));
    }
  };
}
