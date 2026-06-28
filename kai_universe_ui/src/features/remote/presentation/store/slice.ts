import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { defaultLocalDeviceName, generateDeviceIdentifier } from '../../application/use-cases/identifiers';

import type { Device } from '../../domain/entities/Device';
import type { DeviceId } from '../../domain/value-objects/DeviceId';
import type { DeviceStatus } from '../../domain/value-objects/DeviceStatus';
import type { Iso8601 } from '@shared/domain/primitives/Iso8601';

// Wizard step machine. `closed` is the resting state; the other three map
// 1:1 to the three modals in the screenshots (choose / GUI instructions /
// headless instructions). Kept in slice (not local component state) so the
// "Add a Device" CTA in the empty view and the "+" in the sidebar both
// open the same modal without prop drilling.
export type RemoteWizardStep = 'closed' | 'choose-type' | 'gui' | 'headless';

export interface RemoteState {
  readonly localDevice: Device;
  readonly devices: readonly Device[];
  readonly selectedDeviceId: DeviceId | null;
  readonly wizardStep: RemoteWizardStep;
  readonly thisDeviceDialogOpen: boolean;
  readonly modelsFilterQuery: string;
  // Timestamp at which the in-flight peer-spawn timer should resolve.
  // Persisted so a reload mid-wait still spawns the peer on rehydrate —
  // otherwise the user clicks Close, refreshes, and silently loses the
  // device that was supposed to appear.
  readonly pendingPeerSpawnAt: number | null;
  // GUI vs headless pick from the wizard that scheduled the pending
  // spawn. Persisted alongside `pendingPeerSpawnAt` so a reload mid-wait
  // still spawns a device of the right flavour.
  readonly pendingPeerSpawnKind: 'gui' | 'headless' | null;
  readonly authStatus: 'unauthenticated' | 'authenticating' | 'authenticated';
  readonly learnModalOpen: boolean;
  // True while a (mock) device-discovery refresh is in flight. Drives the
  // spinning "Refresh" affordance — cleared by `devicesRefreshed`, which
  // also bumps every device's `lastSeenAt` so the UI has a visible change.
  readonly devicesRefreshing: boolean;
  // ModelId the user has chosen to "use" on the currently-detailed device,
  // keyed by DeviceId. Lets the right rail render a selected/active state
  // for a remote model without a real load. Reset when its device is
  // removed or all devices are forgotten.
  readonly selectedRemoteModelByDevice: Readonly<Record<string, string>>;
}

// Local-device seed used on the very first boot (and whenever migration
// finds the slice missing the localDevice field). Identifier is generated
// once; subsequent boots read the persisted value. Name defaults to a
// platform-flavoured label and is editable via ThisDeviceDialog.
function buildInitialLocalDevice(): Device {
  const identifier = generateDeviceIdentifier();
  return {
    id: identifier as unknown as DeviceId,
    name: defaultLocalDeviceName(),
    identifier,
    status: 'online',
    isLocal: true,
    lastSeenAt: new Date().toISOString() as Iso8601,
    allowModelLoading: true,
  };
}

const initialState: RemoteState = {
  localDevice: buildInitialLocalDevice(),
  devices: [],
  selectedDeviceId: null,
  wizardStep: 'closed',
  thisDeviceDialogOpen: false,
  modelsFilterQuery: '',
  pendingPeerSpawnAt: null,
  pendingPeerSpawnKind: null,
  authStatus: 'unauthenticated',
  learnModalOpen: false,
  devicesRefreshing: false,
  selectedRemoteModelByDevice: {},
};

