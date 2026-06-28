import {
  HANDSHAKE_DURATION_MS,
  pickSpawnDelayMs,
  spawnPeerDevice,
} from '../../application/use-cases/peerSpawn';

import {
  devicePaired,
  deviceStatusChanged,
  devicesRefreshStarted,
  devicesRefreshed,
  loginCompleted,
  loginReset,
  loginStarted,
  peerSpawnCleared,
  peerSpawnScheduled,
  type RemoteState,
} from './slice';

import type { DeviceId } from '../../domain/value-objects/DeviceId';
import type { AnyAction, ThunkAction } from '@reduxjs/toolkit';
import type { Container } from '@shared/container';

type RemoteThunk<TReturn = void> = ThunkAction<
  TReturn,
  { remote: RemoteState },
  Container,
  AnyAction
>;

// Tracks any in-flight setTimeout across thunk dispatches so the slice's
// timer doesn't double-fire when the user closes/reopens the wizard
// rapidly. Module-level mutable state is OK here — the simulator is a
// process-scoped side effect, not feature state.
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

// Schedule a peer-spawn for the spec-mandated 3-5s window. Called when
// the user closes the AddDevice wizard. Writes `pendingPeerSpawnAt` to
// the slice so a reload mid-wait can resume; otherwise the user clicks
// Close, refreshes, and the device they were "told" was coming silently
// never arrives.
export function scheduleSimulatedPeerThunk(
  kind?: 'gui' | 'headless',
): RemoteThunk<void> {
  return (dispatch, getState) => {
    if (pendingTimer) return; // already waiting
    const delayMs = pickSpawnDelayMs();
    const fireAt = Date.now() + delayMs;
    dispatch(peerSpawnScheduled({ fireAt, kind: kind ?? null }));
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      dispatch(spawnPeerNowThunk());
      void getState; // referenced to keep the closure non-tree-shaken
    }, delayMs);
  };
}

// Resume a pending spawn after a reload. Reads `pendingPeerSpawnAt` from
// the slice; if it's in the past, fire immediately; if it's in the
// future, re-schedule with the remaining delta. Idempotent — safe to
// call on every boot, no-ops when nothing pending.
export function resumePendingPeerThunk(): RemoteThunk<void> {
  return (dispatch, getState) => {
    if (pendingTimer) return;
    const fireAt = getState().remote.pendingPeerSpawnAt;
    if (fireAt === null) return;
    const remaining = fireAt - Date.now();
    if (remaining <= 0) {
      dispatch(spawnPeerNowThunk());
      return;
    }
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      dispatch(spawnPeerNowThunk());
    }, remaining);
  };
}

// Mock device-discovery refresh. Sets the `devicesRefreshing` flag so the
// sidebar's refresh icon can spin, holds it for a beat so the state change
// is actually perceptible, then dispatches `devicesRefreshed` (which bumps
// every device's lastSeenAt and clears the flag). A synchronous refresh
// would give the user no feedback that anything happened.
const REFRESH_DURATION_MS = 900;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function refreshDevicesThunk(): RemoteThunk<void> {
  return (dispatch) => {
    if (refreshTimer) return; // already refreshing
    dispatch(devicesRefreshStarted());
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      dispatch(devicesRefreshed());
    }, REFRESH_DURATION_MS);
  };
}

// Re-runs a device's handshake: flips it to `connecting`, then back to
// `online` after the handshake-animation duration. Drives the
// device-detail "Reconnect" action. The mock has no real offline state,
// but this keeps the affordance honest if a device is ever offline, and
// lets an online device be visibly "refreshed" too. Defensive guard: no
// state mutation if the device id is unknown (deviceStatusChanged no-ops).
export function reconnectDeviceThunk(id: DeviceId): RemoteThunk<void> {
  return (dispatch, getState) => {
    const exists = getState().remote.devices.some((d) => d.id === id);
    if (!exists) return;
    dispatch(deviceStatusChanged({ id, status: 'connecting' }));
    setTimeout(() => {
      dispatch(deviceStatusChanged({ id, status: 'online' }));
    }, HANDSHAKE_DURATION_MS);
  };
}

// Simulates browser-based OAuth. Puts the UI into "authenticating" state for
// 3 s, then auto-resolves to `authenticated`. A module-level timer reference
// prevents a double-fire when the user clicks "Retry" before the first timer
// fires.
let loginTimer: ReturnType<typeof setTimeout> | null = null;

export function mockLoginThunk(): RemoteThunk<void> {
  return (dispatch) => {
    dispatch(loginStarted());
    if (loginTimer) clearTimeout(loginTimer);
    loginTimer = setTimeout(() => {
      loginTimer = null;
      dispatch(loginCompleted());
    }, 3000);
  };
}

// Cancels a pending mock-login timer + resets the auth state. The bare
// `loginReset` reducer alone would leave the module-scoped timer ticking,
// so a click on Retry could silently auto-complete login a few seconds
// later from the stale timer. Always cancel via this thunk.
export function cancelLoginThunk(): RemoteThunk<void> {
  return (dispatch) => {
    if (loginTimer) {
      clearTimeout(loginTimer);
      loginTimer = null;
    }
    dispatch(loginReset());
  };
}

// Inserts the new peer in `connecting` status, then flips to `online`
// after the handshake-animation duration. Exported separately so manual
// "Add another device" testing can call it without going through the
// timer.
export function spawnPeerNowThunk(): RemoteThunk<void> {
  return (dispatch, getState) => {
    const state = getState().remote;
    const taken = [
      state.localDevice.name,
      ...state.devices.map((d) => d.name),
    ];
    const peer = spawnPeerDevice(taken, state.pendingPeerSpawnKind ?? undefined);
    dispatch(devicePaired(peer));
    dispatch(peerSpawnCleared());
    setTimeout(() => {
      dispatch(deviceStatusChanged({ id: peer.id, status: 'online' }));
    }, HANDSHAKE_DURATION_MS);
  };
}
