import type { RemoteWizardStep } from './slice';
import type { Device } from '../../domain/entities/Device';
import type { DeviceId } from '../../domain/value-objects/DeviceId';
import type { RootState } from '@shared/store/hooks';

export const selectLocalDevice = (state: RootState): Device =>
  state.remote.localDevice;

export const selectRemoteDevices = (state: RootState): readonly Device[] =>
  state.remote.devices;

export const selectSelectedDeviceId = (state: RootState): DeviceId | null =>
  state.remote.selectedDeviceId;

export const selectSelectedDevice = (state: RootState): Device | null => {
  const id = state.remote.selectedDeviceId;
  if (!id) return null;
  return state.remote.devices.find((d) => d.id === id) ?? null;
};

// Three selectors below tolerate `undefined` from the slice because
// `remoteCommittedOnlyTransform` strips these transient fields on save,
// and redux-persist's default `autoMergeLevel1` reconciler replaces the
// whole `remote` slice with the persisted partial on rehydrate (it does
// NOT merge with initialState at level 2). Without the fallback,
// `selectModelsFilterQuery(...).trim()` crashed the right rail on first
// device-click after a reload. Centralising the default here keeps
// callers naive — they never see `undefined` and never need to write
// defensive `?? ''` at the call site.
export const selectWizardStep = (state: RootState): RemoteWizardStep =>
  state.remote.wizardStep ?? 'closed';

export const selectThisDeviceDialogOpen = (state: RootState): boolean =>
  state.remote.thisDeviceDialogOpen ?? false;

export const selectModelsFilterQuery = (state: RootState): string =>
  state.remote.modelsFilterQuery ?? '';

export const selectPendingPeerSpawnAt = (state: RootState): number | null =>
  state.remote.pendingPeerSpawnAt;

export const selectAuthStatus = (
  state: RootState,
): 'unauthenticated' | 'authenticating' | 'authenticated' =>
  state.remote.authStatus ?? 'unauthenticated';

export const selectLearnModalOpen = (state: RootState): boolean =>
  state.remote.learnModalOpen ?? false;

export const selectDevicesRefreshing = (state: RootState): boolean =>
  state.remote.devicesRefreshing ?? false;

// ModelId the user has chosen to "use" on the given device, or null.
export const selectSelectedRemoteModelId = (
  state: RootState,
  deviceId: DeviceId,
): string | null =>
  state.remote.selectedRemoteModelByDevice?.[deviceId] ?? null;
