import { onboardingRoutes } from './presentation/routes';
import { onboardingReducer, onboardingSlice } from './presentation/store/slice';

import type { OnboardingState } from './presentation/store/slice';
import type { SharedContainer } from '@shared/container';


export interface OnboardingContainer {
  // populated as feature wires its repositories, simulators, and use cases
  readonly _onboardingMarker?: undefined;
}

export function wireOnboardingContainer(_shared: SharedContainer): OnboardingContainer {
  return {};
}

// Augment the global Container type with this feature's slice.
declare module '@shared/container' {
  interface ContainerExtensions {
    readonly onboarding: OnboardingContainer;
  }
}

// Register this feature's slice on the global RootStateShape.
declare module '@shared/store/hooks' {
  interface RootStateShape {
    readonly onboarding: OnboardingState;
  }
}


// Public surface — only barrel-level exports
export { onboardingReducer, onboardingSlice };
export { onboardingRoutes };
export {
  selectOnboardingCompleted,
  selectOnboardingLastStep,
  selectOnboardingMode,
  selectOnboardingHardware,
  selectOnboardingHardwareDetecting,
  selectOnboardingRecommendations,
  selectOnboardingRecommendationsLoaded,
  selectOnboardingSelectedModelId,
  selectOnboardingSetupRunning,
  selectOnboardingProgressPct,
  selectOnboardingState,
} from './presentation/store/selectors';
export {
  onboardingCompleted,
  onboardingReset,
  modeSelected,
  starterModelSelected,
  stepReached,
} from './presentation/store/slice';
export {
  detectHardwareThunk,
  runMockDownloadThunk,
  completeOnboardingThunk,
} from './presentation/store/thunks';
export type { OnboardingState, OnboardingStep } from './presentation/store/slice';
export type { UserMode } from './domain/value-objects/UserMode';
export type {
  StarterRecommendation,
  StarterTier,
} from './domain/entities/StarterRecommendation';
