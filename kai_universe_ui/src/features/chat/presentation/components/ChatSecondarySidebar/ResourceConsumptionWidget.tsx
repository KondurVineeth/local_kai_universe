import { Cpu, Memory } from '@phosphor-icons/react';

import { selectOnboardingHardware } from '@features/onboarding';
import { Icon, Tooltip } from '@shared/ds/primitives';
import { useAppSelector } from '@shared/store/hooks';

// Fallback when hardware detection hasn't run (non-Electron / fixture mode):
// a typical 16 GB machine with half free. Mirrors the HardwarePanel fixture.
const FALLBACK_TOTAL_BYTES = 17_179_869_184;
const FALLBACK_AVAILABLE_BYTES = 8_589_934_592;

// Stable mocked CPU load — this is a clickable UI clone, not a live probe.
// Fixed so the readout doesn't flicker between renders.
const MOCK_CPU_PERCENT = 34;

const bytesToGb = (bytes: number): number => bytes / 1024 ** 3;

// Compact RAM / CPU readout for the chat sidebar footer. Gated by the
// Developer panel's "Show resource consumption widget" setting — the caller
// renders this only when that toggle is on.
export function ResourceConsumptionWidget() {
  const hardware = useAppSelector(selectOnboardingHardware);
  const totalBytes = hardware?.memory.totalBytes ?? FALLBACK_TOTAL_BYTES;
  const availableBytes = hardware?.memory.availableBytes ?? FALLBACK_AVAILABLE_BYTES;

  const usedBytes = Math.max(0, totalBytes - availableBytes);
  const ramPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
  const usedGb = bytesToGb(usedBytes);
  const totalGb = bytesToGb(totalBytes);

  return (
    <div className="flex flex-col gap-1.5" aria-label="Resource consumption">
      <ResourceMeter
        icon={<Icon icon={Memory} size="xs" />}
        label="RAM"
        percent={ramPercent}
        detail={`${usedGb.toFixed(1)} / ${totalGb.toFixed(1)} GB`}
      />
      <ResourceMeter
        icon={<Icon icon={Cpu} size="xs" />}
        label="CPU"
        percent={MOCK_CPU_PERCENT}
        detail={`${MOCK_CPU_PERCENT}%`}
      />
    </div>
  );
}

function ResourceMeter({
  icon,
  label,
  percent,
  detail,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly percent: number;
  readonly detail: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <Tooltip content={`${label}: ${detail}`} side="top">
      <div className="flex items-center gap-1.5" aria-label={`${label} ${detail}`}>
        <span className="text-fg-subtle">{icon}</span>
        <span className="w-7 shrink-0 text-caption text-fg-subtle">{label}</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-bg-raised">
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className="w-7 shrink-0 text-right text-caption tabular-nums text-fg-muted">
          {clamped}%
        </span>
      </div>
    </Tooltip>
  );
}
