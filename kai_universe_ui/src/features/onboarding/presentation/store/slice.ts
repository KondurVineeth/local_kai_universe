import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { StarterRecommendation } from '../../domain/entities/StarterRecommendation';
import type { UserMode } from '../../domain/value-objects/UserMode';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';
import type { HardwareSpec } from '@shared/domain/system/entities/HardwareSpec';

// Linear progression through the onboarding flow. The router maps each
// step to a screen; back/forward is allowed via the layout's chevron and
// the slice's step pointer.
export const ONBOARDING_STEPS = [
  'welcome',
  'mode',
  'hardware',
  'model',
  'setup',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export interface OnboardingState {
  // Whether the user has finished or skipped onboarding. Persisted — once
  // true, the boot guard skips the onboarding routes entirely.
  readonly completed: boolean;
  // Tracks the last step the user reached so a reload mid-onboarding lands
  // them where they left off. Persisted alongside `completed`.
  readonly lastStep: OnboardingStep;

  // Working state collected as the user progresses. Cleared on `reset`.
  readonly mode: UserMode;
  readonly hardware: HardwareSpec | null;
  readonly hardwareDetecting: boolean;
  // Surfaced by the HardwareScreen when the real detection bridge isn't
  // available. Used to be silently masked by a fixture fallback; the loud
  // path now reaches the UI so a stale-preload regression is visible.
  readonly hardwareError: string | null;
  readonly recommendations: readonly StarterRecommendation[];
  readonly recommendationsLoaded: boolean;
  readonly selectedModelId: ModelId | null;
  // 0..100 inclusive. `setupRunning` flips on while the mock download
  // streams progress; flips off once `progressPct === 100`.
  readonly setupRunning: boolean;
  readonly progressPct: number;
  // Set when the mock download tick loop throws unexpectedly. Surfaced by
  // SetupScreen as an inline error with a Retry action so a thrown tick
  // can't leave `setupRunning` stuck true with no recovery path. Cleared
  // on `setupStarted` (Retry).
  readonly setupError: string | null;
}

const initialState: OnboardingState = {
  completed: false,
  lastStep: 'welcome',
  mode: 'user',
  hardware: null,
  hardwareDetecting: false,
  hardwareError: null,
  recommendations: [],
  recommendationsLoaded: false,
  selectedModelId: null,
  setupRunning: false,
  progressPct: 0,
  setupError: null,
};

export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    stepReached(state, action: PayloadAction<OnboardingStep>) {
      // Monotonic — only advance, never regress. Otherwise back-navigation
      // (e.g. Mode → Welcome) would reset `lastStep` to 'welcome', and a
      // mid-flow reload would land the user back at the start instead of
      // resuming where they actually were. UX2-ONBO-002.
      const incoming = ONBOARDING_STEPS.indexOf(action.payload);
      const current = ONBOARDING_STEPS.indexOf(state.lastStep);
      if (incoming > current) state.lastStep = action.payload;
    },
    modeSelected(state, action: PayloadAction<UserMode>) {
      state.mode = action.payload;
    },
    hardwareDetectionStarted(state) {
      state.hardwareDetecting = true;
      state.hardwareError = null;
    },
    hardwareDetected(state, action: PayloadAction<HardwareSpec>) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state.hardware as any) = JSON.parse(JSON.stringify(action.payload));
      state.hardwareDetecting = false;
      state.hardwareError = null;
      // A fresh hardware probe invalidates previous recommendations, which
      // also invalidates any previously-selected starter id (it may not even
      // exist in the new rec set). Clear the selection so the StarterModel
      // screen's default-selection effect can pick from the new list — and
      // SetupScreen never advances with a stale id that findById can't
      // resolve.
      state.selectedModelId = null;
    },
    hardwareDetectionFailed(state, action: PayloadAction<string>) {
      state.hardwareDetecting = false;
      state.hardwareError = action.payload;
    },
    recommendationsReceived(
      state,
      action: PayloadAction<readonly StarterRecommendation[]>,
    ) {
      // Same readonly-stripping reason as above. The payload is a freshly
      // computed array; cloning is cheap and keeps Immer happy.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state.recommendations as any) = action.payload.map((r) => ({ ...r }));
      state.recommendationsLoaded = true;
      // Defence in depth: if a stale `selectedModelId` survived the hardware
      // probe (e.g. via persisted state on a cold boot before any probe ran)
      // and isn't present in the freshly-computed recommendations, drop it
      // so the screen's default-selection effect can re-pick.
      if (state.selectedModelId) {
        const stillPresent = action.payload.some(
          (r) => r.modelId === state.selectedModelId,
        );
        if (!stillPresent) state.selectedModelId = null;
      }
    },
    starterModelSelected(state, action: PayloadAction<ModelId | null>) {
      state.selectedModelId = action.payload;
    },
    setupStarted(state) {
      state.setupRunning = true;
      state.progressPct = 0;
      state.setupError = null;
    },
    setupProgressed(state, action: PayloadAction<number>) {
      // Clamp [0,100]; tolerate slightly out-of-range values from the timer.
      state.progressPct = Math.max(0, Math.min(100, action.payload));
    },
    setupFinished(state) {
      state.setupRunning = false;
      state.progressPct = 100;
    },
    setupFailed(state, action: PayloadAction<string>) {
      // Clears `setupRunning` so the screen leaves the spinner state and
      // can render an actionable error instead of stalling forever.
      state.setupRunning = false;
      state.setupError = action.payload;
    },
    onboardingCompleted(state) {
      state.completed = true;
    },
    onboardingReset(state) {
      // Used by Settings → "Replay onboarding". Keeps `mode` because the
      // user's earlier choice is still meaningful; everything else clears.
      state.completed = false;
      state.lastStep = 'welcome';
      state.hardware = null;
      state.hardwareDetecting = false;
      state.hardwareError = null;
      state.recommendations = [];
      state.recommendationsLoaded = false;
      state.selectedModelId = null;
      state.setupRunning = false;
      state.progressPct = 0;
      state.setupError = null;
    },
  },
});

export const {
  stepReached,
  modeSelected,
  hardwareDetectionStarted,
  hardwareDetected,
  hardwareDetectionFailed,
  recommendationsReceived,
  starterModelSelected,
  setupStarted,
  setupProgressed,
  setupFinished,
  setupFailed,
  onboardingCompleted,
  onboardingReset,
} = onboardingSlice.actions;
export const onboardingReducer = onboardingSlice.reducer;
