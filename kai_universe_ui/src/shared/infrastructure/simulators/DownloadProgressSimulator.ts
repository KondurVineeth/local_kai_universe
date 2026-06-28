import { delay, jitter } from '@shared/lib/delay';

import type {
  Download,
  DownloadId,
  DownloadProgress,
  DownloadStatus,
} from '@shared/domain/download/entities/Download';
import type { Bytes } from '@shared/domain/primitives/Bytes';

// Lets the repository feed live status (paused/cancelled) into a running
// simulate() loop without the simulator reaching back into the repo.
export interface DownloadControlSignal {
  // Current user-driven status for this download. The loop reads it every
  // tick: 'paused' freezes progress, 'cancelled' stops the stream.
  status(): DownloadStatus;
  // Set when the loop has been superseded (e.g. retry spawned a fresh loop).
  // A stale loop sees this flip and exits without emitting further progress.
  isAborted(): boolean;
}

// Emits realistic 0→100% progress for a Download. Speed has a slow start, fast
// middle, and slow tail to mimic real network conditions on a model download.
// Honors user-initiated pause/resume/cancel via the control signal. By design
// it never spontaneously fails — the only terminal states are completed (the
// happy path) and cancelled (user-initiated).
export class DownloadProgressSimulator {
  async *simulate(
    download: Download,
    control: DownloadControlSignal,
  ): AsyncIterable<DownloadProgress> {
    const totalMs = jitter(8_000, 28_000);
    const tickMs = 200;
    const ticks = Math.max(1, Math.floor(totalMs / tickMs));
    const total = Number(download.totalBytes);

    let received = Number(download.receivedBytes);
    // Progress is keyed off elapsed "active" ticks, not wall-clock — a paused
    // download must resume from exactly where it stopped, not jump ahead.
    let activeTicks = Math.min(
      ticks,
      total > 0 ? Math.round((received / total) * ticks) : 0,
    );

    while (activeTicks < ticks) {
      if (control.isAborted()) return;

      const status = control.status();
      if (status === 'cancelled') {
        yield {
          id: download.id satisfies DownloadId,
          receivedBytes: received as Bytes,
          totalBytes: download.totalBytes,
          bytesPerSecond: 0,
          status: 'cancelled',
        };
        return;
      }
      if (status === 'paused') {
        // Emit a paused heartbeat so consumers can reflect the state, then
        // idle without advancing progress until the user resumes.
        yield {
          id: download.id satisfies DownloadId,
          receivedBytes: received as Bytes,
          totalBytes: download.totalBytes,
          bytesPerSecond: 0,
          status: 'paused',
        };
        await delay(tickMs);
        continue;
      }

      activeTicks += 1;
      // Cubic ease-in-out for a "real download" feel.
      const t = activeTicks / ticks;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const target = Math.min(total, Math.floor(total * eased));
      const delta = Math.max(0, target - received);
      const bytesPerSecond = Math.round((delta / tickMs) * 1000);
      received = target;

      const done = activeTicks >= ticks;
      yield {
        id: download.id satisfies DownloadId,
        receivedBytes: received as Bytes,
        totalBytes: download.totalBytes,
        bytesPerSecond,
        status: done ? 'completed' : 'downloading',
      };

      if (!done) await delay(tickMs);
    }
  }
}
