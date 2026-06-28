import { RIGHT_PANEL_DEFAULTS } from './slice';

import type { ModelLoadStatus } from '../../domain/value-objects/ModelLoadStatus';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';
import type { RootState } from '@shared/store/hooks';


export const selectShell = (state: RootState) => state.shell;
export const selectSecondarySidebarHidden = (state: RootState): boolean =>
  state.shell.secondarySidebarHidden;
// Reads the open state for whichever route the shell is currently on.
// Falls back to the per-route default (chat = true, others = false) when
// the user has never touched the toggle on that route.
export const selectRightPanelOpen = (state: RootState): boolean => {
  const key = state.shell.activeRouteKey;
  const persisted = state.shell.rightPanelOpenByRoute?.[key];
  if (persisted !== undefined) return persisted;
  return RIGHT_PANEL_DEFAULTS[key] ?? false;
};
export const selectActiveRouteKey = (state: RootState): string => state.shell.activeRouteKey;
export const selectLoadedModelId = (state: RootState): ModelId | null => state.shell.loadedModelId;
// True when the loaded model carries the `thinking` tag (a reasoning model).
// Resolved at load time from the model fixture; false when nothing is loaded.
export const selectLoadedModelIsReasoning = (state: RootState): boolean =>
  state.shell.loadedModelIsReasoning ?? false;
export const selectModelLoadStatus = (state: RootState): ModelLoadStatus =>
  state.shell.modelLoadStatus;
export const selectModelLoadError = (state: RootState): string | null => state.shell.modelLoadError;
export const selectLastFailedModelId = (state: RootState): ModelId | null =>
  state.shell.lastFailedModelId;
export const selectModelLoadProgressPct = (state: RootState): number =>
  state.shell.modelLoadProgressPct ?? 0;
export const selectDownloadsPanelOpen = (state: RootState): boolean =>
  state.shell.downloadsPanelOpen;
export const selectModelPickerFilter = (state: RootState) => state.shell.modelPickerFilter;
export const selectLastLoadedModelId = (state: RootState): ModelId | null =>
  state.shell.lastLoadedModelId;
export const selectModelPickerOpenSeq = (state: RootState): number =>
  state.shell.modelPickerOpenSeq;
