import {
  CaretDown,
  CheckCircle,
  DownloadSimple,
  Lightning,
  Package,
  Pause,
  Play,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react';

import { selectOnboardingHardware } from '@features/onboarding';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
} from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { formatBytes } from '@shared/lib/format';
import { formatChipTone } from '@shared/lib/modelChipTones';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { computeCompatibility, type CompatibilityResult } from '../../../application/use-cases/computeCompatibility';
import {
  selectDiscoverDownloadFor,
  selectDiscoverSelectedVariant,
} from '../../store/selectors';
import { variantSelected } from '../../store/slice';
import {
  cancelModelDownloadThunk,
  pauseModelDownloadThunk,
  resumeModelDownloadThunk,
  startModelDownloadThunk,
} from '../../store/thunks';

import type { Model, ModelVariant } from '@shared/domain/model/entities/Model';
import type { Bytes } from '@shared/domain/primitives/Bytes';

// Matches the ZL Universe reference: labelled "Download Options" section with
// a single variant card showing format + identity + quant + size, followed
// by a hardware-compat badge and the primary Download button.
export function DownloadOptionsCard({ model }: { readonly model: Model }) {
  const dispatch = useAppDispatch();
  const selectedQuant = useAppSelector(selectDiscoverSelectedVariant(model.id));
  const download = useAppSelector(selectDiscoverDownloadFor(model.id));
  const hardware = useAppSelector(selectOnboardingHardware);

  if (model.variants.length === 0) {
    return <NoVariantsNotice />;
  }

  const recommended = model.variants.find((v) => v.recommended) ?? model.variants[0];
  const active = model.variants.find((v) => v.quantization === selectedQuant) ?? recommended;
  if (!active) return null;

  const status = download?.status ?? 'idle';
  const inFlight = status === 'queued' || status === 'downloading' || status === 'paused';
  const pct =
    download && download.totalBytes > 0
      ? Math.round((download.receivedBytes / download.totalBytes) * 100)
      : 0;
  const compat = computeCompatibility(active, hardware);

  const downloadId = download?.downloadId ?? null;
  const onDownload = () => {
  void dispatch(
    startModelDownloadThunk(
      model.id,
      model.hfRepository,
      active.quantization,
      Number(active.sizeBytes),
    ),
  );
};
  const onPause = () => {
    if (downloadId) void dispatch(pauseModelDownloadThunk(model.id, downloadId));
  };
  const onResume = () => {
    if (downloadId) void dispatch(resumeModelDownloadThunk(model.id, downloadId));
  };
  const onCancel = () => {
    if (downloadId) void dispatch(cancelModelDownloadThunk(model.id, downloadId));
  };

  return (
    <section className="flex flex-col gap-3 rounded-md border border-border-default bg-bg-surface p-4">
      <header className="flex items-center gap-2">
        <Icon icon={Package} size="sm" className="text-fg-muted" />
        <h2 className="text-xs font-medium text-fg-default">Download Options</h2>
      </header>

      <VariantPicker
        model={model}
        active={active}
        // Lock the picker while a download is in flight — flipping variants
        // mid-stream would desync the displayed size/quant from what's
        // actually being downloaded.
        disabled={inFlight}
        onPick={(v) =>
          dispatch(variantSelected({ modelId: model.id, quantization: v.quantization }))
        }
      />

      <div className="flex items-center justify-between gap-3">
        <CompatibilityBadge result={compat} />
        <DownloadButton
          status={status}
          pct={pct}
          sizeLabel={formatBytes(active.sizeBytes as Bytes)}
          canControl={downloadId !== null}
          onClick={onDownload}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
        />
      </div>
    </section>
  );
}

function NoVariantsNotice() {
  return (
    <section className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-surface p-4">
      <header className="flex items-center gap-2">
        <Icon icon={Package} size="sm" className="text-fg-muted" />
        <h2 className="text-xs font-medium text-fg-default">Download Options</h2>
      </header>
      <p className="text-xs text-fg-muted">No download variants available for this model.</p>
    </section>
  );
}

function CompatibilityBadge({ result }: { readonly result: CompatibilityResult }) {
  const toneClasses = {
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    neutral: 'bg-bg-active text-fg-muted',
    danger: 'bg-danger/20 text-danger',
  }[result.tone];
  const icon =
    result.tone === 'success'
      ? Lightning
      : result.tone === 'danger'
        ? WarningCircle
        : Warning;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium', toneClasses)}>
      <Icon icon={icon} size="xs" weight="fill" />
      {result.label}
    </span>
  );
}

