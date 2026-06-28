import { CaretDown } from '@phosphor-icons/react';
import { type ReactNode } from 'react';

import { Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { togglePanel, type PanelKey } from '../../store/configSlice';
import { selectIsPanelExpanded } from '../../store/selectors';

interface PanelSectionProps {
  readonly panelKey: PanelKey;
  readonly title: ReactNode;
  readonly summary?: string;
  readonly children: ReactNode;
}

// Card-style collapsible section. Card surface is Neutral/Surface/Medium
// (#262626 = bg-bg-raised) — one tier above the right-panel aside (Surface
// /Low). Each card is its own "common region" (Gestalt) so adjacent open
// panels don't read as one wall. Inter-card gap lives in the parent.
export function PanelSection({ panelKey, title, summary, children }: PanelSectionProps) {
  const expanded = useAppSelector(selectIsPanelExpanded(panelKey));
  const dispatch = useAppDispatch();
  return (
    <section
      className={cn(
        'overflow-hidden rounded-md bg-bg-raised',
        // Border carries the "is this open" affordance — visible on expanded,
        // fades on collapsed so the closed state stays calm.
        expanded ? 'border border-border-default' : 'border border-transparent',
      )}
    >
      <button
        type="button"
        onClick={() => dispatch(togglePanel(panelKey))}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-bg-active/40"
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-xs font-medium text-fg-default">{title}</span>
          {!expanded && summary && (
            <span className="truncate text-caption text-fg-subtle">{summary}</span>
          )}
        </span>
        <Icon
          icon={CaretDown}
          size="xs"
          className={cn(
            'shrink-0 text-fg-subtle transition-transform',
            expanded ? 'rotate-0' : '-rotate-90',
          )}
        />
      </button>
      {expanded && <div className="px-3 pb-4 pt-1">{children}</div>}
    </section>
  );
}
