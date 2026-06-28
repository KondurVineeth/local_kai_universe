import { EntityId } from '@shared/domain/primitives/EntityId';

// Stable identifier for a device paired into the user's Remote network.
// Distinct from the device's display name (mutable) and from its identifier
// hex (the wire-level credential rendered to the user in ThisDeviceDialog).
export type DeviceId = EntityId<'DeviceId'>;
export const DeviceId = EntityId;
