import { CaretLeft, Check, Warning } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge, Button, Icon, Spinner } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectOnboardingHardwareDetecting,
  selectOnboardingRecommendations,
  selectOnboardingRecommendationsLoaded,
  selectOnboardingSelectedModelId,
} from '../../store/selectors';
import { onboardingCompleted, starterModelSelected, stepReached } from '../../store/slice';
import { detectHardwareThunk } from '../../store/thunks';

import type { StarterRecommendation, StarterTier } from '../../../domain/entities/StarterRecommendation';

// Side effects for the Starter Model screen: marks the step reached,
// self-bootstraps recommendations on a cold deep-link, and applies the
// default selection once recommendations land.
function useStarterModelBootstrap(
  recommendations: readonly StarterRecommendation[],
  loaded: boolean,
  detecting: boolean,
  selectedId: ReturnType<typeof selectOnboardingSelectedModelId>,
) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(stepReached('model'));
  }, [dispatch]);

  // Self-bootstrap: a deep-link or reload straight onto /onboarding/model
  // skips the Hardware screen, so recommendations are never computed and
  // the screen spins "Picking starter models…" forever. Kick off hardware
  // detection here when nothing is loaded — detectHardwareThunk computes
  // recommendations as its second step, so the screen resolves itself.
  useEffect(() => {
    if (!loaded && !detecting) {
      void dispatch(detectHardwareThunk());
    }
  }, [loaded, detecting, dispatch]);

  // Default selection: the first recommendation that fits the hardware.
  useEffect(() => {
    if (selectedId || recommendations.length === 0) return;
    const firstFit = recommendations.find((r) => r.fitsHardware) ?? recommendations[0];
    if (firstFit) dispatch(starterModelSelected(firstFit.modelId));
  }, [recommendations, selectedId, dispatch]);
}

// Three cards: small / balanced / large. The default selection on mount is
// the first recommendation that fits the detected hardware (typically the
// balanced one — preference-by-fit, falls back to first available).
export function StarterModelScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const recommendations = useAppSelector(selectOnboardingRecommendations);
  const loaded = useAppSelector(selectOnboardingRecommendationsLoaded);
  const detecting = useAppSelector(selectOnboardingHardwareDetecting);
  const selectedId = useAppSelector(selectOnboardingSelectedModelId);

  useStarterModelBootstrap(recommendations, loaded, detecting, selectedId);

  const onSkip = () => {
    // Finish onboarding without installing any model. Route to /discover —
    // user can browse the catalogue and pick a first model from there.
    // /chat would land them on the empty welcome state with no obvious next
    // step.
    dispatch(starterModelSelected(null));
    dispatch(onboardingCompleted());
    navigate('/discover', { replace: true });
  };

  const onContinue = () => {
    if (!selectedId) return;
    navigate('/onboarding/setup');
  };

  if (!loaded) {
    return (
      <div className="flex flex-col items-center gap-m py-3xl">
        <Spinner size="md" />
        <p className="text-sm text-fg-muted">Picking starter models…</p>
      </div>
    );
  }

  // Empty-recs dead end: when the catalogue produces zero starter candidates
  // (e.g. all models filtered out for the detected hardware), the previous
  // version rendered an empty card list with a disabled Continue button and
  // no escape. Surface the situation and route the user to Discover.
  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col gap-3xl">
        <div className="flex flex-col gap-m text-center">
          <h2 className="text-xl font-bold text-fg-default">No starter models for your hardware</h2>
          <p className="text-sm text-fg-muted">
            We couldn&apos;t pre-pick a model that fits this machine. Browse the full
            catalogue in Discover and install whichever one looks right.
          </p>
        </div>
        <div className="flex justify-center">
          <Button variant="primary" size="md" onClick={onSkip}>
            Browse Discover
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3xl">
      <div className="flex flex-col gap-m text-center">
        <h2 className="text-xl font-bold text-fg-default">Pick a starter model</h2>
        <p className="text-sm text-fg-muted">
          You can install more later from the Discover tab.
        </p>
      </div>
      <div className="flex flex-col gap-m">
        {recommendations.map((rec) => (
          <ModelCard
            key={rec.modelId}
            rec={rec}
            selected={selectedId === rec.modelId}
            onSelect={() => dispatch(starterModelSelected(rec.modelId))}
          />
        ))}
      </div>
      <StarterModelActions
        onBack={() => navigate('/onboarding/hardware')}
        onSkip={onSkip}
        onContinue={onContinue}
        continueDisabled={!selectedId}
      />
    </div>
  );
}

// Footer action row: Back on the left; Skip + Continue grouped on the right.
function StarterModelActions({
  onBack,
  onSkip,
  onContinue,
  continueDisabled,
}: {
  readonly onBack: () => void;
  readonly onSkip: () => void;
  readonly onContinue: () => void;
  readonly continueDisabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-m">
      <Button
        variant="ghost"
        size="md"
        leadingIcon={<Icon icon={CaretLeft} size="sm" weight="bold" />}
        onClick={onBack}
      >
        Back
      </Button>
      <div className="flex items-center gap-m">
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip &mdash; I&apos;ll browse later
        </Button>
        <div className="flex flex-col items-end gap-xs">
          <Button variant="primary" size="md" disabled={continueDisabled} onClick={onContinue}>
            Continue
          </Button>
          {continueDisabled && (
            <span className="text-caption text-fg-subtle">
              Pick a model above to continue.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ModelCardProps {
  readonly rec: StarterRecommendation;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

function ModelCard({ rec, selected, onSelect }: ModelCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex items-center gap-l rounded-md border bg-bg-surface p-l text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        selected
          ? 'border-accent bg-accent/10 ring-2 ring-accent/30'
          : 'border-border-default hover:border-border-strong hover:bg-bg-raised',
        !rec.fitsHardware && 'opacity-70',
      )}
    >
      <TierBadge tier={rec.tier} />
      <div className="flex min-w-0 flex-1 flex-col gap-xs">
        <div className="flex items-center gap-s">
          <span className="truncate text-base font-semibold text-fg-default">
            {rec.author}/{rec.displayName}
          </span>
          <Badge tone="neutral" size="sm">
            {rec.parameterCountB}B
          </Badge>
        </div>
        <span className="text-sm text-fg-muted">{rec.headline}</span>
        {!rec.fitsHardware && (
          <span className="mt-xs flex items-center gap-xs text-caption text-fg-subtle">
            <Icon icon={Warning} size="xs" />
            Tight on VRAM — may swap to system RAM and run slower.
          </span>
        )}
      </div>
      {selected && (
        <span
          aria-hidden
          className="flex size-6 items-center justify-center rounded-full bg-accent text-fg-default"
        >
          <Icon icon={Check} size="xs" weight="bold" />
        </span>
      )}
    </button>
  );
}

function TierBadge({ tier }: { readonly tier: StarterTier }) {
  const label = tier === 'small' ? 'Small' : tier === 'balanced' ? 'Balanced' : 'Large';
  return (
    <span
      className={cn(
        'flex h-l w-l shrink-0 items-center justify-center rounded-md text-caption font-semibold uppercase tracking-wider',
        tier === 'small' && 'bg-success/20 text-success',
        tier === 'balanced' && 'bg-accent/20 text-fg-accent',
        tier === 'large' && 'bg-warning/20 text-warning',
      )}
      aria-label={`${label} model`}
    >
      {label[0]}
    </span>
  );
}
