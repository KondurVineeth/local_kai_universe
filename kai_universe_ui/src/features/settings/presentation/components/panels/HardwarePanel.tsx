import { ArrowSquareOut, Copy, Question } from '@phosphor-icons/react';

import { selectOnboardingHardware } from '@features/onboarding';
import {
  gpuEnabledChanged,
  gpuReset,
  modelLoadingGuardrailsChanged,
  selectGpuEnabled,
  selectModelLoadingGuardrails,
} from '@features/settings';
import { Bytes } from '@shared/domain/primitives/Bytes';
import { Button, Icon, Tooltip } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  OffOnToggle,
  PanelLayout,
  RadioRow,
  SavedHint,
  SettingGroup,
  SettingRow,
  useTransientFlag,
} from '../shared/SettingsPrimitives';

import type { ModelLoadingGuardrails } from '@features/settings';
import type { HardwareSpec } from '@shared/domain/system/entities/HardwareSpec';

const COMMUNITY_URL = 'https://lmstudio.ai/community';

function bytesToGb(bytes: number): number {
  return bytes / 1024 ** 3;
}

const FIXTURE: Pick<HardwareSpec, 'cpu' | 'gpu' | 'memory'> = {
  cpu: {
    brand: 'Apple M5',
    cores: 10,
    threads: 10,
    architecture: 'arm64',
  },
  gpu: {
    vendor: 'apple',
    model: 'Apple M5',
    vramBytes: Bytes.of(12_710_658_048), // ≈11.84 GB
    metalSupported: true,
    cudaSupported: false,
    rocmSupported: false,
    vulkanSupported: false,
  },
  memory: {
    totalBytes: Bytes.of(17_179_869_184), // 16 GB
    availableBytes: Bytes.of(8_589_934_592),
  },
};

export function HardwarePanel() {
  const hardware = useAppSelector(selectOnboardingHardware);
  const cpu = hardware?.cpu ?? FIXTURE.cpu;
  const gpu = hardware?.gpu ?? FIXTURE.gpu;
  const memory = hardware?.memory ?? FIXTURE.memory;
  const ramGb = bytesToGb(memory.totalBytes);
  const vramGb = bytesToGb(gpu.vramBytes);

  const { flag: copied, fire: fireCopied } = useTransientFlag();

  const copyInfo = () => {
    const report = [
      `CPU: ${cpu.brand} (${cpu.cores} cores, ${cpu.architecture})`,
      `RAM: ${ramGb.toFixed(2)} GB`,
      `GPU: ${gpu.model}`,
      `VRAM: ${vramGb.toFixed(2)} GB`,
    ].join('\n');
    void navigator.clipboard?.writeText(report);
    fireCopied();
  };

  const headerExtra = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={copyInfo}
        leadingIcon={<Icon icon={Copy} size="sm" />}
      >
        Copy Info
      </Button>
      <SavedHint show={copied} label="Copied" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(COMMUNITY_URL, '_blank', 'noopener,noreferrer')}
        leadingIcon={<Icon icon={ArrowSquareOut} size="sm" />}
      >
        Community
      </Button>
    </div>
  );

  return (
    <PanelLayout title="Hardware" headerExtra={headerExtra}>
      <CpuMemoryRow cpu={cpu} ramGb={ramGb} vramGb={vramGb} />
      <GpuGroup gpu={gpu} vramGb={vramGb} />
      <ResourceMonitorGroup ramGb={ramGb} />
      <GuardrailsGroup />
    </PanelLayout>
  );
}

function CpuMemoryRow({
  cpu,
  ramGb,
  vramGb,
}: {
  readonly cpu: HardwareSpec['cpu'];
  readonly ramGb: number;
  readonly vramGb: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SettingGroup>
        <div className="px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-semibold text-fg-default">CPU</span>
            <span className="rounded bg-green-900/40 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
              ✓ Compatible
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <InfoRow label="Name" value={cpu.brand} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-fg-subtle">Architecture</span>
              <div className="flex items-center gap-1">
                <span className="rounded border border-border-default px-1.5 py-0.5 text-[10px] text-fg-default">
                  {cpu.architecture.toUpperCase()}
                </span>
                <span className="rounded border border-border-default px-1.5 py-0.5 text-[10px] text-fg-default">
                  AdvSIMD
                </span>
              </div>
            </div>
          </div>
        </div>
      </SettingGroup>
      <SettingGroup>
        <div className="px-4 py-3">
          <div className="mb-0.5 text-sm font-semibold text-fg-default">Memory Capacity</div>
          <div className="mb-2 text-xs text-fg-subtle">Unified Memory</div>
          <div className="flex flex-col gap-1.5">
            <InfoRow label="RAM" value={`${ramGb.toFixed(2)} GB`} />
            <InfoRow label="VRAM" value={`${vramGb.toFixed(2)} GB`} />
          </div>
        </div>
      </SettingGroup>
    </div>
  );
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-fg-subtle">{label}</span>
      <span className="text-xs text-fg-default">{value}</span>
    </div>
  );
}

