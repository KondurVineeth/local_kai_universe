import type { RootState } from '@shared/store/hooks';

export const selectLastVisitedSlug = (s: RootState): string | null =>
  s.developerDocs.lastVisitedSlug;

export const selectExpandedSections = (
  s: RootState,
): Readonly<Record<string, boolean>> => s.developerDocs.expandedSections;

export const selectSearchPanelOpen = (s: RootState): boolean =>
  s.developerDocs.searchPanelOpen;
