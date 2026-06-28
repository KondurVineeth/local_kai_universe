import type { OnboardingStep, OnboardingState } from './slice';
import type { StarterRecommendation } from '../../domain/entities/StarterRecommendation';
import type { UserMode } from '../../domain/value-objects/UserMode';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';
import type { HardwareSpec } from '@shared/domain/system/entities/HardwareSpec';
import type { RootState } from '@shared/store/hooks';

const EMPTY_RECS: readonly StarterRecommendation[] = Object.freeze([]);

export const selectOnboardingCompleted = (state: RootState): boolean =>
  state.onboarding.completed;

export const selectOnboardingLastStep = (state: RootState): OnboardingStep =>
  state.onboarding.lastStep;

export const selectOnboardingMode = (state: RootState): UserMode =>
  state.onboarding.mode;

export const selectOnboardingHardware = (state: RootState): HardwareSpec | null =>
  state.onboarding.hardware;

export const selectOnboardingHardwareDetecting = (state: RootState): boolean =>
  state.onboarding.hardwareDetecting;

export const selectOnboardingHardwareError = (state: RootState): string | null =>
  state.onboarding.hardwareError ?? null;

export const selectOnboardingRecommendations = (
  state: RootState,
): readonly StarterRecommendation[] =>
  state.onboarding.recommendationsLoaded ? state.onboarding.recommendations : EMPTY_RECS;

export const selectOnboardingRecommendationsLoaded = (state: RootState): boolean =>
  state.onboarding.recommendationsLoaded;

export const selectOnboardingSelectedModelId = (state: RootState): ModelId | null =>
  state.onboarding.selectedModelId;

export const selectOnboardingSetupRunning = (state: RootState): boolean =>
  state.onboarding.setupRunning;

export const selectOnboardingProgressPct = (state: RootState): number =>
  state.onboarding.progressPct;

export const selectOnboardingSetupError = (state: RootState): string | null =>
  state.onboarding.setupError ?? null;

export const selectOnboardingState = (state: RootState): OnboardingState =>
  state.onboarding;
