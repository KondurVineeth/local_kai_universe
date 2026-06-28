import { CaretLeft, ChatCircleText, Code } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectOnboardingMode } from '../../store/selectors';
import { modeSelected, stepReached } from '../../store/slice';

import type { UserMode } from '../../../domain/value-objects/UserMode';

// Two large radio cards. The selected card gets the accent ring + a check
// affordance. Default is "User" — chosen because ZL Universe's docs recommend
// it for first-timers, and our chat surface is fully usable without the
// developer panel.
export function ModeScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const mode = useAppSelector(selectOnboardingMode);

  useEffect(() => {
    dispatch(stepReached('mode'));
  }, [dispatch]);

  return (
    <div className="flex flex-col gap-3xl">
      <div className="flex flex-col gap-m text-center">
        <h2 className="text-xl font-bold text-fg-default">Choose your mode</h2>
        <p className="text-sm text-fg-muted">
          You can change this anytime in Settings.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-m sm:grid-cols-2">
        <ModeCard
          mode="user"
          selected={mode === 'user'}
          onSelect={() => dispatch(modeSelected('user'))}
          title="User"
          headline="Just chat — defaults handled."
          icon={ChatCircleText}
          bullets={[
            'Streamlined chat surface',
            'Models auto-configured',
            'Best for getting work done',
          ]}
        />
        <ModeCard
          mode="developer"
          selected={mode === 'developer'}
          onSelect={() => dispatch(modeSelected('developer'))}
          title="Developer"
          headline="Full control over inference."
          icon={Code}
          bullets={[
            'Sampling + system prompt panels',
            'Keyboard shortcuts surfaced',
            'Edit, regenerate, branch, continue',
          ]}
        />
      </div>
      <div className="flex items-center justify-between gap-m">
        <Button
          variant="ghost"
          size="md"
          leadingIcon={<Icon icon={CaretLeft} size="sm" weight="bold" />}
          onClick={() => navigate('/onboarding/welcome')}
        >
          Back
        </Button>
        <Button variant="primary" size="md" onClick={() => navigate('/onboarding/hardware')}>
          Continue
        </Button>
      </div>
    </div>
  );
}

interface ModeCardProps {
  readonly mode: UserMode;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly title: string;
  readonly headline: string;
  readonly icon: typeof ChatCircleText;
  readonly bullets: readonly string[];
}

function ModeCard({ selected, onSelect, title, headline, icon, bullets }: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group flex flex-col gap-m rounded-md border bg-bg-surface p-l text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        selected
          ? 'border-accent bg-accent/10 ring-2 ring-accent/30'
          : 'border-border-default hover:border-border-strong hover:bg-bg-raised',
      )}
    >
      <div className="flex items-center gap-m">
        <Icon
          icon={icon}
          size="md"
          className={selected ? 'text-fg-accent' : 'text-fg-muted'}
        />
        <span className="text-base font-semibold text-fg-default">{title}</span>
      </div>
      <p className="text-sm text-fg-muted">{headline}</p>
      <ul className="flex flex-col gap-s text-caption text-fg-subtle">
        {bullets.map((b) => (
          <li key={b}>· {b}</li>
        ))}
      </ul>
    </button>
  );
}
