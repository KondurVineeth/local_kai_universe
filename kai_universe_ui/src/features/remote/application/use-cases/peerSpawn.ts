import { generateDeviceIdentifier } from './identifiers';

import type { Device } from '../../domain/entities/Device';
import type { DeviceId } from '../../domain/value-objects/DeviceId';
import type { Iso8601 } from '@shared/domain/primitives/Iso8601';

// Plausible peer-device names the simulator draws from. Inlined here
// rather than living as a JSON fixture because the application layer
// isn't allowed to import infrastructure/ — and a handful of strings
// don't earn a dedicated import path. When (if) we promote this to a
// real catalog, it moves into a shared/ fixture and gets injected via
// the container.
//
// Split by setup kind so the GUI/headless choice in the wizard has a
// visible consequence: a GUI device draws a desktop-flavoured name, a
// headless device draws a server-flavoured one.
const GUI_PEER_NAMES: readonly string[] = [
  "Roki's MacBook Pro",
  'Studio-PC-01',
  'dev-mini',
  'Workshop Tower',
  'Sofa-iMac',
  'Atelier Mac Studio',
  "Quokka's-MBA",
];
const HEADLESS_PEER_NAMES: readonly string[] = [
  'lab-server-west',
  'kestrel.local',
  'Nova-Linux-Box',
  'rack-node-7',
  'Bridgekeeper',
  'atomic-rust-rig',
  'studio-headless',
];

export type PeerSetupKind = 'gui' | 'headless';

function namePool(kind: PeerSetupKind | undefined): readonly string[] {
  if (kind === 'gui') return GUI_PEER_NAMES;
  if (kind === 'headless') return HEADLESS_PEER_NAMES;
  return [...GUI_PEER_NAMES, ...HEADLESS_PEER_NAMES];
}

// Builds the Device record that "appears" after a successful wizard run.
// Avoids names already taken by the user's other paired devices so the
// list doesn't look like a duplicate-detector failure. `kind` is the
// wizard's GUI/headless pick, which biases the name pool.
//
// Status starts as `connecting` — the slice flips it to `online` after a
// one-second handshake animation. We don't model `connecting → offline`
// failure here; the mock is forgiving.
export function spawnPeerDevice(
  takenNames: readonly string[],
  kind?: PeerSetupKind,
): Device {
  const allNames = namePool(kind);
  const used = new Set(takenNames.map((n) => n.toLowerCase()));
  const pool = allNames.filter((n) => !used.has(n.toLowerCase()));
  const candidates = pool.length > 0 ? pool : allNames;
  const name = candidates[Math.floor(Math.random() * candidates.length)] ?? 'New Device';
  const identifier = generateDeviceIdentifier();
  return {
    id: identifier as unknown as DeviceId,
    name,
    identifier,
    status: 'connecting',
    isLocal: false,
    lastSeenAt: new Date().toISOString() as Iso8601,
    allowModelLoading: false,
  };
}

// Spawn delay window. 3-5s is long enough to feel like an actual handshake
// (vs a synchronous reveal) but short enough that the user doesn't switch
// surfaces and miss the moment.
export const SPAWN_DELAY_MIN_MS = 3_000;
export const SPAWN_DELAY_MAX_MS = 5_000;
export const HANDSHAKE_DURATION_MS = 1_000;

export function pickSpawnDelayMs(): number {
  return (
    SPAWN_DELAY_MIN_MS +
    Math.floor(Math.random() * (SPAWN_DELAY_MAX_MS - SPAWN_DELAY_MIN_MS + 1))
  );
}
