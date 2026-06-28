import { CheckCircle, Sparkle, Warning } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Icon, ProgressBar } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectOnboardingProgressPct,
  selectOnboardingRecommendations,
  selectOnboardingSelectedModelId,
  selectOnboardingSetupError,
  selectOnboardingSetupRunning,
} from '../../store/selectors';
import { stepReached } from '../../store/slice';
import { completeOnboardingThunk, runMockDownloadThunk } from '../../store/thunks';

// Final screen. Auto-runs the mock download on mount; once complete, the
// user clicks "Start chatting" which fires the real `loadModelThunk` (via
// `completeOnboardingThunk`) and navigates to /chat.
export function SetupScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const running = useAppSelector(selectOnboardingSetupRunning);
  const pct = useAppSelector(selectOnboardingProgressPct);
  const selectedId = useAppSelector(selectOnboardingSelectedModelId);
  const setupError = useAppSelector(selectOnboardingSetupError);
  const recs = useAppSelector(selectOnboardingRecommendations);
  const selectedRec = recs.find((r) => r.modelId === selectedId);

  useEffect(() => {
    dispatch(stepReached('setup'));
    // No model selected? The Setup screen has nothing to do — bounce back
    // to the model picker step instead of stalling at "Preparing your
    // workspace…" / 0% forever. The Starter Model screen now self-bootstraps
    // its recommendations on a cold deep-link, so this is a one-hop recovery,
    // not a bounce loop. UX2-ONBO-011.
    if (!selectedId) {
      navigate('/onboarding/model', { replace: true });
      return;
    }
    // Don't auto-restart after a failure — the user drives Retry explicitly.
    if (!running && pct === 0 && !setupError) {
      void dispatch(runMockDownloadThunk());
    }
  }, [dispatch, navigate, selectedId, running, pct, setupError]);

  const done = pct === 100 && !running && !setupError;

  const onStart = async () => {
    await dispatch(completeOnboardingThunk(selectedId));
    navigate('/chat', { replace: true });
  };

  const onRetry = () => {
    void dispatch(runMockDownloadThunk());
  };

  if (setupError) {
    return (
      <div className="flex flex-col items-center gap-3xl text-center">
        <Icon icon={Warning} size="lg" className="text-danger" weight="fill" />
        <div className="flex flex-col gap-m">
          <h2 className="text-xl font-bold text-fg-default">Setup didn&apos;t finish</h2>
          <p className="text-sm text-fg-muted">{setupError}</p>
        </div>
        <Button variant="primary" size="md" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3xl text-center">
      {done ? (
        <Icon icon={CheckCircle} size="lg" className="text-success" weight="fill" />
      ) : (
        <Icon icon={Sparkle} size="lg" className="text-accent animate-pulse" weight="fill" />
      )}
      <div className="flex flex-col gap-m">
        <h2 className="text-xl font-bold text-fg-default">
          {done ? 'Universe is ready' : 'Setting up Universe…'}
        </h2>
        <p className="text-sm text-fg-muted">
          {done
            ? `Your starter model is loaded. You can change it anytime from the model picker at the top.`
            : selectedRec
              ? `Downloading ${selectedRec.author}/${selectedRec.displayName} — this is a one-time setup.`
              : 'Preparing your workspace…'}
        </p>
      </div>
      <div className="w-full max-w-md">
        <ProgressBar value={pct} aria-label="Setup progress" />
        <div className="mt-s flex justify-between text-caption text-fg-subtle">
          <span>{done ? 'Complete' : 'Downloading'}</span>
          <span>{pct}%</span>
        </div>
      </div>
      <Button variant="primary" size="md" disabled={!done} onClick={() => void onStart()}>
        {done ? 'Start chatting' : 'Please wait…'}
      </Button>
    </div>
  );
}
