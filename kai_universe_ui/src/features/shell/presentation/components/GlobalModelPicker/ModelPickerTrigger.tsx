import { CaretDown, Cpu, Prohibit } from '@phosphor-icons/react';
import { forwardRef } from 'react';

import { Icon, Spinner } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppSelector } from '@shared/store/hooks';

import { selectModelLoadProgressPct } from '../../store/selectors';

import type { ModelLoadStatus } from '../../../domain/value-objects/ModelLoadStatus';
import type { Model } from '@shared/domain/model/entities/Model';


export interface ModelPickerTriggerProps {
  readonly loadedModel: Model | null;
  readonly status: ModelLoadStatus;
  readonly open: boolean;
  readonly onClick?: () => void;
}

// Picker trigger button. Wrapped (alongside an external eject button) by a
// shared bordered container in GlobalModelPicker — borders/bg moved out of
// here so the two buttons can sit visually as one control.
//
// `forwardRef` is required for Radix's DropdownMenuTrigger asChild integration.
export const ModelPickerTrigger = forwardRef<HTMLButtonElement, ModelPickerTriggerProps>(
  function ModelPickerTrigger({ loadedModel, status, open, ...rest }, ref) {
    // While ejecting (status === 'unloading'), opening the dropdown and
    // selecting a different model would race the in-flight eject thunk
    // and double-dispatch. Disable the trigger so the user has to wait
    // out the ~700ms unload first.
    const ejecting = status === 'unloading';
    const loading = status === 'loading';
    return (
      <button
        {...rest}
        ref={ref}
        type="button"
        disabled={ejecting}
        aria-disabled={ejecting}
        className={cn(
          // 4px vertical, 8px horizontal padding (per spec).
          'group relative flex flex-1 min-w-0 items-center gap-1.5 overflow-hidden rounded-l-md py-1 px-2 text-xs',
          'text-fg-default transition-colors',
          ejecting ? 'cursor-not-allowed opacity-70' : 'hover:bg-bg-surface',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base',
        )}
        aria-label="Select model"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {loading && <LoadProgressFill />}
        <span className="relative z-[1] flex w-full min-w-0 items-center gap-1.5">
          <TriggerLabel loadedModel={loadedModel} status={status} />
        </span>
      </button>
    );
  },
);

// Accent fill that animates 0→95% over the simulated load window. Sits
// behind the trigger label as a horizontal progress bar — replaces the
// indeterminate spinner so the user can feel the load advancing.
function LoadProgressFill() {
  const pct = useAppSelector(selectModelLoadProgressPct);
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 z-0 bg-accent/30 transition-[width] duration-200 ease-out"
      style={{ width: `${pct}%` }}
    />
  );
}

function TriggerLabel({
  loadedModel,
  status,
}: {
  readonly loadedModel: Model | null;
  readonly status: ModelLoadStatus;
}) {
  const progressPct = useAppSelector(selectModelLoadProgressPct);
  if (status === 'loading') {
    return (
      <>
        <span className="flex-1 truncate text-left text-fg-default">
          {loadedModel ? `Loading ${loadedModel.author}/${loadedModel.id}…` : 'Loading model…'}
        </span>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-fg-muted">
          {progressPct}%
        </span>
      </>
    );
  }
  if (status === 'unloading') {
    return (
      <>
        <Spinner size="xs" />
        <span className="flex-1 truncate text-left text-fg-muted">
          {loadedModel ? `Ejecting ${loadedModel.author}/${loadedModel.id}…` : 'Ejecting model…'}
        </span>
      </>
    );
  }
  if (status === 'error') {
    return (
      <>
        <Icon icon={Prohibit} size="sm" className="text-danger" />
        <span className="flex-1 truncate text-left text-danger">Failed to load model</span>
      </>
    );
  }
  if (loadedModel) {
    return (
      <>
        <FormatBadge format={loadedModel.format} />
        <span className="flex-1 truncate text-left">
          {loadedModel.author}/{loadedModel.id}
        </span>
        <Icon icon={CaretDown} size="xs" weight="bold" className="text-fg-subtle" />
      </>
    );
  }
  return (
    <>
      <Icon icon={Cpu} size="md" className="text-fg-subtle" />
      <span className="flex-1 truncate text-left text-fg-muted">Select a model to load</span>
      <Icon icon={CaretDown} size="sm" weight="bold" className="text-fg-subtle" />
    </>
  );
}

// Tiny accent-tinted badge that surfaces on-disk format at a glance. Matches
// real ZL Universe's MLX/GGUF chip in the picker.
function FormatBadge({ format }: { readonly format: string }) {
  return (
    <span className="rounded-sm bg-accent-subtle px-1 py-0.5 text-caption font-semibold uppercase tracking-wide text-fg-accent">
      {format}
    </span>
  );
}
