import type { DiscoverCategory, DiscoverFormatFilter, DiscoverSort, DiscoverState } from './slice';
import type { Model } from '@shared/domain/model/entities/Model';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';
import type { Quantization } from '@shared/domain/model/value-objects/Quantization';
import type { RootState } from '@shared/store/hooks';

export const selectSelectedModelId = (state: RootState) =>
    state.discover.selectedModelId;
export const selectDiscoverCategory = (state: RootState): DiscoverCategory =>
  state.discover.category;
export const selectDiscoverSearchQuery = (state: RootState): string =>
  state.discover.searchQuery;
export const selectDiscoverFormatFilter = (state: RootState): DiscoverFormatFilter =>
  state.discover.formatFilter;
export const selectDiscoverSort = (state: RootState): DiscoverSort => state.discover.sort;
export const selectDiscoverSelectedModelId = (state: RootState): ModelId | null =>
  state.discover.selectedModelId;
export const selectDiscoverSelectedVariant =
  (modelId: ModelId | null) =>
  (state: RootState): Quantization | null => {
    if (!modelId) return null;
    return state.discover.selectedVariantByModel[modelId] ?? null;
  };
export const selectDiscoverDownloads = (state: RootState): DiscoverState['downloads'] =>
  state.discover.downloads;
export const selectDiscoverDownloadFor =
  (modelId: ModelId | null) =>
  (state: RootState) => {
    if (!modelId) return null;
    return state.discover.downloads[modelId] ?? null;
  };

// Pure filter/sort pipeline. Lives in selectors so list + detail share the
// same materialised result.
export function applyDiscoverFilters(
  models: readonly Model[],
  category: DiscoverCategory,
  query: string,
  format: DiscoverFormatFilter,
  sort: DiscoverSort,
): readonly Model[] {
  const q = query.trim().toLowerCase();
  const filtered = models.filter((m) => {
    if (!matchesCategory(m, category)) return false;
    if (!matchesFormat(m, format)) return false;
    if (q && !matchesQuery(m, q)) return false;
    return true;
  });
  return sortModels(filtered, sort);
}

function matchesCategory(m: Model, category: DiscoverCategory): boolean {
  switch (category) {
    case 'staff-picks':
      return m.staffPick;
    case 'all':
      return true;
    case 'llms':
      return !m.capabilities.embeddings;
    case 'embeddings':
      return m.capabilities.embeddings;
    case 'vision':
      return m.capabilities.vision;
    case 'tools':
      return m.capabilities.tools;
    case 'reasoning':
      return m.capabilities.reasoning;
  }
}

function matchesFormat(m: Model, format: DiscoverFormatFilter): boolean {
  if (format === 'all') return true;
  return m.variants.some((v) => v.format === format);
}

function matchesQuery(m: Model, q: string): boolean {
  const hay = `${m.displayName} ${m.author} ${m.description} ${m.tags.join(' ')}`.toLowerCase();
  return hay.includes(q);
}

function sortModels(models: readonly Model[], sort: DiscoverSort): readonly Model[] {
  const arr = [...models];
  if (sort === 'most-downloaded') {
    arr.sort((a, b) => b.downloadCount - a.downloadCount);
  } else if (sort === 'newest') {
    arr.sort((a, b) => (b.publishedAt > a.publishedAt ? 1 : -1));
  } else {
    // best-match: staff picks first, then downloads as tiebreaker
    arr.sort((a, b) => {
      if (a.staffPick !== b.staffPick) return a.staffPick ? -1 : 1;
      return b.downloadCount - a.downloadCount;
    });
  }
  return arr;
}
