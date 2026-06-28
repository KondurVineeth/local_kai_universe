import { delayJittered } from '@shared/lib/delay';

import hardwareFixture from '../fixtures/hardware.json';

import type { HardwareSpec } from '@shared/domain/system/entities/HardwareSpec';
import type { SystemRepository } from '@shared/domain/system/ports/SystemRepository';



export class FixtureSystemRepository implements SystemRepository {
  async detectHardware(): Promise<HardwareSpec> {
    // Real hardware detection takes a moment. Simulate the "scanning" feel.
    await delayJittered(1100, 1900);
    return hardwareFixture as unknown as HardwareSpec;
  }
}
