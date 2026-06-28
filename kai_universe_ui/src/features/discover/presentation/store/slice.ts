import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ModelId } from '@shared/domain/model/value-objects/ModelId';
import type { Quantization } from '@shared/domain/model/value-objects/Quantization';

export type DiscoverCategory =
  | 'staff-picks'
  | 'all'
  | 'llms'
  | 'embeddings'
  | 'vision'
  | 'tools'
  | 'reasoning';

export type DiscoverFormatFilter = 'all' | 'mlx' | 'gguf';
export type DiscoverSort = 'best-match' | 'most-downloaded' | 'newest';

// Per-model download progress kept in the slice so the list row + detail
// card share the same source of truth. The actual byte stream lives in the
// FixtureDownloadRepository; the thunk pumps progress into this map.
export interface DiscoverDownloadEntry {
  readonly modelId: ModelId;
  readonly quantization: Quantization;
  // Repository-assigned download id. Needed so pause/resume/cancel can
  // target the in-flight download in the shared DownloadRepository.
  readonly downloadId: string | null;
  readonly receivedBytes: number;
  readonly totalBytes: number;
  readonly status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';
}

export interface DiscoverState {
  readonly selectedModelId: ModelId | null;
  readonly category: DiscoverCategory;
  readonly searchQuery: string;
  readonly formatFilter: DiscoverFormatFilter;
  readonly sort: DiscoverSort;
  // Sticky per-model quantization choice. When the user opens a model and
  // picks Q5_K_M, the next time they open the same model that variant is
  // already selected (matches ZL Universe behaviour).
  readonly selectedVariantByModel: Readonly<Record<ModelId, Quantization>>;
  // Active or completed downloads keyed by modelId. Multiple variants per
  // model would need an array; v1 enforces one in-flight download per model.
  readonly downloads: Readonly<Record<ModelId, DiscoverDownloadEntry>>;
}

const initialState: DiscoverState = {
  selectedModelId: null,
  category: 'all',
  searchQuery: '',
  formatFilter: 'all',
  sort: 'best-match',
  selectedVariantByModel: {},
  downloads: {},
};

export const discoverSlice = createSlice({
  name: 'discover',
  initialState,
  reducers: {
    selectModel(state, action: PayloadAction<ModelId | null>) {
      state.selectedModelId = action.payload;
    },
    categorySet(state, action: PayloadAction<DiscoverCategory>) {
      state.category = action.payload;
    },
    searchQuerySet(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    formatFilterSet(state, action: PayloadAction<DiscoverFormatFilter>) {
      state.formatFilter = action.payload;
    },
    sortSet(state, action: PayloadAction<DiscoverSort>) {
      state.sort = action.payload;
    },
    variantSelected(
      state,
      action: PayloadAction<{ modelId: ModelId; quantization: Quantization }>,
    ) {
      state.selectedVariantByModel = {
        ...state.selectedVariantByModel,
        [action.payload.modelId]: action.payload.quantization,
      };
    },
    downloadStarted(
      state,
      action: PayloadAction<{
        modelId: ModelId;
        quantization: Quantization;
        totalBytes: number;
      }>,
    ) {
      const { modelId, quantization, totalBytes } = action.payload;
      state.downloads = {
        ...state.downloads,
        [modelId]: {
          modelId,
          quantization,
          downloadId: null,
          totalBytes,
          receivedBytes: 0,
          status: 'queued',
        },
      };
    },
    downloadIdAssigned(
      state,
      action: PayloadAction<{ modelId: ModelId; downloadId: string }>,
    ) {
      const entry = state.downloads[action.payload.modelId];
      if (!entry) return;
      state.downloads = {
        ...state.downloads,
        [action.payload.modelId]: {
          ...entry,
          downloadId: action.payload.downloadId,
        },
      };
    },
    downloadProgressed(
      state,
      action: PayloadAction<{ modelId: ModelId; receivedBytes: number }>,
    ) {
      const entry = state.downloads[action.payload.modelId];
      if (!entry) return;
      state.downloads = {
        ...state.downloads,
        [action.payload.modelId]: {
          ...entry,
          receivedBytes: action.payload.receivedBytes,
        },
      };
    },
    downloadStatusChanged(
      state,
      action: PayloadAction<{ modelId: ModelId; status: DiscoverDownloadEntry['status'] }>,
    ) {
      const entry = state.downloads[action.payload.modelId];
      if (!entry) return;
      state.downloads = {
        ...state.downloads,
        [action.payload.modelId]: {
          ...entry,
          status: action.payload.status,
        },
      };
    },
    downloadFinished(
      state,
      action: PayloadAction<{ modelId: ModelId; status: DiscoverDownloadEntry['status'] }>,
    ) {
      const entry = state.downloads[action.payload.modelId];
      if (!entry) return;
      state.downloads = {
        ...state.downloads,
        [action.payload.modelId]: {
          ...entry,
          status: action.payload.status,
          receivedBytes:
            action.payload.status === 'completed' ? entry.totalBytes : entry.receivedBytes,
        },
      };
    },
    downloadCleared(state, action: PayloadAction<ModelId>) {
      const next = { ...state.downloads };
      delete next[action.payload];
      state.downloads = next;
    },
  },
});

export const {
  selectModel,
  categorySet,
  searchQuerySet,
  formatFilterSet,
  sortSet,
  variantSelected,
  downloadStarted,
  downloadIdAssigned,
  downloadProgressed,
  downloadStatusChanged,
  downloadFinished,
  downloadCleared,
} = discoverSlice.actions;
export const discoverReducer = discoverSlice.reducer;
