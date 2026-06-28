import type { HardwareSpec } from '../entities/HardwareSpec';

export interface SystemRepository {
  // Returns the (mocked) hardware capabilities of the host machine.
  // The fixture adapter simulates a 1-2s "scanning" delay.
  detectHardware(): Promise<HardwareSpec>;
}