function GpuGroup({ gpu, vramGb }: { readonly gpu: HardwareSpec['gpu']; readonly vramGb: number }) {
  const dispatch = useAppDispatch();
  const gpuEnabled = useAppSelector(selectGpuEnabled);
  const engineLabels: string[] = [];
  if (gpu.metalSupported) engineLabels.push('Metal');
  if (gpu.cudaSupported) engineLabels.push('CUDA');
  if (gpu.rocmSupported) engineLabels.push('ROCm');
  const engineStr = engineLabels.join(' · ') || 'CPU only';

  return (
    <SettingGroup>
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-fg-default">GPUs</span>
          <span className="text-xs text-fg-subtle">1 GPU detected with {engineLabels[0] ?? 'Metal'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => dispatch(gpuReset())}>
            Reset to default
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              window.open('/settings/hardware', '_blank', 'noopener,noreferrer,width=720,height=640')
            }
            leadingIcon={<Icon icon={ArrowSquareOut} size="sm" />}
          >
            Open in new window
          </Button>
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-fg-default">{gpu.model}</p>
            <p className="text-xs text-fg-subtle">
              VRAM Capacity: {vramGb.toFixed(2)} GB · {engineStr} · deviceId: 0
            </p>
          </div>
          <OffOnToggle
            checked={gpuEnabled}
            onCheckedChange={(v) => dispatch(gpuEnabledChanged(v))}
          />
        </div>
      </div>
    </SettingGroup>
  );
}

// RAM + VRAM figure derives from detected hardware (total − available). CPU
// load has no honest source in the mock — there is no live sampling — so the
// section is labelled "snapshot", not "Live", and CPU shows "Not sampled".
function ResourceMonitorGroup({ ramGb }: { readonly ramGb: number }) {
  const hardware = useAppSelector(selectOnboardingHardware);
  const memory = hardware?.memory ?? FIXTURE.memory;
  const usedGb = bytesToGb(memory.totalBytes - memory.availableBytes);

  return (
    <SettingGroup>
      <div className="flex items-center gap-2 border-b border-border-default px-4 py-3">
        <span className="text-sm font-medium text-fg-default">Resource Monitor</span>
        <Tooltip content="Memory snapshot from hardware detection. CPU load is not sampled in this build.">
          <button type="button" className="text-fg-subtle">
            <Icon icon={Question} size="sm" />
          </button>
        </Tooltip>
      </div>
      <div className="grid grid-cols-2 divide-x divide-border-default">
        <SettingRow label="RAM + VRAM in use" sub={`of ${ramGb.toFixed(2)} GB total`}>
          <span className="text-sm text-fg-default">{usedGb.toFixed(2)} GB</span>
        </SettingRow>
        <SettingRow label="CPU">
          <span className="text-sm text-fg-subtle">Not sampled</span>
        </SettingRow>
      </div>
    </SettingGroup>
  );
}

function GuardrailsGroup() {
  const dispatch = useAppDispatch();
  const value = useAppSelector(selectModelLoadingGuardrails);
  const options: Array<{ value: ModelLoadingGuardrails; label: string; sub: string }> = [
    { value: 'off', label: 'OFF (Not Recommended)', sub: 'No precautions against system overload' },
    { value: 'relaxed', label: 'Relaxed', sub: 'Mild precautions against system overload' },
    { value: 'balanced', label: 'Balanced', sub: 'Moderate precautions against system overload' },
    { value: 'strict', label: 'Strict', sub: 'Strong precautions against system overload' },
    { value: 'custom', label: 'Custom', sub: 'Set your own limit for maximum model size that can be loaded' },
  ];
  return (
    <SettingGroup>
      <div className="flex items-center gap-2 border-b border-border-default px-4 py-3">
        <span className="text-sm font-medium text-fg-default">Model loading guardrails</span>
        <Tooltip content="Controls how strictly ZL Universe guards against loading models that may exceed available memory.">
          <button type="button" className="text-fg-subtle">
            <Icon icon={Question} size="sm" />
          </button>
        </Tooltip>
      </div>
      {options.map((opt) => (
        <RadioRow
          key={opt.value}
          label={opt.label}
          sub={opt.sub}
          selected={value === opt.value}
          onSelect={() => dispatch(modelLoadingGuardrailsChanged(opt.value))}
        />
      ))}
    </SettingGroup>
  );
}
