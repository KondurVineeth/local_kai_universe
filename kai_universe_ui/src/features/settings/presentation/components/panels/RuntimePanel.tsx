import { ArrowClockwise, DotsThree, Question } from '@phosphor-icons/react';
import { useState } from 'react';

import {
  ENGINE_FIXTURES,
  engineCompatFilterChanged,
  engineKindFilterChanged,
  engineRemoved,
  engineRestored,
  engineUpdated,
  ggufRuntimeChanged,
  mlxRuntimeChanged,
  runtimeAutoUpdateChanged,
  runtimeDownloadChannelChanged,
  runtimeUpdateCheckResolved,
  runtimeUpdateCheckStarted,
  selectEngineCompatFilter,
  selectEngineKindFilter,
  selectEngineStates,
  selectGgufRuntimeId,
  selectMlxRuntimeId,
  selectRuntimeAutoUpdate,
  selectRuntimeDownloadChannel,
  selectRuntimeUpdateState,
} from '@features/settings';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  Input,
  Select,
  Spinner,
  Switch,
  Tooltip,
} from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { PanelLayout, SettingGroup, SettingRow } from '../shared/SettingsPrimitives';

import type {
  EngineCompatFilter,
  EngineFixture,
  EngineKindFilter,
  RuntimeDownloadChannel,
} from '@features/settings';

export function RuntimePanel() {
  return (
    <PanelLayout title="Runtime">
      <RuntimeSelectionsGroup />
      <EnginesSection />
    </PanelLayout>
  );
}

function RuntimeSelectionsGroup() {
  const dispatch = useAppDispatch();
  const autoUpdate = useAppSelector(selectRuntimeAutoUpdate);
  const ggufId = useAppSelector(selectGgufRuntimeId);
  const mlxId = useAppSelector(selectMlxRuntimeId);

  return (
    <SettingGroup sectionTitle="Runtime Selections">
      <SettingRow label="GGUF">
        <div className="w-52">
          <Select
            options={[
              { value: 'metal-llamacpp-214', label: 'Metal llama.cpp v2.14.0' },
              { value: 'metal-llamacpp-213', label: 'Metal llama.cpp v2.13.0' },
            ]}
            value={ggufId}
            onChange={(e) => dispatch(ggufRuntimeChanged(e.target.value))}
          />
        </div>
      </SettingRow>
      <SettingRow label="MLX">
        <div className="w-52">
          <Select
            options={[
              { value: 'mlx-m5-160', label: 'ZL Universe MLX (Apple M5) v1.6.0' },
              { value: 'mlx-160', label: 'ZL Universe MLX v1.6.0' },
            ]}
            value={mlxId}
            onChange={(e) => dispatch(mlxRuntimeChanged(e.target.value))}
          />
        </div>
      </SettingRow>
      <SettingRow label="Auto-update selected Runtime Extension Packs">
        <Switch
          checked={autoUpdate}
          onCheckedChange={(v) => dispatch(runtimeAutoUpdateChanged(v))}
          aria-label="Auto-update runtime extension packs"
        />
      </SettingRow>
      <RuntimeUpdatesRow />
    </SettingGroup>
  );
}

function RuntimeUpdatesRow() {
  const dispatch = useAppDispatch();
  const channel = useAppSelector(selectRuntimeDownloadChannel);
  const updateState = useAppSelector(selectRuntimeUpdateState);
  const checking = updateState === 'checking';

  const checkForUpdates = () => {
    dispatch(runtimeUpdateCheckStarted());
    window.setTimeout(() => {
      dispatch(runtimeUpdateCheckResolved(channel === 'beta'));
    }, 1200);
  };

  return (
    <SettingRow
      label="Runtime updates channel"
      sub={
        updateState === 'up-to-date'
          ? 'All runtime packs are up to date.'
          : updateState === 'available'
            ? 'A newer runtime pack is available on this channel.'
            : undefined
      }
    >
      <div className="flex items-center gap-2">
        <Tooltip content="Controls which update channel is used for downloading new runtime packs.">
          <button type="button" className="text-fg-subtle">
            <Icon icon={Question} size="sm" />
          </button>
        </Tooltip>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkForUpdates}
          disabled={checking}
          leadingIcon={checking ? <Spinner size="sm" /> : undefined}
        >
          {checking ? 'Checking…' : 'Check for updates'}
        </Button>
        <div className="w-24">
          <Select
            options={[
              { value: 'stable', label: 'Stable' },
              { value: 'beta', label: 'Beta' },
            ]}
            value={channel}
            onChange={(e) =>
              dispatch(runtimeDownloadChannelChanged(e.target.value as RuntimeDownloadChannel))
            }
          />
        </div>
      </div>
    </SettingRow>
  );
}

