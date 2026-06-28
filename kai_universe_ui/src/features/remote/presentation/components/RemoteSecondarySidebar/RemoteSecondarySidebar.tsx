import { ArrowClockwise, Gear, Plus, Trash } from '@phosphor-icons/react';
import { useState } from 'react';

import { SecondarySidebar } from '@shared/ds/layouts';
import { Button, ConfirmDialog, Icon, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectDevicesRefreshing,
  selectLocalDevice,
  selectRemoteDevices,
  selectSelectedDeviceId,
} from '../../store/selectors';
import {
  deviceSelected,
  resetDevices,
  thisDeviceDialogOpened,
  wizardOpened,
} from '../../store/slice';
import { refreshDevicesThunk } from '../../store/thunks';

import type { DeviceStatus } from '../../../domain/value-objects/DeviceStatus';

// Two-zone IA per Gestalt proximity: device list (scroll body, dense) and
// device-identity footer (sticky, sparse). The footer carries TWO rows —
// the local device with a Settings affordance, and the user's Personal
// Network identity with its online state. Both rows use the same
// "dot + label + trailing affordance" shape so the eye learns one
// scanning pattern and applies it twice.
export function RemoteSecondarySidebar() {
  const dispatch = useAppDispatch();
  const refreshing = useAppSelector(selectDevicesRefreshing);
  return (
    <SecondarySidebar
      title="Network Devices"
      headerActions={
        <>
          <Tooltip content={refreshing ? 'Refreshing…' : 'Refresh'} side="bottom">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Refresh devices"
              disabled={refreshing}
              onClick={() => dispatch(refreshDevicesThunk())}
            >
              <Icon
                icon={ArrowClockwise}
                size="sm"
                className={cn(refreshing && 'animate-spin')}
              />
            </Button>
          </Tooltip>
          <Tooltip content="Add a device" side="bottom">
            <Button
              variant="primary"
              size="sm"
              iconOnly
              aria-label="Add a device"
              onClick={() => dispatch(wizardOpened())}
            >
              <Icon icon={Plus} size="sm" weight="bold" />
            </Button>
          </Tooltip>
        </>
      }
      footer={<SidebarFooter />}
    >
      <DeviceList />
    </SecondarySidebar>
  );
}

function DeviceList() {
  const devices = useAppSelector(selectRemoteDevices);
  const selectedId = useAppSelector(selectSelectedDeviceId);
  const dispatch = useAppDispatch();

  if (devices.length === 0) {
    // No "Use the + above" instruction — the + lives in the header right
    // there, visible without prose. Keeping the empty hint to a single
    // line of context (why empty) honours Hick's Law: one obvious next
    // action wins over a sentence describing it.
    return (
      <p className="px-l py-l text-caption text-fg-subtle">
        No paired devices yet.
      </p>
    );
  }
  return (
    <ul className="flex flex-col px-s py-s">
      {devices.map((d) => (
        <li key={d.id}>
          <button
            type="button"
            onClick={() => dispatch(deviceSelected(d.id))}
            className={cn(
              'flex w-full items-center gap-m rounded-md px-m py-s text-left text-xs transition-colors',
              selectedId === d.id
                ? 'bg-bg-raised text-fg-default'
                : 'text-fg-muted hover:bg-bg-raised/60 hover:text-fg-default',
            )}
          >
            <StatusDot status={d.status} />
            <span className="truncate">{d.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function StatusDot({ status }: { readonly status: DeviceStatus }) {
  const tone =
    status === 'online'
      ? 'bg-success'
      : status === 'connecting'
        ? 'bg-warning animate-pulse'
        : 'bg-fg-subtle';
  return (
    <span
      aria-hidden
      className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', tone)}
    />
  );
}

function SidebarFooter() {
  const local = useAppSelector(selectLocalDevice);
  const devices = useAppSelector(selectRemoteDevices);
  const dispatch = useAppDispatch();
  const [confirmForget, setConfirmForget] = useState(false);

  // Personal Network sublabel is derived, not hardcoded: the network is
  // "Online" because the local device is online; the peer count gives
  // the row a second piece of real information.
  const peerCount = devices.length;
  const networkSublabel =
    peerCount === 0
      ? 'Online · No peers'
      : `Online · ${peerCount} ${peerCount === 1 ? 'device' : 'devices'}`;

  return (
    <div className="flex flex-col gap-s">
      <FooterRow
        leading={<StatusDot status={local.status} />}
        label={local.name}
        sublabel={local.allowModelLoading ? 'Sharing models' : 'Models hidden'}
        trailing={
          <Tooltip content="This device settings" side="top">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Open this device settings"
              onClick={() => dispatch(thisDeviceDialogOpened())}
            >
              <Icon icon={Gear} size="xs" />
            </Button>
          </Tooltip>
        }
      />
      <FooterRow
        leading={
          <span aria-hidden className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        }
        label="Personal Network"
        sublabel={networkSublabel}
        trailing={
          peerCount > 0 ? (
            <Tooltip content="Forget all devices" side="top">
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label="Forget all paired devices"
                onClick={() => setConfirmForget(true)}
              >
                <Icon icon={Trash} size="xs" />
              </Button>
            </Tooltip>
          ) : undefined
        }
      />
      {confirmForget && (
        <ConfirmDialog
          title="Forget all devices?"
          message="Every paired device will be unpaired from your Remote network. You can pair them again later."
          confirmLabel="Forget all"
          destructive
          onCancel={() => setConfirmForget(false)}
          onConfirm={() => {
            setConfirmForget(false);
            dispatch(resetDevices());
          }}
        />
      )}
    </div>
  );
}

// Shared shape for the two footer rows. Strict 3-tier hierarchy:
//   - leading: status / identity dot (smallest)
//   - label:   text-xs / fg-default
//   - sublabel: text-caption / fg-subtle (optional)
//   - trailing: optional action affordance
// Personal Network previously had a "Manage on web" kebab that did
// nothing; dead affordances violate the "make every action clear"
// rule, so it's removed. The sublabel "Online" earns its place
// because that's the actual information the row carries.
function FooterRow({
  leading,
  label,
  sublabel,
  trailing,
}: {
  readonly leading: React.ReactNode;
  readonly label: string;
  readonly sublabel?: string;
  readonly trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-m px-s">
      <div className="flex min-w-0 items-center gap-m">
        {leading}
        <div className="flex min-w-0 items-baseline gap-s">
          <span className="truncate text-xs text-fg-default">{label}</span>
          {sublabel && (
            <span className="shrink-0 text-caption text-fg-subtle">{sublabel}</span>
          )}
        </div>
      </div>
      {trailing}
    </div>
  );
}
