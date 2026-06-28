import { Eject, Play, Spinner, X } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

import {
  ejectModelThunk,
  loadModelThunk,
  selectLoadedModelId,
  selectModelLoadStatus,
  setRightPanelOpenForRoute,
} from '@features/shell';
import { Button, Icon, ScrollArea, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectMyModelsActiveTab } from '../../store/selectors';
import { tabSet, type RightRailTab } from '../../store/slice';

import { InferenceTab } from './InferenceTab';
import { InfoTab } from './InfoTab';
import { LoadTab } from './LoadTab';

import type { Model } from '@shared/domain/model/entities/Model';

const TABS: ReadonlyArray<{ key: RightRailTab; label: string }> = [
  { key: 'info', label: 'Info' },
  { key: 'load', label: 'Load' },
  { key: 'inference', label: 'Inference' },
];

export function MyModelsRightRail({ model }: { readonly model: Model }) {
  const dispatch = useAppDispatch();
  const active = useAppSelector(selectMyModelsActiveTab);
  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-border-default bg-bg-surface">
      <RailHeader
        displayName={model.displayName}
        onClose={() => dispatch(setRightPanelOpenForRoute({ route: 'my-models', open: false }))}
      />
      <RailActions model={model} />
      <div className="flex shrink-0 items-center gap-1 border-b border-border-default px-2 py-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => dispatch(tabSet(t.key))}
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

function RailHeader({ displayName, onClose }: { readonly displayName: string; readonly onClose: () => void }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border-default px-3 py-2">
      <span className="truncate text-xs font-medium text-fg-default">{displayName}</span>
      <Tooltip content="Close" side="bottom">
        <Button variant="ghost" size="sm" iconOnly aria-label="Close model panel" onClick={onClose}>
          <Icon icon={X} size="sm" />
        </Button>
      </Tooltip>
    </header>
  );
}

function RailActions({ model }: { readonly model: Model }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loadedModelId = useAppSelector(selectLoadedModelId);
  const loadStatus = useAppSelector(selectModelLoadStatus);
  const isLoaded = loadedModelId === model.id;
  const isLoading = loadStatus === 'loading';
  const isEjecting = loadStatus === 'unloading';
  const transient = isLoading || isEjecting;

  const handleLoadOrEject = () => {
    if (isLoaded) void dispatch(ejectModelThunk());
    else void dispatch(loadModelThunk(model.id));
  };
  const handleUseInNewChat = () => {
    if (!isLoaded) void dispatch(loadModelThunk(model.id));
    navigate('/chat');
  };

  const primaryLabel = isLoading ? 'Loading…' : isEjecting ? 'Ejecting…' : isLoaded ? 'Eject' : 'Load Model';
  const primaryIcon = transient ? (
    <Icon icon={Spinner} size="xs" className="animate-spin" />
  ) : isLoaded ? (
    <Icon icon={Eject} size="xs" weight="fill" />
  ) : undefined;

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-border-default px-3 py-3">
      <Button
        variant="secondary"
        size="sm"
        leadingIcon={<Icon icon={Play} size="xs" weight="fill" />}
        className="w-full"
        onClick={handleUseInNewChat}
        disabled={transient}
      >
        Use in New Chat
      </Button>
      <Button
        variant="primary"
        size="sm"
        className="w-full"
        onClick={handleLoadOrEject}
        disabled={transient}
        leadingIcon={primaryIcon}
      >
        {primaryLabel}
      </Button>
    </div>
  );
}