function EnginesSection() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const compatFilter = useAppSelector(selectEngineCompatFilter);
  const kindFilter = useAppSelector(selectEngineKindFilter);
  const engineStates = useAppSelector(selectEngineStates);

  const q = search.trim().toLowerCase();
  const filtered = ENGINE_FIXTURES.filter((e) => {
    if (engineStates[e.id]?.removed) return false;
    if (compatFilter === 'compatible' && !e.compatible) return false;
    if (kindFilter !== 'all' && e.kind !== kindFilter) return false;
    if (q && !e.name.toLowerCase().includes(q) && !e.desc.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-fg-default">Engines &amp; Frameworks</p>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
          aria-label="Search engines"
        />
        <div className="w-36">
          <Select
            options={[
              { value: 'compatible', label: 'Compatible only' },
              { value: 'all', label: 'All' },
            ]}
            value={compatFilter}
            onChange={(e) =>
              dispatch(engineCompatFilterChanged(e.target.value as EngineCompatFilter))
            }
            aria-label="Compatibility filter"
          />
        </div>
        <div className="w-28">
          <Select
            options={[
              { value: 'all', label: 'All types' },
              { value: 'gguf', label: 'GGUF' },
              { value: 'mlx', label: 'MLX' },
            ]}
            value={kindFilter}
            onChange={(e) => dispatch(engineKindFilterChanged(e.target.value as EngineKindFilter))}
            aria-label="Engine type filter"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border-default bg-bg-surface px-4 py-8 text-center text-sm text-fg-subtle">
          No engines match the current filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-default bg-bg-surface">
          {filtered.map((engine, i) => (
            <EngineRow key={engine.id} engine={engine} first={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

function EngineRow({ engine, first }: { readonly engine: EngineFixture; readonly first: boolean }) {
  const dispatch = useAppDispatch();
  const engineStates = useAppSelector(selectEngineStates);
  const state = engineStates[engine.id];
  const updated = state?.updatedToLatest ?? false;
  const installedVersion = updated ? engine.latestVersion : engine.installedVersion;
  const updateAvailable = !updated && engine.installedVersion !== engine.latestVersion;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        !first && 'border-t border-border-default',
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-bg-raised text-fg-subtle">
        <Icon icon={ArrowClockwise} size="sm" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-fg-default">{engine.name}</span>
          <span className="rounded border border-border-default px-1.5 py-0.5 text-[10px] text-fg-subtle">
            {installedVersion}
          </span>
        </div>
        <span className="text-xs text-fg-subtle">{engine.desc}</span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {updateAvailable ? (
          <span className="text-xs font-medium text-accent">
            Update to {engine.latestVersion}
          </span>
        ) : (
          <span className="text-xs font-medium text-green-400">✓ Latest version</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded border border-border-default text-fg-subtle hover:text-fg-default"
              aria-label={`Options for ${engine.name}`}
            >
              <Icon icon={DotsThree} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={!updateAvailable}
              onSelect={() => dispatch(engineUpdated(engine.id))}
            >
              Update
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => dispatch(engineRemoved(engine.id))}>
              Remove
            </DropdownMenuItem>
            {updated && (
              <DropdownMenuItem onSelect={() => dispatch(engineRestored(engine.id))}>
                Revert to {engine.installedVersion}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
