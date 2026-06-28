import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { InferenceConfig } from '@features/chat';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';
import type { Iso8601 } from '@shared/domain/primitives/Iso8601';

export type MyModelsCategory =
  | 'all'
  | 'llms'
  | 'embeddings'
  | 'vision'
  | 'reasoning'
  | 'tools';
export type DeviceFilter = 'all' | 'local' | 'remote';
export type RightRailTab = 'info' | 'load' | 'inference';

export interface LoadOverride {
  readonly contextLength?: number;
  readonly maxConcurrent?: number;
  readonly seed?: number | null;
  readonly kvCacheQuantization?: boolean;
  readonly gpuOffloadPct?: number; // 0..100, % of layers to offload to GPU
  readonly sourceFileOverrideEnabled?: boolean;
  readonly sourceFileOverridePath?: string;
}

export interface MyModelsState {
  readonly category: MyModelsCategory;
  readonly deviceFilter: DeviceFilter;
  readonly searchQuery: string;
  readonly selectedModelId: ModelId | null;
  readonly rightRailOpen: boolean;
  readonly activeTab: RightRailTab;
  readonly pinnedModelIds: readonly ModelId[];
  readonly loadConfigByModel: Readonly<Record<ModelId, LoadOverride>>;
  readonly inferenceConfigByModel: Readonly<Record<ModelId, Partial<InferenceConfig>>>;
  // Persisted installation state — the user's "I downloaded this model"
  // record. Survives reload via redux-persist whitelist. The catalog
  // (fixture) is the source of truth for what models EXIST; this is what
  // they OWN locally.
  readonly installedModelIds: readonly ModelId[];
  readonly installedAtByModel: Readonly<Record<ModelId, Iso8601>>;
  readonly installedQuantByModel: Readonly<Record<ModelId, string>>;
}

const initialState: MyModelsState = {
  category: 'all',
  deviceFilter: 'all',
  searchQuery: '',
  selectedModelId: null,
  rightRailOpen: false,
  activeTab: 'info',
  pinnedModelIds: [],
  loadConfigByModel: {},
  inferenceConfigByModel: {},
  installedModelIds: [],
  installedAtByModel: {},
  installedQuantByModel: {},
};

export const myModelsSlice = createSlice({
  name: 'myModels',
  initialState,
  reducers: {
    categorySet(state, action: PayloadAction<MyModelsCategory>) {
      state.category = action.payload;
    },
    deviceFilterSet(state, action: PayloadAction<DeviceFilter>) {
      state.deviceFilter = action.payload;
    },
    searchQuerySet(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    selectModel(state, action: PayloadAction<ModelId | null>) {
      state.selectedModelId = action.payload;
      state.rightRailOpen = action.payload !== null;
    },
    rightRailClosed(state) {
      state.rightRailOpen = false;
      state.selectedModelId = null;
    },
    tabSet(state, action: PayloadAction<RightRailTab>) {
      state.activeTab = action.payload;
    },
    pinToggled(state, action: PayloadAction<ModelId>) {
      const id = action.payload;
      state.pinnedModelIds = state.pinnedModelIds.includes(id)
        ? state.pinnedModelIds.filter((p) => p !== id)
        : [...state.pinnedModelIds, id];
    },
    loadConfigSet(
      state,
      action: PayloadAction<{ modelId: ModelId; patch: Partial<LoadOverride> }>,
    ) {
      const current = state.loadConfigByModel[action.payload.modelId] ?? {};
      state.loadConfigByModel = {
        ...state.loadConfigByModel,
        [action.payload.modelId]: { ...current, ...action.payload.patch },
      };
    },
    loadConfigReset(state, action: PayloadAction<ModelId>) {
      // Drop the per-model override entirely — the tab then falls back to
      // the catalogue/engine defaults its `?? default` reads already use.
      const next = { ...state.loadConfigByModel };
      delete next[action.payload];
      state.loadConfigByModel = next;
    },
    inferenceConfigPatched(
      state,
      action: PayloadAction<{ modelId: ModelId; patch: Partial<InferenceConfig> }>,
    ) {
      const current = state.inferenceConfigByModel[action.payload.modelId] ?? {};
      state.inferenceConfigByModel = {
        ...state.inferenceConfigByModel,
        [action.payload.modelId]: { ...current, ...action.payload.patch },
      };
    },
    inferenceConfigReset(state, action: PayloadAction<ModelId>) {
      const next = { ...state.inferenceConfigByModel };
      delete next[action.payload];
      state.inferenceConfigByModel = next;
    },
    modelInstalled(
      state,
      action: PayloadAction<{ modelId: ModelId; quantization: string }>,
    ) {
      const { modelId, quantization } = action.payload;
      if (!state.installedModelIds.includes(modelId)) {
        state.installedModelIds = [...state.installedModelIds, modelId];
      }
      state.installedAtByModel = {
        ...state.installedAtByModel,
        [modelId]: new Date().toISOString() as Iso8601,
      };
      state.installedQuantByModel = {
        ...state.installedQuantByModel,
        [modelId]: quantization,
      };
    },
    modelUninstalled(state, action: PayloadAction<ModelId>) {
      const id = action.payload;
      state.installedModelIds = state.installedModelIds.filter((x) => x !== id);
      const at = { ...state.installedAtByModel };
      delete at[id];
      state.installedAtByModel = at;
      const q = { ...state.installedQuantByModel };
      delete q[id];
      state.installedQuantByModel = q;
      state.pinnedModelIds = state.pinnedModelIds.filter((x) => x !== id);
    },
  },
});

export const {
  categorySet,
  deviceFilterSet,
  searchQuerySet,
  selectModel,
  rightRailClosed,
  tabSet,
  pinToggled,
  loadConfigSet,
  loadConfigReset,
  inferenceConfigPatched,
  inferenceConfigReset,
  modelInstalled,
  modelUninstalled,
} = myModelsSlice.actions;
export const myModelsReducer = myModelsSlice.reducer;
