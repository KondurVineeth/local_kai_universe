import { CaretLeft, Cpu, GraphicsCard, HardDrives, Lightning, Memory, Warning } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Icon, Spinner } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectOnboardingHardware,
  selectOnboardingHardwareDetecting,
  selectOnboardingHardwareError,
} from '../../store/selectors';
import { stepReached } from '../../store/slice';
import { detectHardwareThunk } from '../../store/thunks';

import type { HardwareSpec } from '@shared/domain/system/entities/HardwareSpec';

// Auto-runs hardware detection on mount. While detecting, shows a centered
// pulse with copy. Once complete, reveals four chips (CPU / RAM / GPU /
// VRAM) and the recommended engine.
export function HardwareScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const hardware = useAppSelector(selectOnboardingHardware);
  const detecting = useAppSelector(selectOnboardingHardwareDetecting);
  const error = useAppSelector(selectOnboardingHardwareError);

  useEffect(() => {
    dispatch(stepReached('hardware'));
    // Only probe when there's no result yet. Re-entering this screen
    // (Back from Starter Model, or a wizard reload) used to re-run
    // detection on every mount — and `hardwareDetected` clears
    // `selectedModelId`, silently wiping the user's starter-model pick.
    // Skipping re-detection when `hardware` is already present keeps the
    // selection intact. Retry stays available via the error path.
    if (!hardware && !detecting) {
      void dispatch(detectHardwareThunk());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return (
    <div className="flex flex-col gap-3xl">
      <div className="flex flex-col gap-m text-center">
        <h2 className="text-xl font-bold text-fg-default">Detecting your hardware</h2>
        <p className="text-sm text-fg-muted">
          Universe picks model recommendations based on your system specs.
        </p>
      </div>
      {error ? (
        <DetectionError message={error} onRetry={() => void dispatch(detectHardwareThunk())} />
      ) : detecting || !hardware ? (
        <div className="flex flex-col items-center gap-m py-3xl">
          <Spinner size="md" />
          <p className="text-sm text-fg-muted">Scanning…</p>
        </div>
      ) : (
        <HardwareGrid hardware={hardware} />
      )}
      <div className="flex items-center justify-between gap-m">
        <Button
          variant="ghost"
          size="md"
          leadingIcon={<Icon icon={CaretLeft} size="sm" weight="bold" />}
          onClick={() => navigate('/onboarding/mode')}
        >
          Back
        </Button>
        <div className="flex flex-col items-end gap-xs">
          <Button
            variant="primary"
            size="md"
            disabled={!hardware || detecting}
            onClick={() => navigate('/onboarding/model')}
          >
            Continue
          </Button>
          {(!hardware || detecting) && !error && (
            <span className="text-caption text-fg-subtle">
              Waiting for hardware detection to finish.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DetectionError({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-m rounded-md border border-danger/40 bg-danger/10 p-l">
      <div className="flex items-center gap-s">
        <Icon icon={Warning} size="md" className="text-danger" />
        <h3 className="text-sm font-medium text-fg-default">Hardware detection unavailable</h3>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function HardwareGrid({ hardware }: { readonly hardware: HardwareSpec }) {
  const ramGb = bytesToGb(hardware.memory.totalBytes);
  const vramGb = bytesToGb(hardware.gpu.vramBytes);
  const recommendedEngine = hardware.availableEngines.find((e) => e.recommended);
  return (
    <div className="grid grid-cols-1 gap-m sm:grid-cols-2">
      <SpecChip
        icon={Cpu}
        label="CPU"
        value={hardware.cpu.brand}
        sub={cpuCoresLabel(hardware.cpu)}
      />
      <SpecChip
        icon={Memory}
        label="System RAM"
        value={`${ramGb.toFixed(0)} GB`}
        sub={`${bytesToGb(hardware.memory.availableBytes).toFixed(1)} GB available`}
      />
      <SpecChip
        icon={GraphicsCard}
        label="GPU"
        value={gpuLabel(hardware.gpu)}
        sub={engineHints(hardware)}
      />
      <SpecChip
        icon={HardDrives}
        label="VRAM"
        value={`${vramGb.toFixed(0)} GB`}
        sub={vramTier(vramGb)}
        good={vramGb >= 8}
      />
      {recommendedEngine && (
        <SpecChip
          icon={Lightning}
          label="Recommended engine"
          value={recommendedEngine.kind}
          sub="Auto-selected for your hardware"
          good
          span
        />
      )}
    </div>
  );
}

interface SpecChipProps {
  readonly icon: typeof Cpu;
  readonly label: string;
  readonly value: string;
  readonly sub?: string;
  readonly good?: boolean;
  readonly span?: boolean;
}

function SpecChip({ icon, label, value, sub, good, span }: SpecChipProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-m rounded-md border border-border-default bg-bg-surface p-l',
        span && 'sm:col-span-2',
      )}
    >
      <Icon icon={icon} size="md" className={good ? 'text-fg-accent' : 'text-fg-muted'} />
      <div className="flex min-w-0 flex-col gap-xs">
        <span className="text-caption uppercase tracking-wider text-fg-subtle">{label}</span>
        <span className="truncate text-sm font-medium text-fg-default">{value}</span>
        {sub && <span className="text-caption text-fg-subtle">{sub}</span>}
      </div>
    </div>
  );
}

function bytesToGb(bytes: number): number {
  return bytes / 1024 ** 3;
}

// "8 cores · 4P + 4E" when the Apple Silicon split is known, else "8 cores".
function cpuCoresLabel(cpu: HardwareSpec['cpu']): string {
  const { cores, performanceCores, efficiencyCores } = cpu;
  if (performanceCores && efficiencyCores) {
    return `${cores} cores · ${performanceCores}P + ${efficiencyCores}E`;
  }
  return `${cores} ${cores === 1 ? 'core' : 'cores'}`;
}

// "Apple M2 · 10-core GPU" when the integrated core count is known.
function gpuLabel(gpu: HardwareSpec['gpu']): string {
  return gpu.coreCount ? `${gpu.model} · ${gpu.coreCount}-core GPU` : gpu.model;
}

function vramTier(gb: number): string {
  if (gb >= 24) return 'Plenty of room — large models welcome';
  if (gb >= 16) return 'Comfortable for 7-13B models';
  if (gb >= 8) return 'Good for 3-8B models';
  return 'Small models recommended';
}

function engineHints(hw: HardwareSpec): string {
  const support: string[] = [];
  if (hw.gpu.metalSupported) support.push('Metal');
  if (hw.gpu.cudaSupported) support.push('CUDA');
  if (hw.gpu.rocmSupported) support.push('ROCm');
  if (hw.gpu.vulkanSupported) support.push('Vulkan');
  return support.length > 0 ? support.join(' · ') : 'CPU only';
}
