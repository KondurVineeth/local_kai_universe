import type {
  DeviceFilter,
  LoadOverride,
  MyModelsCategory,
  RightRailTab,
} from './slice';
import type { InferenceConfig } from '@features/chat';
import type { Model } from '@shared/domain/model/entities/Model';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';
import type { RootState } from '@shared/store/hooks';

export const selectMyModelsCategory = (state: RootState): MyModelsCategory =>
  state.myModels.category;
export const selectMyModelsDeviceFilter = (state: RootState): DeviceFilter =>
  state.myModels.deviceFilter;
export const selectMyModelsSearchQuery = (state: RootState): string =>
  state.myModels.searchQuery;
export const selectMyModelsSelectedModelId = (state: RootState): ModelId | null =>
  state.myModels.selectedModelId;
export const selectMyModelsRightRailOpen = (state: RootState): boolean =>
  state.myModels.rightRailOpen;
export const selectMyModelsActiveTab = (state: RootState): RightRailTab =>
  state.myModels.activeTab;
export const selectMyModelsPinned = (state: RootState): readonly ModelId[] =>
  state.myModels.pinnedModelIds ?? [];
export const selectMyModelsLoadConfig =
  (modelId: ModelId | null) =>
  (state: RootState): LoadOverride => {
    if (!modelId) return {};
    return state.myModels.loadConfigByModel[modelId] ?? {};
  };
export const selectMyModelsInferenceOverride =
  (modelId: ModelId | null) =>
  (state: RootState): Partial<InferenceConfig> | undefined => {
    if (!modelId) return undefined;
    return state.myModels.inferenceConfigByModel[modelId];
  };

// Installed-model state — the persisted "I downloaded this" record.
export const selectInstalledModelIds = (state: RootState): readonly ModelId[] =>
  state.myModels.installedModelIds ?? [];
export const selectIsModelInstalled =
  (modelId: ModelId | null) =>
  (state: RootState): boolean => {
    if (!modelId) return false;
    return (state.myModels.installedModelIds ?? []).includes(modelId);
  };
export const selectInstalledAtFor =
  (modelId: ModelId | null) =>
  (state: RootState): string | undefined => {
    if (!modelId) return undefined;
    return state.myModels.installedAtByModel?.[modelId];
  };
export const selectInstalledQuantFor =
  (modelId: ModelId | null) =>
  (state: RootState): string | undefined => {
    if (!modelId) return undefined;
    return state.myModels.installedQuantByModel?.[modelId];
  };
const EMPTY_QUANT_MAP: Readonly<Record<string, string>> = {};
export const selectInstalledQuantByModel = (
  state: RootState,
): Readonly<Record<string, string>> =>
  state.myModels.installedQuantByModel ?? EMPTY_QUANT_MAP;
const EMPTY_INSTALLED_AT_MAP: Readonly<Record<string, string>> = {};
export const selectInstalledAtByModel = (
  state: RootState,
): Readonly<Record<string, string>> =>
  state.myModels.installedAtByModel ?? EMPTY_INSTALLED_AT_MAP;

export interface InstalledFiltersInput {
  readonly catalog: readonly Model[];
  readonly installedIds: readonly ModelId[];
  readonly installedAt: Readonly<Record<ModelId, string>>;
  readonly category: MyModelsCategory;
  readonly device: DeviceFilter;
  readonly query: string;
  readonly pinned: readonly ModelId[];
}

// Composes the visible list of installed models for the table. Catalog
// stays the source of truth for metadata; the installed set narrows it.
export function applyMyModelsFilters(input: InstalledFiltersInput): readonly Model[] {
  const { catalog, installedIds, installedAt, category, device, query, pinned } = input;
  const q = query.trim().toLowerCase();
  const installedSet = new Set(installedIds);
  const filtered = catalog.filter((m) => {
    if (!installedSet.has(m.id)) return false;
    if (!matchesCategory(m, category)) return false;
    if (!matchesDevice(device)) return false;
    if (q && !matchesQuery(m, q)) return false;
    return true;
  });
  return [...filtered].sort((a, b) => {
    const aPinned = pinned.includes(a.id);
    const bPinned = pinned.includes(b.id);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return (installedAt[b.id] ?? '').localeCompare(installedAt[a.id] ?? '');
  });
}

function matchesCategory(m: Model, category: MyModelsCategory): boolean {
  switch (category) {
    case 'all':
      return true;
    case 'llms':
      return !m.capabilities.embeddings;
    case 'embeddings':
      return m.capabilities.embeddings;
    case 'vision':
      return m.capabilities.vision;
    case 'reasoning':
      return m.capabilities.reasoning;
    case 'tools':
      return m.capabilities.tools;
  }
}

function matchesDevice(device: DeviceFilter): boolean {
  // v1: all installed models are local. Remote will land when a remote
  // device repository is wired up.
  if (device === 'all' || device === 'local') return true;
  return false;
}

function matchesQuery(m: Model, q: string): boolean {
  const hay = `${m.displayName} ${m.author} ${m.description} ${m.tags.join(' ')}`.toLowerCase();
  return hay.includes(q);
}
