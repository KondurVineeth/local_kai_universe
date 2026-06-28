import {
  ArrowClockwise,
  ArrowsClockwise,
  Cpu,
  Fingerprint,
  Link as LinkIcon,
  LinkBreak,
  Trash,
} from '@phosphor-icons/react';
import { useState } from 'react';

import { Badge, Button, ConfirmDialog, Icon, Spinner } from '@shared/ds/primitives';
import { useAppDispatch } from '@shared/store/hooks';

import { useRelativeTime } from '../../hooks/useRelativeTime';
import { deviceRemoved, deviceSelected } from '../../store/slice';
import { reconnectDeviceThunk } from '../../store/thunks';

import type { Device } from '../../../domain/entities/Device';

// Full device-detail pane. Layout is a single scroll column:
//   1. Header band — name, status badge, identifier, last-seen.
//   2. Status-appropriate content block — a connecting spinner, an online
//      "models live in the right panel" hint + actions, or an offline
//      reconnect prompt.
//   3. Info grid — identifier + status as labelled facts.
// Gestalt proximity does the grouping; borders are reserved for the
// info-grid cells where the eye needs cell boundaries.
export function DeviceDetail({ device }: { readonly device: Device }) {
  const dispatch = useAppDispatch();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const lastSeen = useRelativeTime(device.lastSeenAt);

  const onReconnect = () => dispatch(reconnectDeviceThunk(device.id));
  const onRemove = () => {
    dispatch(deviceRemoved(device.id));
    dispatch(deviceSelected(null));
  };

  return (
    <div className="flex h-full flex-col gap-2xl overflow-y-auto px-2xl py-2xl">
      <DetailHeader
        device={device}
        lastSeen={lastSeen}
        onReconnect={onReconnect}
        onRequestRemove={() => setConfirmRemove(true)}
      />

      <StatusBlock device={device} onReconnect={onReconnect} />

      <section className="flex flex-col gap-m">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
          Device details
        </h3>
        <div className="grid grid-cols-2 gap-m">
          <InfoCell
            icon={Fingerprint}
            label="Identifier"
            value={<span className="font-mono">{device.identifier}</span>}
          />
          <InfoCell
            icon={LinkIcon}
            label="Connection"
            value={statusLabel(device.status)}
          />
          <InfoCell
            icon={Cpu}
            label="Role"
            value={device.isLocal ? 'This device' : 'Remote peer'}
          />
          <InfoCell
            icon={ArrowClockwise}
            label="Last seen"
            value={lastSeen}
          />
        </div>
      </section>

      {confirmRemove && (
        <ConfirmDialog
          title="Remove this device?"
          message={`${device.name} will be unpaired from your Remote network. You can pair it again later.`}
          confirmLabel="Remove device"
          destructive
          onCancel={() => setConfirmRemove(false)}
          onConfirm={() => {
            setConfirmRemove(false);
            onRemove();
          }}
        />
      )}
    </div>
  );
}

// Header band: name + status badge, identifier + last-seen line, and the
// per-device actions (Reconnect for an online device, Remove always).
function DetailHeader({
  device,
  lastSeen,
  onReconnect,
  onRequestRemove,
}: {
  readonly device: Device;
  readonly lastSeen: string;
  readonly onReconnect: () => void;
  readonly onRequestRemove: () => void;
}) {
  return (
    <header className="flex items-start justify-between gap-l">
      <div className="flex min-w-0 flex-col gap-s">
        <div className="flex items-center gap-m">
          <h2 className="truncate text-xl font-semibold text-fg-default">{device.name}</h2>
          <Badge tone={statusTone(device.status)}>{statusLabel(device.status)}</Badge>
        </div>
        <p className="text-caption text-fg-subtle">
          <span className="font-mono">{device.identifier}</span>
          <span className="mx-s" aria-hidden>·</span>
          <span>Last seen {lastSeen}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-s">
        {device.status === 'online' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReconnect}
            leadingIcon={<Icon icon={ArrowsClockwise} size="xs" />}
          >
            Reconnect
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRequestRemove}
          leadingIcon={<Icon icon={Trash} size="xs" />}
        >
          Remove
        </Button>
      </div>
    </header>
  );
}

// Status-driven content. `connecting` shows a live handshake indicator;
// `online` points at the right-rail model list; `offline` (not reachable
// in the mock, but rendered defensively) surfaces a reconnect CTA.
function StatusBlock({
  device,
  onReconnect,
}: {
  readonly device: Device;
  readonly onReconnect: () => void;
}) {
  if (device.status === 'connecting') {
    return (
      <div className="flex items-center gap-m rounded-md border border-border-default bg-bg-surface px-l py-l">
        <Spinner size="sm" />
        <div className="flex flex-col">
          <p className="text-sm font-medium text-fg-default">Connecting…</p>
          <p className="text-xs text-fg-muted">
            Completing the encrypted handshake with this device.
          </p>
        </div>
      </div>
    );
  }
  if (device.status === 'offline') {
    return (
      <div className="flex items-center justify-between gap-m rounded-md border border-border-default bg-bg-surface px-l py-l">
        <div className="flex items-center gap-m">
          <Icon icon={LinkBreak} size="md" className="text-fg-subtle" />
          <div className="flex flex-col">
            <p className="text-sm font-medium text-fg-default">Device is offline</p>
            <p className="text-xs text-fg-muted">
              Its models are unavailable until it reconnects.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onReconnect}
          leadingIcon={<Icon icon={ArrowsClockwise} size="xs" />}
        >
          Reconnect
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-m rounded-md border border-border-default bg-bg-surface px-l py-l">
      <Icon icon={LinkIcon} size="md" className="text-success" />
      <div className="flex flex-col">
        <p className="text-sm font-medium text-fg-default">Connected</p>
        <p className="text-xs text-fg-muted">
          This device&rsquo;s models are listed in the right panel. Use the filter
          to narrow by name, quant, or format, then pick one to use it.
        </p>
      </div>
    </div>
  );
}

function InfoCell({
  icon,
  label,
  value,
}: {
  readonly icon: typeof Cpu;
  readonly label: string;
  readonly value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-xs rounded-md border border-border-default bg-bg-surface px-l py-m">
      <span className="flex items-center gap-s text-caption uppercase tracking-wide text-fg-subtle">
        <Icon icon={icon} size="xs" />
        {label}
      </span>
      <span className="truncate text-sm text-fg-default">{value}</span>
    </div>
  );
}

function statusTone(s: Device['status']): 'success' | 'warning' | 'neutral' {
  if (s === 'online') return 'success';
  if (s === 'connecting') return 'warning';
  return 'neutral';
}

function statusLabel(s: Device['status']): string {
  if (s === 'connecting') return 'Connecting…';
  if (s === 'online') return 'Online';
  return 'Offline';
}
