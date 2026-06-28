import { useNavigate } from 'react-router-dom';

import { selectRemoteEnabled } from '@features/settings';
import { Button } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectAuthStatus,
  selectRemoteDevices,
  selectSelectedDevice,
} from '../../store/selectors';
import { wizardOpened } from '../../store/slice';
import { LandingScreen } from '../LandingScreen';
import { RemoteMascot } from '../RemoteMascot';

import { DeviceDetail } from './DeviceDetail';

// Render modes:
//   - Remote disabled in Settings: a redirect-to-Settings empty state.
//   - Unauthenticated: the full-width landing screen.
//   - Authenticated, no device selected: welcome empty state, one CTA.
//   - Authenticated, device selected: the full device-detail pane.
export function RemotePage() {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
  const selected = useAppSelector(selectSelectedDevice);
  const devices = useAppSelector(selectRemoteDevices);
  const remoteEnabled = useAppSelector(selectRemoteEnabled);

  // Settings owns the Remote enable/disable switch. If it's off, the
  // pairing flow + devices list aren't actionable — surface that instead
  // of letting users try to add a device that won't actually connect.
  if (!remoteEnabled) {
    return <DisabledEmptyState />;
  }

  if (authStatus !== 'authenticated') {
    return <LandingScreen />;
  }

  if (!selected) {
    return (
      <WelcomeEmptyState
        onAdd={() => dispatch(wizardOpened())}
        hasPairedDevices={devices.length > 0}
      />
    );
  }
  return <DeviceDetail device={selected} />;
}

function DisabledEmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-3xl text-center">
        <RemoteMascot />
        <div className="flex flex-col gap-m">
          <h2 className="text-xl font-semibold text-fg-default">Remote is disabled</h2>
          <p className="text-sm text-fg-muted">
            Enable Remote in Settings to pair devices and view their models.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/settings/lm-link#enable-remote')}
        >
          Open Settings
        </Button>
      </div>
    </div>
  );
}

interface WelcomeProps {
  readonly onAdd: () => void;
  readonly hasPairedDevices: boolean;
}

// 3-tier hierarchy: mascot (visual anchor), heading (text-xl), supporting
// copy (text-sm). The button supplies the action layer, not a fourth
// type size. Whitespace (gap-3xl) frames the mascot.
function WelcomeEmptyState({ onAdd, hasPairedDevices }: WelcomeProps) {
  const body = hasPairedDevices
    ? 'Pick a device from the sidebar to view its models, or add another.'
    : 'Get started by adding another device to your link.';
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-3xl text-center">
        <RemoteMascot />
        <div className="flex flex-col gap-m">
          <h2 className="text-xl font-semibold text-fg-default">Welcome to Remote</h2>
          <p className="text-sm text-fg-muted">{body}</p>
        </div>
        <Button variant="primary" size="md" onClick={onAdd}>
          Add a Device
        </Button>
      </div>
    </div>
  );
}
