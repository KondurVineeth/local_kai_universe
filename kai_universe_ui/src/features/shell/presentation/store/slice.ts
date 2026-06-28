import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ModelLoadStatus } from '../../domain/value-objects/ModelLoadStatus';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';


// Capability filter applied in the model picker. "all" shows every entry;
// the others narrow to a single capability badge.
export type ModelCapabilityFilter = 'all' | 'reasoning' | 'tools' | 'vision';

export interface ShellState {
  // The PRIMARY nav rail is always visible (56px, icon-only).
  // The SECONDARY sidebar (wider, contextual to the selected feature) can be
  // hidden by the user via SidebarCollapseToggle.
  readonly secondarySidebarHidden: boolean;
  // Per-route right-panel open state. Each top-level route remembers its
  // own collapse preference (Settings tucks the panel away by default;
  // Chat keeps it open). Routes the user has never visited fall through
  // to `RIGHT_PANEL_DEFAULTS` below.
  readonly rightPanelOpenByRoute: Readonly<Record<string, boolean>>;
  readonly activeRouteKey: string;
  readonly loadedModelId: ModelId | null;
  // Whether the currently-loaded model is a reasoning ("thinking") model —
  // derived from the model's `thinking` tag at load time (LoadModel returns
  // the full Model). Stored here so the synchronous reasoning selectors in
  // chat don't need an async repository round-trip to resolve capability.
  // Transient like `loadedModelId` (not persisted); reset on start/fail/eject.
  readonly loadedModelIsReasoning: boolean;
  readonly modelLoadStatus: ModelLoadStatus;
  readonly modelLoadError: string | null;
  // The model id whose load most recently failed. `modelLoadFailed` clears
  // `loadedModelId`, so without this the error UI has nothing to point a
  // Retry action at. Transient — not persisted.
  readonly lastFailedModelId: ModelId | null;
  // 0..100. While `modelLoadStatus === 'loading'`, ticks up over the
  // simulated 3-5s load window so the picker can render a progress bar
  // instead of an indeterminate spinner. Resets to 0 on each load start.
  readonly modelLoadProgressPct: number;
  readonly downloadsPanelOpen: boolean;
  // Model picker preferences — persisted so users don't reset their filter
  // on every restart.
  readonly modelPickerFilter: ModelCapabilityFilter;
  // Last successfully-loaded model id. Persisted across restarts so the app
  // can silently re-load the user's last choice on next launch
  // (UX-SHELL-003). `loadedModelId`, `modelLoadStatus`, and `modelLoadError`
  // are transient runtime state and are intentionally NOT persisted; see
  // persist.ts shellOnlyUserPrefsTransform.
  readonly lastLoadedModelId: ModelId | null;
  // Monotonic counter incremented when ANY feature requests the global model
  // picker to open — chat's CTAs (UX-CHAT-001/004) and the ⌘L shortcut
  // (UX-SHELL-008) both bump it. The picker subscribes via useEffect and
  // opens when the value changes. A counter (vs a boolean) lets back-to-back
  // requests re-open even if the picker is mid-close. Not persisted —
  // transient cross-feature signal.
  readonly modelPickerOpenSeq: number;
}

// Default open/closed-ness when a route hasn't been visited before. Chat is
// the only surface that benefits from the inference panel by default; the
// rest are content-first.
export const RIGHT_PANEL_DEFAULTS: Readonly<Record<string, boolean>> = {
  chat: true,
  discover: false,
  'my-models': false,
  'local-server': false,
  'developer-docs': true,
  remote: true,
  settings: false,
  onboarding: false,
};

const initialState: ShellState = {
  secondarySidebarHidden: false,
  rightPanelOpenByRoute: { ...RIGHT_PANEL_DEFAULTS },
  activeRouteKey: 'chat',
  loadedModelId: null,
  loadedModelIsReasoning: false,
  modelLoadStatus: 'idle',
  modelLoadError: null,
  lastFailedModelId: null,
  modelLoadProgressPct: 0,
  downloadsPanelOpen: false,
  modelPickerFilter: 'all',
  lastLoadedModelId: null,
  modelPickerOpenSeq: 0,
};

