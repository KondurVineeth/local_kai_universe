import type { DeviceId } from '../value-objects/DeviceId';
import type { DeviceStatus } from '../value-objects/DeviceStatus';
import type { Iso8601 } from '@shared/domain/primitives/Iso8601';

// A device paired into the local user's Remote network.
//
// `identifier` is the 32-hex string ZL Universe surfaces in This Device — the
// wire-level credential a remote machine would need to authenticate against
// us. In the mock it's purely cosmetic (no real network), but it gives the
// settings dialog something concrete to render and copy.
//
// `isLocal` distinguishes the current machine's own record (rendered in the
// bottom-left "This device" panel) from remote peers (rendered in the
// Network Devices list).
export interface Device {
  readonly id: DeviceId;
  readonly name: string;
  readonly identifier: string;
  readonly status: DeviceStatus;
  readonly isLocal: boolean;
  readonly lastSeenAt: Iso8601;
  // Local device only: whether peers are allowed to discover and load this
  // machine's models. Toggled by the user via ThisDeviceDialog. Always
  // `false` on remote-device records — we don't gate UI on a peer's claim.
  readonly allowModelLoading: boolean;
}
