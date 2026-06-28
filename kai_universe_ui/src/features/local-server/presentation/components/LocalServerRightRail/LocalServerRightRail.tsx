import { ArrowSquareOut, DotsThree, X } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Icon, ScrollArea, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectRightRailTab } from '../../store/selectors';
import { rightRailTabSet, selectedModelSet } from '../../store/slice';

import { InferenceTab } from './InferenceTab';
import { InfoTab } from './InfoTab';
import { LoadTab } from './LoadTab';

import type { RightRailTab } from '../../store/slice';
import type { Model } from '@shared/domain/model/entities/Model';

const TABS: ReadonlyArray<{ key: RightRailTab; label: string }> = [
  { key: 'info', label: 'Info' },
  { key: 'load', label: 'Load' },
  { key: 'inference', label: 'Inference' },
];

export function LocalServerRightRail({ model }: { readonly model: Model }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const active = useAppSelector(selectRightRailTab);

  return (
    <aside className="flex h-full min-h-0 w-80 shrink-0 flex-col border-l border-border-default bg-bg-surface">
      <header className="flex items-center gap-2 border-b border-border-default px-3 py-2">
        <span className="flex-1 truncate text-xs font-medium text-fg-default">
          {model.displayName}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" iconOnly aria-label="Model options">
              <Icon icon={DotsThree} size="sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => { void navigate('/my-models'); }}>
              <Icon icon={ArrowSquareOut} size="xs" />
              Reveal in My Models table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip content="Close" side="bottom">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Close panel"
            onClick={() => dispatch(selectedModelSet(null))}
          >
            <Icon icon={X} size="sm" />
          </Button>
        </Tooltip>
      </header>

      <div className="flex shrink-0 items-center gap-1 border-b border-border-default px-2 py-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => dispatch(rightRailTabSet(t.key))}
            aria-pressed={active === t.key}
            className={cn(
              'flex-1 rounded-md px-2 py-1 text-[11px] transition-colors',
              active === t.key
                ? 'bg-bg-raised text-fg-default'
                : 'text-fg-muted hover:bg-bg-raised/60 hover:text-fg-default',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        {active === 'info' && <InfoTab model={model} />}
        {active === 'load' && <LoadTab model={model} />}
        {active === 'inference' && <InferenceTab model={model} />}
      </ScrollArea>
    </aside>
  );
}