function VariantPicker({
  model,
  active,
  disabled,
  onPick,
}: {
  readonly model: Model;
  readonly active: ModelVariant;
  readonly disabled: boolean;
  readonly onPick: (v: ModelVariant) => void;
}) {
  // Single-variant models render as a flat row (no dropdown) — opening a
  // dropdown that only contains the already-active row is a false affordance.
  if (model.variants.length === 1) {
    return (
      <div className="flex w-full items-center gap-2 rounded-md border border-border-default bg-bg-raised px-3 py-2">
        <FormatChip format={active.format} />
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg-default">
          {model.displayName}
        </span>
        <QuantChip quant={active.quantization} />
        <span className="ml-2 font-mono text-xs text-fg-default">
          {formatBytes(active.sizeBytes as Bytes)}
        </span>
      </div>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex w-full items-center gap-2 rounded-md border border-border-default bg-bg-raised px-3 py-2 text-left transition-colors hover:bg-bg-active disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FormatChip format={active.format} />
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg-default">
            {model.displayName}
          </span>
          <QuantChip quant={active.quantization} />
          <span className="ml-2 font-mono text-xs text-fg-default">
            {formatBytes(active.sizeBytes as Bytes)}
          </span>
          <Icon icon={CaretDown} size="xs" className="text-fg-subtle" />
        </button>
      </DropdownMenuTrigger>
      {/*
        `--radix-dropdown-menu-trigger-width` is exposed by Radix on the
        content element when the menu opens. Setting `width` to it makes
        the menu span exactly the trigger's width (instead of fitting to
        content). Matches ZL Universe's behaviour for this exact picker.
      */}
      <DropdownMenuContent
        align="start"
        className="min-w-[var(--radix-dropdown-menu-trigger-width)]"
        style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}
      >
        {model.variants.map((v) => (
          <DropdownMenuItem key={`${v.format}-${v.quantization}`} onSelect={() => onPick(v)}>
            <span className="flex w-full items-center gap-2">
              <FormatChip format={v.format} />
              <span className="flex-1 truncate font-mono text-xs text-fg-default">
                {model.displayName}
              </span>
              <QuantChip quant={v.quantization} />
              <span className="ml-2 font-mono text-[10px] text-fg-muted">
                {formatBytes(v.sizeBytes as Bytes)}
              </span>
              {v.recommended && (
                <span className="ml-1 text-[10px] text-fg-subtle">★</span>
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FormatChip({ format }: { readonly format: string }) {
  const tone = formatChipTone(format);
  return (
    <span
      className={cn(
        'rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase',
        tone.bg,
        tone.text,
      )}
    >
      {format}
    </span>
  );
}

function QuantChip({ quant }: { readonly quant: string }) {
  return (
    <span className="rounded-sm bg-bg-active px-1.5 py-0.5 font-mono text-[10px] uppercase text-fg-muted">
      {quant}
    </span>
  );
}

interface DownloadButtonProps {
  readonly status: 'idle' | 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  readonly pct: number;
  readonly sizeLabel: string;
  // True once the repo has assigned a download id — pause/cancel can't act
  // before that, so the controls render disabled for the brief queued gap.
  readonly canControl: boolean;
  readonly onClick: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onCancel: () => void;
}

function DownloadButton({
  status,
  pct,
  sizeLabel,
  canControl,
  onClick,
  onPause,
  onResume,
  onCancel,
}: DownloadButtonProps) {
  if (status === 'completed') {
    return (
      <Button variant="secondary" size="sm" leadingIcon={<Icon icon={CheckCircle} size="sm" />} disabled>
        Downloaded
      </Button>
    );
  }
  // In-flight: a status label plus working Pause/Resume + Cancel controls.
  if (status === 'downloading' || status === 'queued' || status === 'paused') {
    return (
      <InFlightControls
        status={status}
        pct={pct}
        canControl={canControl}
        onPause={onPause}
        onResume={onResume}
        onCancel={onCancel}
      />
    );
  }
  if (status === 'failed' || status === 'cancelled') {
    return (
      <Button
        variant="primary"
        size="sm"
        leadingIcon={<Icon icon={DownloadSimple} size="sm" />}
        onClick={onClick}
      >
        {status === 'failed' ? 'Retry' : 'Restart'} <span className="font-mono">{sizeLabel}</span>
      </Button>
    );
  }
  return (
    <Button
      variant="primary"
      size="sm"
      leadingIcon={<Icon icon={DownloadSimple} size="sm" />}
      onClick={onClick}
    >
      Download <span className="font-mono">{sizeLabel}</span>
    </Button>
  );
}

// Status label + Pause/Resume + Cancel for an in-flight download. Controls
// disable until the repo has assigned a download id (the brief queued gap).
function InFlightControls({
  status,
  pct,
  canControl,
  onPause,
  onResume,
  onCancel,
}: {
  readonly status: 'queued' | 'downloading' | 'paused';
  readonly pct: number;
  readonly canControl: boolean;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onCancel: () => void;
}) {
  const label =
    status === 'queued' ? 'Queued' : status === 'paused' ? `Paused ${pct}%` : `Downloading… ${pct}%`;
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] text-fg-muted">{label}</span>
      {status === 'paused' ? (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Resume download"
          disabled={!canControl}
          onClick={onResume}
        >
          <Icon icon={Play} size="sm" weight="fill" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Pause download"
          disabled={!canControl}
          onClick={onPause}
        >
          <Icon icon={Pause} size="sm" weight="fill" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label="Cancel download"
        disabled={!canControl}
        onClick={onCancel}
      >
        <Icon icon={X} size="sm" weight="bold" />
      </Button>
    </div>
  );
}
