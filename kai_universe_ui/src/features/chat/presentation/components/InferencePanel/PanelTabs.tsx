import { Hammer, SlidersHorizontal } from '@phosphor-icons/react';

import { Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';

export type PanelTab = 'integrations' | 'settings';

interface PanelTabsProps {
  readonly tab: PanelTab;
  readonly onChange: (tab: PanelTab) => void;
}

// Top-of-panel toggle between Integrations (plugins) and Settings (inference
// config). Mirrors ZL Universe's right-rail mode switcher.
export function PanelTabs({ tab, onChange }: PanelTabsProps) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border-default px-2">
      <TabButton
        active={tab === 'integrations'}
        onClick={() => onChange('integrations')}
        ariaLabel="Integrations"
      >
        <Icon icon={Hammer} size="sm" />
      </TabButton>
      <TabButton
        active={tab === 'settings'}
        onClick={() => onChange('settings')}
        ariaLabel="Inference settings"
      >
        <Icon icon={SlidersHorizontal} size="sm" />
      </TabButton>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly ariaLabel: string;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        active
          ? 'bg-accent text-fg-default'
          : 'text-fg-subtle hover:bg-bg-raised hover:text-fg-default',
      )}
    >
      {children}
    </button>
  );
}
