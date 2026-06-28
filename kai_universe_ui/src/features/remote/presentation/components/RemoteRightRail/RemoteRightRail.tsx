import { Check, MagnifyingGlass } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { useContainer } from '@shared/container-context';
import { Icon, Input, ScrollArea, Spinner } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { formatBytes } from '@shared/lib/format';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectAuthStatus,
  selectModelsFilterQuery,
  selectSelectedDevice,
  selectSelectedRemoteModelId,
} from '../../store/selectors';
import { modelsFilterChanged, remoteModelSelected } from '../../store/slice';

import type { Device } from '../../../domain/entities/Device';
import type { RemoteModel } from '../../../domain/entities/RemoteModel';
import type { RootState } from '@shared/store/hooks';

// Right rail: filter + list of models on the currently-selected peer.
//
// Row anatomy is 2-tier (Gestalt similarity — every row reads the same
// way): the model's identity on top, its specs (quant · size) underneath
// in caption tone. Author is folded into the spec line rather than
// getting its own row, and the `format` chip was dropped — the catalog
// only emits GGUF/MLX in practice and the value never disambiguates a
// row from its neighbours.
export function RemoteRightRail() {
  const authStatus = useAppSelector(selectAuthStatus);
  const selected = useAppSelector(selectSelectedDevice);
  const query = useAppSelector(selectModelsFilterQuery);
  const dispatch = useAppDispatch();

  // The shell mounts this rail for any `/remote` path, including the
  // unauthenticated landing screen. Suppress it until the user is signed
  // in — a "Models on Remote Device" panel makes no sense before pairing.
  if (authStatus !== 'authenticated') return null;

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-border-default bg-bg-surface">
      <header className="flex h-10 shrink-0 items-center gap-m border-b border-border-default px-l">
        <h2 className="truncate text-xs font-semibold text-fg-default">
          Models on Remote Device
        </h2>
      </header>
      <div className="shrink-0 border-b border-border-default px-m py-m">
        <Input
          inputSize="sm"
          placeholder="Filter models..."
          value={query}
          onChange={(e) => dispatch(modelsFilterChanged(e.target.value))}
          leadingIcon={<Icon icon={MagnifyingGlass} size="xs" />}
          aria-label="Filter models on remote device"
          className="w-full"
        />
      </div>
      <ScrollArea className="flex-1">
        {selected ? <ModelsBody device={selected} query={query} /> : <NoDeviceHint />}
      </ScrollArea>
    </aside>
  );
}

function NoDeviceHint() {
  return (
    <p className="px-l py-l text-caption text-fg-subtle">
      Select a device to view models.
    </p>
  );
}

function ModelsBody({ device, query }: { readonly device: Device; readonly query: string }) {
  const container = useContainer();
  const [state, setState] = useState<{
    models: readonly RemoteModel[];
    isLoading: boolean;
  }>({ models: [], isLoading: true });

  useEffect(() => {
    let cancelled = false;
    setState({ models: [], isLoading: true });
    container.remote.remoteModelsRepository
      .listForDevice(device.id)
      .then((models) => {
        if (cancelled) return;
        setState({ models, isLoading: false });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ models: [], isLoading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [container, device.id]);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center px-l py-2xl">
        <Spinner size="sm" />
      </div>
    );
  }
  if (device.status === 'offline') {
    return (
      <p className="px-l py-l text-caption text-fg-subtle">
        Device is offline — models are unavailable until it reconnects.
      </p>
    );
  }
  const q = query.trim().toLowerCase();
  const filtered = q
    ? state.models.filter((m) =>
        `${m.displayName} ${m.author} ${m.quantization}`
          .toLowerCase()
          .includes(q),
      )
    : state.models;
  if (filtered.length === 0) {
    return (
      <p className="px-l py-l text-caption text-fg-subtle">
        {q ? 'No models match this filter.' : 'No models on this device.'}
      </p>
    );
  }
  return (
    <ul className="flex flex-col px-m py-m">
      {filtered.map((m) => (
        <RemoteModelRow key={m.modelId} model={m} deviceId={device.id} />
      ))}
    </ul>
  );
}

// Two-tier row, now a selectable control. Primary line: name (truncates,
// fg-default). Secondary: author · quant · size in caption tone. Clicking
// "uses" the model on this device — the mock has no real load, so the
// action records the selection in the slice and the row reflects it with
// an accent border + check. Clicking the active row again clears it.
function RemoteModelRow({
  model,
  deviceId,
}: {
  readonly model: RemoteModel;
  readonly deviceId: Device['id'];
}) {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((s: RootState) =>
    selectSelectedRemoteModelId(s, deviceId),
  );
  const isSelected = selectedId === model.modelId;
  return (
    <li>
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() =>
          dispatch(remoteModelSelected({ deviceId, modelId: model.modelId }))
        }
        className={cn(
          'flex w-full items-start justify-between gap-m rounded-md border px-m py-m text-left transition-colors',
          isSelected
            ? 'border-accent bg-bg-raised/60'
            : 'border-transparent hover:bg-bg-raised/40',
        )}
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-xs text-fg-default">{model.displayName}</span>
          <span className="mt-xs flex items-center gap-s text-caption text-fg-subtle">
            <span className="truncate font-mono">{model.author}</span>
            <span aria-hidden>·</span>
            <span className="font-mono">{model.quantization}</span>
            <span aria-hidden>·</span>
            <span className="font-mono">{formatBytes(model.sizeBytes)}</span>
          </span>
          <span className="mt-xs text-caption text-fg-accent">
            {isSelected ? 'In use — click to release' : 'Click to use this model'}
          </span>
        </span>
        {isSelected && (
          <Icon icon={Check} size="xs" weight="bold" className="mt-xs shrink-0 text-fg-accent" />
        )}
      </button>
    </li>
  );
}