export const shellSlice = createSlice({
  name: 'shell',
  initialState,
  reducers: {
    secondarySidebarToggled(state) {
      state.secondarySidebarHidden = !state.secondarySidebarHidden;
    },
    secondarySidebarHiddenSet(state, action: PayloadAction<boolean>) {
      state.secondarySidebarHidden = action.payload;
    },
    // Toggles the open state of the CURRENT active route. Reads
    // activeRouteKey from state itself so the keyboard shortcut and
    // header-toggle don't have to know which route they're on.
    rightPanelToggled(state) {
      const key = state.activeRouteKey;
      const cur =
        state.rightPanelOpenByRoute[key] ?? RIGHT_PANEL_DEFAULTS[key] ?? true;
      state.rightPanelOpenByRoute = {
        ...state.rightPanelOpenByRoute,
        [key]: !cur,
      };
    },
    rightPanelOpenSet(state, action: PayloadAction<boolean>) {
      state.rightPanelOpenByRoute = {
        ...state.rightPanelOpenByRoute,
        [state.activeRouteKey]: action.payload,
      };
    },
    setRightPanelOpenForRoute(
      state,
      action: PayloadAction<{ route: string; open: boolean }>,
    ) {
      state.rightPanelOpenByRoute = {
        ...state.rightPanelOpenByRoute,
        [action.payload.route]: action.payload.open,
      };
    },
    activeRouteSet(state, action: PayloadAction<string>) {
      state.activeRouteKey = action.payload;
    },
    modelLoadStarted(state, action: PayloadAction<{ readonly modelId: ModelId }>) {
      state.modelLoadStatus = 'loading';
      state.loadedModelId = action.payload.modelId;
      // Unknown until the load resolves; the pill stays gated while loading.
      state.loadedModelIsReasoning = false;
      state.modelLoadError = null;
      state.lastFailedModelId = null;
      state.modelLoadProgressPct = 0;
    },
    modelLoadProgressed(state, action: PayloadAction<number>) {
      state.modelLoadProgressPct = Math.max(0, Math.min(100, action.payload));
    },
    modelLoadSucceeded(
      state,
      action: PayloadAction<{ readonly modelId: ModelId; readonly isReasoning: boolean }>,
    ) {
      state.modelLoadStatus = 'loaded';
      state.loadedModelId = action.payload.modelId;
      state.loadedModelIsReasoning = action.payload.isReasoning;
      state.modelLoadError = null;
      state.lastFailedModelId = null;
      state.modelLoadProgressPct = 100;
      state.lastLoadedModelId = action.payload.modelId;
    },
    loadedModelSelected(
      state,
      action: PayloadAction<{
        readonly modelId: ModelId;
        readonly isReasoning: boolean;
      }>
    ) {
      state.loadedModelId = action.payload.modelId;
      state.loadedModelIsReasoning = action.payload.isReasoning;

      // This model is already loaded on the backend.
      state.modelLoadStatus = "loaded";
      state.modelLoadError = null;
      state.modelLoadProgressPct = 100;
    },
    modelLoadFailed(
      state,
      action: PayloadAction<{ readonly message: string; readonly modelId?: ModelId }>,
    ) {
      state.modelLoadStatus = 'error';
      state.loadedModelId = null;
      state.loadedModelIsReasoning = false;
      state.modelLoadError = action.payload.message;
      state.lastFailedModelId = action.payload.modelId ?? state.lastFailedModelId;
      state.modelLoadProgressPct = 0;
    },
    // Clears a failed-load error without starting a new load — the "dismiss"
    // affordance on the picker's error banner. Returns the lifecycle to
    // `idle` so the trigger label stops showing the red error state.
    modelLoadErrorCleared(state) {
      if (state.modelLoadStatus === 'error') {
        state.modelLoadStatus = 'idle';
      }
      state.modelLoadError = null;
      state.lastFailedModelId = null;
    },
    modelEjectStarted(state) {
      // Transient state — `loadedModelId` is preserved so the picker label
      // can show the model name + "Ejecting…" before the slice clears it
      // on `modelEjected`. See ModelLoadStatus comment.
      state.modelLoadStatus = 'unloading';
    },
    modelEjected(state) {
      state.modelLoadStatus = 'idle';
      state.loadedModelId = null;
      state.loadedModelIsReasoning = false;
      state.modelLoadError = null;
      // Explicit user eject = "I want nothing loaded right now". Clear the
      // auto-restore hint so the next launch doesn't silently undo their
      // choice (UX-SHELL-003).
      state.lastLoadedModelId = null;
    },
    downloadsPanelToggled(state) {
      state.downloadsPanelOpen = !state.downloadsPanelOpen;
    },
    downloadsPanelOpenSet(state, action: PayloadAction<boolean>) {
      state.downloadsPanelOpen = action.payload;
    },
    modelPickerFilterSet(state, action: PayloadAction<ModelCapabilityFilter>) {
      state.modelPickerFilter = action.payload;
    },
    modelPickerOpenRequested(state) {
      state.modelPickerOpenSeq += 1;
    },
  },
});

export const {
  secondarySidebarToggled,
  secondarySidebarHiddenSet,
  rightPanelToggled,
  rightPanelOpenSet,
  setRightPanelOpenForRoute,
  activeRouteSet,
  modelLoadStarted,
  modelLoadProgressed,
  modelLoadSucceeded,
  loadedModelSelected,
  modelLoadFailed,
  modelLoadErrorCleared,
  modelEjectStarted,
  modelEjected,
  downloadsPanelToggled,
  downloadsPanelOpenSet,
  modelPickerFilterSet,
  modelPickerOpenRequested,
} = shellSlice.actions;
export const shellReducer = shellSlice.reducer;