export const remoteSlice = createSlice({
  name: 'remote',
  initialState,
  reducers: {
    // --- Wizard ---------------------------------------------------------
    wizardOpened(state) {
      state.wizardStep = 'choose-type';
    },
    wizardStepChanged(state, action: PayloadAction<RemoteWizardStep>) {
      state.wizardStep = action.payload;
    },
    wizardClosed(state) {
      state.wizardStep = 'closed';
    },

    // --- This-device dialog --------------------------------------------
    thisDeviceDialogOpened(state) {
      state.thisDeviceDialogOpen = true;
    },
    thisDeviceDialogClosed(state) {
      state.thisDeviceDialogOpen = false;
    },

    // --- Local device ---------------------------------------------------
    localDeviceRenamed(state, action: PayloadAction<string>) {
      const next = action.payload.trim();
      if (next.length === 0) return;
      // Cast through any for Immer readonly compatibility — the surrounding
      // immutability contract still holds for callers.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state.localDevice as any).name = next;
    },
    allowModelLoadingToggled(state, action: PayloadAction<boolean>) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state.localDevice as any).allowModelLoading = action.payload;
    },

    // --- Remote devices -------------------------------------------------
    devicePaired(state, action: PayloadAction<Device>) {
      const incoming = action.payload;
      const idx = state.devices.findIndex((d) => d.id === incoming.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clone = JSON.parse(JSON.stringify(incoming)) as any;
      if (idx >= 0) {
        (state.devices as Device[])[idx] = clone;
      } else {
        (state.devices as Device[]).push(clone);
      }
    },
    deviceStatusChanged(
      state,
      action: PayloadAction<{ id: DeviceId; status: DeviceStatus }>,
    ) {
      const dev = state.devices.find((d) => d.id === action.payload.id);
      if (!dev) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dev as any).status = action.payload.status;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dev as any).lastSeenAt = new Date().toISOString();
    },
    deviceRemoved(state, action: PayloadAction<DeviceId>) {
      state.devices = state.devices.filter((d) => d.id !== action.payload);
      if (state.selectedDeviceId === action.payload) {
        state.selectedDeviceId = null;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (state.selectedRemoteModelByDevice as any)[action.payload];
    },
    // Marks a discovery refresh as in flight. The thunk flips this on,
    // then dispatches `devicesRefreshed` after a short delay so the
    // spinning affordance is actually visible.
    devicesRefreshStarted(state) {
      state.devicesRefreshing = true;
    },
    devicesRefreshed(state) {
      // No-op for the mock — real implementation would re-poll the
      // discovery service. We bump lastSeenAt so the UI's "refreshing"
      // animation has a state change to react to.
      for (const d of state.devices) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d as any).lastSeenAt = new Date().toISOString();
      }
      state.devicesRefreshing = false;
    },

    // --- Selection / filtering -----------------------------------------
    deviceSelected(state, action: PayloadAction<DeviceId | null>) {
      state.selectedDeviceId = action.payload;
    },
    modelsFilterChanged(state, action: PayloadAction<string>) {
      state.modelsFilterQuery = action.payload;
    },
    // Records which remote model the user picked to "use" on a given
    // device. Re-selecting the same model clears it (toggle behaviour).
    remoteModelSelected(
      state,
      action: PayloadAction<{ deviceId: DeviceId; modelId: string }>,
    ) {
      const { deviceId, modelId } = action.payload;
      const map = state.selectedRemoteModelByDevice as Record<string, string>;
      if (map[deviceId] === modelId) {
        delete map[deviceId];
      } else {
        map[deviceId] = modelId;
      }
    },

    // --- Peer-spawn timer ----------------------------------------------
    peerSpawnScheduled(
      state,
      action: PayloadAction<{ fireAt: number; kind: 'gui' | 'headless' | null }>,
    ) {
      state.pendingPeerSpawnAt = action.payload.fireAt;
      state.pendingPeerSpawnKind = action.payload.kind;
    },
    peerSpawnCleared(state) {
      state.pendingPeerSpawnAt = null;
      state.pendingPeerSpawnKind = null;
    },

    // Reserved for tests / settings → "Forget all paired devices".
    resetDevices(state) {
      state.devices = [];
      state.selectedDeviceId = null;
      state.pendingPeerSpawnAt = null;
      state.pendingPeerSpawnKind = null;
      state.devicesRefreshing = false;
      (state.selectedRemoteModelByDevice as Record<string, string>) = {};
    },

    // --- Auth / landing ------------------------------------------------
    loginStarted(state) {
      state.authStatus = 'authenticating';
    },
    loginCompleted(state) {
      state.authStatus = 'authenticated';
    },
    loginReset(state) {
      state.authStatus = 'unauthenticated';
    },
    learnModalOpened(state) {
      state.learnModalOpen = true;
    },
    learnModalClosed(state) {
      state.learnModalOpen = false;
    },
  },
});

export const {
  wizardOpened,
  wizardStepChanged,
  wizardClosed,
  thisDeviceDialogOpened,
  thisDeviceDialogClosed,
  localDeviceRenamed,
  allowModelLoadingToggled,
  devicePaired,
  deviceStatusChanged,
  deviceRemoved,
  devicesRefreshStarted,
  devicesRefreshed,
  deviceSelected,
  modelsFilterChanged,
  remoteModelSelected,
  peerSpawnScheduled,
  peerSpawnCleared,
  resetDevices,
  loginStarted,
  loginCompleted,
  loginReset,
  learnModalOpened,
  learnModalClosed,
} = remoteSlice.actions;
export const remoteReducer = remoteSlice.reducer;
