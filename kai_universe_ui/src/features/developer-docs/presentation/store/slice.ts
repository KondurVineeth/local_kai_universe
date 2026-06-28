import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { COLLAPSIBLE_SECTIONS } from '../../domain/value-objects/DocSection';

export interface DeveloperDocsState {
  readonly lastVisitedSlug: string | null;
  readonly expandedSections: Readonly<Record<string, boolean>>;
  readonly searchPanelOpen: boolean;
}

const initialExpanded: Readonly<Record<string, boolean>> = Object.fromEntries(
  COLLAPSIBLE_SECTIONS.map((s) => [s, true]),
);

const initialState: DeveloperDocsState = {
  lastVisitedSlug: null,
  expandedSections: initialExpanded,
  searchPanelOpen: true,
};

export const developerDocsSlice = createSlice({
  name: 'developerDocs',
  initialState,
  reducers: {
    lastVisitedSlugSet(state, action: PayloadAction<string>) {
      state.lastVisitedSlug = action.payload;
    },
    sectionToggled(state, action: PayloadAction<string>) {
      const key = action.payload;
      const cur = state.expandedSections[key] ?? true;
      state.expandedSections = { ...state.expandedSections, [key]: !cur };
    },
    searchPanelOpenSet(state, action: PayloadAction<boolean>) {
      state.searchPanelOpen = action.payload;
    },
    searchPanelToggled(state) {
      state.searchPanelOpen = !state.searchPanelOpen;
    },
  },
});

export const {
  lastVisitedSlugSet,
  sectionToggled,
  searchPanelOpenSet,
  searchPanelToggled,
} = developerDocsSlice.actions;
export const developerDocsReducer = developerDocsSlice.reducer;
