import { ChatCircleText, Code } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

import { selectOnboardingMode } from '@features/onboarding';
import { Icon, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppSelector } from '@shared/store/hooks';

// Surfaces the user's current mode (User / Developer) in the top header so
// they always know which surface they're looking at. Clicking opens
// Settings → Mode where they can switch.
//
// Subtle by design — sits to the left of the global model picker without
// competing with it for attention. The picker is the dominant header
// element; this is a status indicator.
export function ModeChip() {
  const mode = useAppSelector(selectOnboardingMode);
  const navigate = useNavigate();
  const isDeveloper = mode === 'developer';
  const label = isDeveloper ? 'Developer' : 'User';
  const Glyph = isDeveloper ? Code : ChatCircleText;
  const tooltip = `${label} mode — click to change`;

  return (
    <Tooltip content={tooltip} side="bottom">
      <button
        type="button"
        onClick={() => navigate('/settings#mode')}
        aria-label={tooltip}
        className={cn(
          'flex items-center gap-xs rounded-md border px-2 py-1 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg-surface',
          isDeveloper
            ? 'border-accent/40 bg-accent/10 text-fg-accent hover:bg-accent/20'
            : 'border-border-default bg-bg-raised text-fg-muted hover:border-border-strong hover:text-fg-default',
        )}
      >
        <Icon icon={Glyph} size="xs" />
        <span className="text-caption font-medium uppercase tracking-wider">{label}</span>
      </button>
    </Tooltip>
  );
}
