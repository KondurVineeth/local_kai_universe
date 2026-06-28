import { Brain } from '@phosphor-icons/react';

import { Icon, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';

interface ReasoningTogglePillProps {
  readonly enabled: boolean;
  readonly onToggle: () => void;
  // UX-CHAT-031: reasoning is only meaningful for "thinking" models. When the
  // loaded model isn't one, the pill is disabled (it can't drive the
  // simulator's reasoning trace, which keys off the same id convention).
  readonly available?: boolean;
}

export function ReasoningTogglePill({
  enabled,
  onToggle,
  available = true,
}: ReasoningTogglePillProps) {
  const effectiveEnabled = available && enabled;
  const pill = (
    <button
      type="button"
      onClick={available ? onToggle : undefined}
      disabled={!available}
      aria-pressed={effectiveEnabled}
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-md border px-2 text-xs transition-colors',
        !available
          ? 'cursor-not-allowed border-border-default bg-bg-raised text-fg-subtle opacity-60'
          : effectiveEnabled
            ? 'border-accent bg-accent/20 text-fg-default'
            : 'border-border-default bg-bg-raised text-fg-muted hover:text-fg-default',
      )}
    >
      <Icon icon={Brain} size="xs" />
      <span>Reasoning</span>
    </button>
  );
  if (available) return pill;
  return (
    <Tooltip content="The loaded model isn't a reasoning model" side="top">
      {pill}
    </Tooltip>
  );
}
