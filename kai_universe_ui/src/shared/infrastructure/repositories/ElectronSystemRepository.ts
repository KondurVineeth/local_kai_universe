import { FixtureSystemRepository } from './FixtureSystemRepository';
import { HardwareDetectionUnavailableError } from './HardwareDetectionUnavailableError';

import type { HardwareSpec } from '@shared/domain/system/entities/HardwareSpec';
import type { SystemRepository } from '@shared/domain/system/ports/SystemRepository';

// Heuristic: we're running inside Electron's renderer if the userAgent mentions
// it. Vitest and web previews don't, so they keep the fixture path.
function inElectronRenderer(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.toLowerCase().includes('electron')
  );
}

// Real hardware detection via the Electron preload bridge. The main process
// handler (electron/main/hardware.ts) wraps Node's `os` module + a few
// platform-specific shell probes (`system_profiler` on macOS, PowerShell
// `Get-CimInstance` on Windows, `nvidia-smi` / `lspci` on Linux).
//
// Loudly fails inside Electron when the bridge is missing — previously a
// silent fixture fallback masked a stale-preload bug where real-detection
// looked wired up but the renderer kept seeing fixture data. Outside
// Electron (vitest, web previews) we still hand back fixture data so unit
// tests stay deterministic.
export class ElectronSystemRepository implements SystemRepository {
  private readonly fallback = new FixtureSystemRepository();

  async detectHardware(): Promise<HardwareSpec> {
    const bridge = typeof window !== 'undefined' ? window.universe?.detectHardware : undefined;
    if (!bridge) {
      if (inElectronRenderer()) {
        throw new HardwareDetectionUnavailableError(
          'window.universe.detectHardware is not exposed. The Electron preload bridge failed to load — typically a stale out/preload/index.mjs after a source edit. Run `npm run build` (or restart `npm run dev`) so electron-vite re-emits the preload bundle.',
        );
      }
      return this.fallback.detectHardware();
    }
    const report = await bridge();
    return report as HardwareSpec;
  }
}
