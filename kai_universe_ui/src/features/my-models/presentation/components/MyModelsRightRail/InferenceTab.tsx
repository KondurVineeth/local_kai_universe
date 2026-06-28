import { ArrowCounterClockwise, ChatCircle, Sliders } from '@phosphor-icons/react';

import { Button, Icon, Select, Slider, Switch, Textarea } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectMyModelsInferenceOverride } from '../../store/selectors';
import { inferenceConfigPatched, inferenceConfigReset } from '../../store/slice';

import type { InferenceConfig } from '@features/chat';
import type { Model } from '@shared/domain/model/entities/Model';

const OVERFLOW_LABELS: Record<string, string> = {
  'truncate-middle': 'Truncate Middle',
  'truncate-start': 'Truncate Start',
  'rolling-window': 'Rolling Window',
  error: 'Stop with Error',
};

export function InferenceTab({ model }: { readonly model: Model }) {
  const dispatch = useAppDispatch();
  const override = useAppSelector(selectMyModelsInferenceOverride(model.id)) ?? {};
  const set = (patch: Partial<InferenceConfig>) =>
    dispatch(inferenceConfigPatched({ modelId: model.id, patch }));
  // No override keys → every control already shows its default value.
  const hasOverride = Object.keys(override).length > 0;
  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-fg-subtle">
          Inference Configuration
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={!hasOverride}
          leadingIcon={<Icon icon={ArrowCounterClockwise} size="xs" />}
          onClick={() => dispatch(inferenceConfigReset(model.id))}
        >
          Reset to defaults
        </Button>
      </div>
      <SystemPromptSection
        value={override.systemPrompt ?? ''}
        onChange={(v) => set({ systemPrompt: v })}
      />
      <SettingsSection override={override} set={set} />
      <SamplingSection override={override} set={set} />
    </div>
  );
}

function SystemPromptSection({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (v: string) => void;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-raised/30 p-3">
      <header className="flex items-center gap-2">
        <Icon icon={ChatCircle} size="xs" className="text-fg-muted" />
        <h2 className="text-xs font-medium text-fg-default">System Prompt</h2>
      </header>
      <Textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Example, "Only answer in rhymes"'
        aria-label="System prompt"
      />
      <p className="text-[10px] text-fg-subtle">
        Use this field to provide background instructions to the model, such as a set of rules,
        constraints, or general requirements.
      </p>
    </section>
  );
}

function SettingsSection({
  override,
  set,
}: {
  readonly override: Partial<InferenceConfig>;
  readonly set: (patch: Partial<InferenceConfig>) => void;
}) {
  const temperature = override.temperature ?? 0.6;
  const limitOn = override.limitResponseLength ?? false;
  const overflow = override.contextOverflow ?? 'truncate-middle';
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border-default bg-bg-raised/30 p-3">
      <header className="flex items-center gap-2">
        <Icon icon={Sliders} size="xs" className="text-fg-muted" />
        <h2 className="text-xs font-medium text-fg-default">Settings</h2>
      </header>
      <SliderRow
        label="Temperature"
        value={temperature}
        min={0}
        max={2}
        step={0.05}
        format={(n) => n.toFixed(2)}
        onChange={(v) => set({ temperature: v })}
      />
      <ToggleRow
        label="Limit Response Length"
        checked={limitOn}
        onChange={(v) => set({ limitResponseLength: v })}
      />
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 text-[11px]">
        <span className="text-fg-muted">Context Overflow</span>
        <Select
          options={Object.entries(OVERFLOW_LABELS).map(([value, label]) => ({ value, label }))}
          value={overflow}
          onChange={(e) =>
            set({ contextOverflow: e.target.value as InferenceConfig['contextOverflow'] })
          }
          aria-label="Context overflow"
          className="w-36"
        />
      </div>
    </section>
  );
}

function SamplingSection({
  override,
  set,
}: {
  readonly override: Partial<InferenceConfig>;
  readonly set: (patch: Partial<InferenceConfig>) => void;
}) {
  const topK = override.topK ?? 20;
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border-default bg-bg-raised/30 p-3">
      <header className="flex items-center gap-2">
        <Icon icon={Sliders} size="xs" className="text-fg-muted" />
        <h2 className="text-xs font-medium text-fg-default">Sampling</h2>
      </header>
      <SliderRow
        label="Top K Sampling"
        value={topK}
        min={1}
        max={200}
        step={1}
        onChange={(v) => set({ topK: v })}
      />
      <ToggleableSliderRow
        label="Repeat Penalty"
        enabled={override.repeatPenaltyEnabled ?? false}
        onToggle={(v) => set({ repeatPenaltyEnabled: v })}
        value={override.repeatPenalty ?? 1.1}
        min={1}
        max={2}
        step={0.01}
        format={(n) => n.toFixed(2)}
        onChange={(v) => set({ repeatPenalty: v })}
      />
      <ToggleableSliderRow
        label="Top P Sampling"
        enabled={override.topPEnabled ?? true}
        onToggle={(v) => set({ topPEnabled: v })}
        value={override.topP ?? 0.95}
        min={0}
        max={1}
        step={0.01}
        format={(n) => n.toFixed(2)}
        onChange={(v) => set({ topP: v })}
      />
      <ToggleableSliderRow
        label="Min P Sampling"
        enabled={override.minPEnabled ?? true}
        onToggle={(v) => set({ minPEnabled: v })}
        value={override.minP ?? 0}
        min={0}
        max={1}
        step={0.01}
        format={(n) => n.toFixed(2)}
        onChange={(v) => set({ minP: v })}
      />
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-fg-muted">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly format?: (n: number) => string;
  readonly onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-fg-muted">{label}</span>
        <span className="font-mono text-[10px] text-fg-default">
          {format ? format(value) : value}
        </span>
      </div>
      <Slider value={value} min={min} max={max} step={step} onValueChange={onChange} aria-label={label} />
    </div>
  );
}

interface ToggleableSliderRowProps {
  readonly label: string;
  readonly enabled: boolean;
  readonly onToggle: (v: boolean) => void;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly format?: (n: number) => string;
  readonly onChange: (v: number) => void;
}

function ToggleableSliderRow({
  label,
  enabled,
  onToggle,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: ToggleableSliderRowProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', !enabled && 'opacity-60')}>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="inline-flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Enable ${label}`} />
          <span className="text-fg-muted">{label}</span>
        </span>
        {enabled && (
          <span className="font-mono text-[10px] text-fg-default">
            {format ? format(value) : value}
          </span>
        )}
      </div>
      {enabled && (
        <Slider value={value} min={min} max={max} step={step} onValueChange={onChange} aria-label={label} />
      )}
    </div>
  );
}
