import type { RemoteModel } from '../entities/RemoteModel';
import type { DeviceId } from '../value-objects/DeviceId';

// Lists the models present on a given remote device. The mock generates a
// stable per-device set seeded from the deviceId — so the same peer always
// shows the same 3-5 models across sessions, but two peers don't trivially
// share lists.
export interface RemoteModelsRepository {
  listForDevice(deviceId: DeviceId): Promise<readonly RemoteModel[]>;
}
