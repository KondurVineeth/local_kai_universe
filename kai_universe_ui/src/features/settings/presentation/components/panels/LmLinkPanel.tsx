import { PencilSimple } from '@phosphor-icons/react';
import { useState } from 'react';

import {
  allowLoadingModelsOnThisMachineChanged,
  deviceNameChanged,
  remoteEnabledChanged,

  selectAllowLoadingModelsOnThisMachine,
  selectDeviceIdentifier,
  selectDeviceName,
  selectRemoteEnabled} from '@features/settings';
import { Icon, Input, Switch } from '@shared/ds/primitives';
import { useAutoFocus } from '@shared/hooks/useAutoFocus';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { OffOnToggle, PanelLayout, SettingGroup, SettingRow } from '../shared/SettingsPrimitives';

export function LmLinkPanel() {
  return (
    <PanelLayout title="Remote Link">
      <MainGroup />
      <DeviceGroup />
    </PanelLayout>
  );
}

function MainGroup() {
  const dispatch = useAppDispatch();
  const enabled = useAppSelector(selectRemoteEnabled);
  const allowLoading = useAppSelector(selectAllowLoadingModelsOnThisMachine);
  return (
    <SettingGroup sectionTitle="Remote Link">
      <SettingRow
        id="enable-remote"
        label="Enable Remote Link"
        sub="Create a secure and encrypted connection between your ZL Universe devices"
      >
        <OffOnToggle
          checked={enabled}
          onCheckedChange={(v) => dispatch(remoteEnabledChanged(v))}
        />
      </SettingRow>
      <SettingRow
        label="Allow loading models on this machine"
        sub="When disabled, peers cannot discover or load this machine's models."
      >
        <Switch
          checked={allowLoading}
          onCheckedChange={(v) => dispatch(allowLoadingModelsOnThisMachineChanged(v))}
          aria-label="Allow loading models on this machine"
        />
      </SettingRow>
    </SettingGroup>
  );
}

function DeviceGroup() {
  const dispatch = useAppDispatch();
  const deviceName = useAppSelector(selectDeviceName);
  const deviceIdentifier = useAppSelector(selectDeviceIdentifier);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(deviceName);
  const nameRef = useAutoFocus<HTMLInputElement>('select');

  const commit = () => {
    if (draft.trim()) dispatch(deviceNameChanged(draft.trim()));
    setEditing(false);
  };

  return (
    <SettingGroup sectionTitle="This Device">
      <SettingRow
        label="Device identifier"
        sub="Randomly generated identifier for this device in the Link network"
      >
        <code className="font-mono text-xs text-fg-default">{deviceIdentifier}</code>
      </SettingRow>
      <div className="border-t border-border-default px-4 py-3">
        <p className="mb-1 text-sm text-fg-default">Device name</p>
        <p className="mb-2 text-xs text-fg-subtle">
          This name is shown to other devices in Remote Link
        </p>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              ref={nameRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="flex-1"
              aria-label="Device name"
            />
            <button
              type="button"
              onClick={commit}
              className="text-xs font-medium text-accent hover:underline"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-fg-subtle hover:text-fg-default"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg-default">{deviceName}</span>
            <button
              type="button"
              onClick={() => {
                setDraft(deviceName);
                setEditing(true);
              }}
              className="text-fg-subtle hover:text-fg-default"
              aria-label="Edit device name"
            >
              <Icon icon={PencilSimple} size="sm" />
            </button>
          </div>
        )}
      </div>
    </SettingGroup>
  );
}
