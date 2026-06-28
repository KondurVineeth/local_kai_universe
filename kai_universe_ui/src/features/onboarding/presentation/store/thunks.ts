import { modelInstalled } from '@features/my-models';
import { loadModelThunk } from '@features/shell';

import { RecommendStarterModels } from '../../application/use-cases/RecommendStarterModels';

import {
  hardwareDetected,
  hardwareDetectionFailed,
  hardwareDetectionStarted,
  onboardingCompleted,
  recommendationsReceived,
  setupFailed,
  setupFinished,
  setupProgressed,
  setupStarted,
  starterModelSelected,
  type OnboardingState,
} from './slice';

import type { AnyAction, ThunkAction } from '@reduxjs/toolkit';
import type { Container } from '@shared/container';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';

type OnboardingThunk<TReturn = void> = ThunkAction<
  TReturn,
  { onboarding: OnboardingState },
  Container,
  AnyAction
>;

// Runs the real hardware detection (Electron IPC) and the post-detect
// model-recommendation step. On failure, dispatches `hardwareDetectionFailed`
// so the HardwareScreen renders an actionable error with a Retry button —
// the previous fixture-on-failure catch was masking a stale-preload bug
// where the onboarding screen happily rendered fixture data forever.
export function detectHardwareThunk(): OnboardingThunk<Promise<void>> {
  return async (dispatch, _getState, container) => {
    dispatch(hardwareDetectionStarted());
    try {
      const hw = await container.systemRepository.detectHardware();
      dispatch(hardwareDetected(hw));
      const recommender = new RecommendStarterModels(container.modelRepository);
      const recs = await recommender.execute(hw);
      dispatch(recommendationsReceived(recs));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hardware detection failed.';
      dispatch(hardwareDetectionFailed(message));
    }
  };
}

// 0 → 100% over ~3.5–4.5s with eased curve. The visual contract of the
// Setup screen depends on this not finishing in <2s (would feel fake) and
// not exceeding ~5s (would feel slow). Resolves after `setupFinished` is
// dispatched so callers can chain navigation.
//
// The selected model id isn't needed here — the actual shell load happens
// in `completeOnboardingThunk` when the user clicks "Start chatting".
export function runMockDownloadThunk(): OnboardingThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(setupStarted());
    try {
      // Tick every 80ms with a slight non-linear progression — fast at the
      // start, slows down past 80% (mirrors how real downloads feel).
      const totalTicks = 50; // 50 * 80ms = 4s
      for (let i = 1; i <= totalTicks; i += 1) {
        await wait(80);
        const t = i / totalTicks;
        // ease-out cubic so the bar moves quickly early then settles.
        const eased = 1 - Math.pow(1 - t, 3);
        dispatch(setupProgressed(Math.round(eased * 100)));
      }
      dispatch(setupFinished());
    } catch (err) {
      // A thrown tick would otherwise leave `setupRunning` stuck true and
      // the Setup screen spinning forever. Surface it so the screen can
      // render an inline error with a Retry action. Not a simulated
      // failure path — purely a guard against a genuine runtime throw.
      const message = err instanceof Error ? err.message : 'Setup could not finish.';
      dispatch(setupFailed(message));
    }
  };
}

// Marks onboarding done and (if a model was picked) registers it as
// installed in My Models, then kicks off the real `loadModelThunk` from
// the shell so the chat surface is ready when the user lands. Skip path:
// just flip `completed` — caller routes to /discover so the user can pick
// a first model there.
//
// Quantization is read off the chosen model's catalogue variants — defaults
// to the first variant if none of the recommendations carried an explicit
// quant choice (the starter model screen doesn't expose per-variant
// pickers; it picks the model and we install its primary variant).
export function completeOnboardingThunk(
  selectedModelId: ModelId | null,
): OnboardingThunk<Promise<void>> {
  return async (dispatch, _getState, container) => {
    dispatch(onboardingCompleted());
    if (!selectedModelId) return;

    const model = await container.modelRepository.findById(selectedModelId);
    if (!model) {
      // Stale persisted id (catalogue churn or fixture removed). Don't ship
      // the user to /chat with an empty install ledger and a broken loaded
      // model expectation. Clear the selection so the next visit hits the
      // starter screen cleanly, and let App Shell's empty-state copy do
      // its job from there.
      dispatch(starterModelSelected(null));
      return;
    }
    const variant = model.variants.find((v) => v.recommended) ?? model.variants[0];
    const quantization = variant?.quantization;
    if (quantization) {
      dispatch(modelInstalled({ modelId: selectedModelId, quantization }));
    }
    // Fire-and-forget: the shell's load animation owns the next visual
    // beat; onboarding has nothing more to render.
    void dispatch(loadModelThunk(selectedModelId));
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
