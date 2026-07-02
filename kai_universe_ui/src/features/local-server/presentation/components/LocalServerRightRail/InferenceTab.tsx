import {
  ArrowCounterClockwise,
  CaretDown,
  ChatCircle,
  Check,
  Cube,
  FloppyDisk,
  GitBranch,
  Lightbulb,
  SlidersHorizontal,
  Wrench,
  X,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { selectInstalledModelIds } from '@features/my-models';
import { useContainer } from '@shared/container-context';
import { Button, Icon, Select, Slider, Switch, Textarea } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectInferenceConfig } from '../../store/selectors';
import {
  inferenceConfigChanged,
  inferenceConfigReset,
  type InferenceConfig,
} from '../../store/slice';

import type { Model } from '@shared/domain/model/entities/Model';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';

const OVERFLOW_OPTIONS = [
  { value: 'truncate-middle', label: 'Truncate Middle' },
  { value: 'truncate-start', label: 'Truncate Start' },
  { value: 'rolling-window', label: 'Rolling Window' },
  { value: 'error', label: 'Stop with Error' },
];

// The persisted `InferenceConfig` covers the knobs the audit requires to
// survive tab switches / reload (system prompt, temperature, top-K, draft
// model). Other sampling knobs stay ephemeral — cosmetic in the mock.
export function InferenceTab({ model }: { readonly model: Model }) {
  const dispatch = useAppDispatch();
  const persisted = useAppSelector(selectInferenceConfig);
  const [draft, setDraft] = useState<InferenceConfig>(persisted);
  useEffect(() => {
    setDraft(persisted);
  }, [persisted]);

  const dirty = (Object.keys(draft) as (keyof InferenceConfig)[]).some(
    (k) => draft[k] !== persisted[k],
  );
  const patch = (p: Partial<InferenceConfig>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <div className="flex flex-col gap-2 p-3">
      <PresetSection />
      <CollapsibleSection icon={<Icon icon={ChatCircle} size="xs" className="text-fg-muted" />} title="System Prompt" defaultOpen>
        <SystemPromptContent
          prompt={draft.systemPrompt}
          onChange={(v) => patch({ systemPrompt: v })}
        />
      </CollapsibleSection>
      <CollapsibleSection icon={<Icon icon={Lightbulb} size="xs" className="text-fg-muted" />} title="Custom Fields" defaultOpen>
        <CustomFieldsContent />
      </CollapsibleSection>
      <CollapsibleSection icon={<Icon icon={Wrench} size="xs" className="text-fg-muted" />} title="Settings" defaultOpen>
        <SettingsContent
          temperature={draft.temperature}
          onTemperatureChange={(v) => patch({ temperature: v })}
        />
      </CollapsibleSection>
      <CollapsibleSection icon={<Icon icon={SlidersHorizontal} size="xs" className="text-fg-muted" />} title="Sampling" defaultOpen>
        <SamplingContent
    topK={draft.topK}
    onTopKChange={(v) =>
        setDraft({
            ...draft,
            topK: v,
        })
    }

    topP={draft.topP}
    onTopPChange={(v) =>
        setDraft({
            ...draft,
            topP: v,
        })
    }

    repetitionPenalty={draft.repetitionPenalty}
    onRepetitionPenaltyChange={(v) =>
        setDraft({
            ...draft,
            repetitionPenalty: v,
        })
    }

    presencePenalty={draft.presencePenalty}
    onPresencePenaltyChange={(v) =>
        setDraft({
            ...draft,
            presencePenalty: v,
        })
    }

    minP={draft.minP}
    onMinPChange={(v) =>
        setDraft({
            ...draft,
            minP: v,
        })
    }
/>
      </CollapsibleSection>
      <CollapsibleSection icon={<Icon icon={Cube} size="xs" className="text-fg-muted" />} title="Structured Output" defaultOpen>
        <StructuredOutputContent />
      </CollapsibleSection>
      <CollapsibleSection icon={<Icon icon={GitBranch} size="xs" className="text-fg-muted" />} title="Speculative Decoding" defaultOpen>
        <SpeculativeDecodingContent
          currentModelId={model.id}
          draftModelId={draft.draftModelId}
          onDraftModelChange={(v) => patch({ draftModelId: v })}
        />
      </CollapsibleSection>

      <ApplyResetBar
        dirty={dirty}
        onApply={() => dispatch(inferenceConfigChanged(draft))}
        onReset={() => dispatch(inferenceConfigReset())}
      />
    </div>
  );
}

function ApplyResetBar({
  dirty,
  onApply,
  onReset,
}: {
  readonly dirty: boolean;
  readonly onApply: () => void;
  readonly onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        leadingIcon={<Icon icon={ArrowCounterClockwise} size="xs" />}
      >
        Reset
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={onApply}
        disabled={!dirty}
        leadingIcon={<Icon icon={Check} size="xs" />}
      >
        {dirty ? 'Apply changes' : 'Applied'}
      </Button>
    </div>
  );
}

function PresetSection() {
  const [saving, setSaving] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [currentPreset, setCurrentPreset] = useState('');

  if (saving) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-raised p-3">
        <div className="flex items-center gap-2">
          <Icon icon={Cube} size="xs" className="text-fg-muted" />
          <span className="text-xs font-medium text-fg-default">Preset</span>
        </div>
        <input
          autoFocus
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Enter a name for the preset..."
          className="w-full rounded-md border border-accent bg-bg-base px-3 py-1.5 text-xs text-fg-default placeholder:text-fg-subtle focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setSaving(false); setDraftName(''); }}>Cancel</Button>
          <Button variant="secondary" size="sm" disabled={!draftName.trim()} onClick={() => { setCurrentPreset(draftName); setSaving(false); setDraftName(''); }}>
            <Icon icon={FloppyDisk} size="xs" /> Save (↵)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-raised p-3">
      <div className="flex items-center gap-2">
        <Icon icon={Cube} size="xs" className="text-fg-muted" />
        <span className="text-xs font-medium text-fg-default">Preset</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Select
          options={currentPreset ? [{ value: currentPreset, label: currentPreset }] : []}
          placeholder="Select a Preset..."
          value={currentPreset}
          onChange={(e) => setCurrentPreset(e.target.value)}
          className="flex-1"
        />
        {currentPreset && (
          <button type="button" onClick={() => setCurrentPreset('')} aria-label="Clear preset" className="rounded-md p-1 text-fg-subtle hover:bg-bg-active hover:text-fg-default">
            <Icon icon={X} size="xs" />
          </button>
        )}
      </div>
      <Button variant="secondary" size="sm" onClick={() => setSaving(true)}>
        + Save Preset As...
      </Button>
    </div>
  );
}

function SystemPromptContent({
  prompt,
  onChange,
}: {
  readonly prompt: string;
  readonly onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-fg-muted">System Prompt</span>
      <Textarea
        rows={6}
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Example, "Only answer in rhymes"'
        aria-label="System prompt"
      />
      <span className="text-right text-[10px] text-fg-subtle">
        Token count: {prompt.trim() ? Math.ceil(prompt.trim().length / 4) : 'N/A'}
      </span>
    </div>
  );
}

function CustomFieldsContent() {
  const [enableThinking, setEnableThinking] = useState(true);
  return (
    <div className="flex flex-col gap-1.5">
      <InlineRow label="Enable Thinking">
        <Switch checked={enableThinking} onCheckedChange={setEnableThinking} aria-label="Enable thinking" />
      </InlineRow>
      <p className="text-[10px] text-fg-subtle">Controls whether the model will think before replying</p>
    </div>
  );
}

function SettingsContent({
  temperature,
  onTemperatureChange,
}: {
  readonly temperature: number;
  readonly onTemperatureChange: (v: number) => void;
}) {
  const [limitLength, setLimitLength] = useState(false);
  const [overflow, setOverflow] = useState('truncate-middle');
  const [cpuThreads, setCpuThreads] = useState(7);

  return (
    <div className="flex flex-col gap-3">
      <SliderRow label="Temperature" value={temperature} min={0} max={2} step={0.05} format={(n) => n.toFixed(1)} onChange={onTemperatureChange} />
      <InlineRow label="Limit Response Length">
        <input type="checkbox" checked={limitLength} onChange={(e) => setLimitLength(e.target.checked)} className="h-3.5 w-3.5 rounded accent-accent" aria-label="Limit response length" />
      </InlineRow>
      <InlineRow label="Context Overflow">
        <Select options={OVERFLOW_OPTIONS} value={overflow} onChange={(e) => setOverflow(e.target.value)} className="w-40" aria-label="Context overflow" />
      </InlineRow>
      <InlineRow label="Stop Strings">
        <input type="text" placeholder="Enter a string and press ↵" className="w-48 rounded-md border border-border-strong bg-bg-base px-2 py-1 text-xs text-fg-default placeholder:text-fg-subtle focus:outline-none" aria-label="Stop strings" />
      </InlineRow>
      <SliderRow label="CPU Threads" value={cpuThreads} min={1} max={32} step={1} onChange={setCpuThreads} />
    </div>
  );
}

function SamplingContent({
  topK,
  onTopKChange,
  topP,
  onTopPChange,
  repetitionPenalty,
  onRepetitionPenaltyChange,
  presencePenalty,
  onPresencePenaltyChange,
  minP,
  onMinPChange,
}: {
  readonly topK: number;
  readonly onTopKChange: (v: number) => void;

  readonly topP: number;
  readonly onTopPChange: (v: number) => void;

  readonly repetitionPenalty: number;
  readonly onRepetitionPenaltyChange: (v: number) => void;

  readonly presencePenalty: number;
  readonly onPresencePenaltyChange: (v: number) => void;

  readonly minP: number;
  readonly onMinPChange: (v: number) => void;
}){
  const [repeatOn, setRepeatOn] = useState(true);
  const [presenceOn, setPresenceOn] = useState(false);
  const [topPOn, setTopPOn] = useState(true);
  const [minPOn, setMinPOn] = useState(true);

  return (
    <div className="flex flex-col gap-3">
      <InlineRow label="Top K Sampling">
        <NumInput value={topK} onChange={onTopKChange} />
      </InlineRow>
      <ToggleableSliderRow label="Repeat Penalty" enabled={repeatOn} onToggle={setRepeatOn} value={repetitionPenalty} min={1} max={2} step={0.01} format={(n) => String(n)} onChange={onRepetitionPenaltyChange} />
      <InlineRow label="Presence Penalty">
        <input type="checkbox" checked={presenceOn} onChange={(e) => setPresenceOn(e.target.checked)} className="h-3.5 w-3.5 rounded accent-accent" aria-label="Presence penalty" />
      </InlineRow>
      <ToggleableSliderRow label="Top P Sampling" enabled={topPOn} onToggle={setTopPOn} value={topP} min={0} max={1} step={0.01} format={(n) => String(n)} onChange={onTopPChange} />
      <ToggleableSliderRow label="Min P Sampling" enabled={minPOn} onToggle={setMinPOn} value={minP} min={0} max={1} step={0.01} format={(n) => String(n)} onChange={onMinPChange} />
    </div>
  );
}

function StructuredOutputContent() {
  const [enabled, setEnabled] = useState(false);
  return (
    <InlineRow label="Structured Output">
      <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Structured output" />
    </InlineRow>
  );
}

interface DraftModelOption {
  readonly value: string;
  readonly label: string;
}

function SpeculativeDecodingContent({
  currentModelId,
  draftModelId,
  onDraftModelChange,
}: {
  readonly currentModelId: ModelId;
  readonly draftModelId: string | null;
  readonly onDraftModelChange: (v: string | null) => void;
}) {
  const navigate = useNavigate();
  const container = useContainer();
  const installedIds = useAppSelector(selectInstalledModelIds);
  const [options, setOptions] = useState<readonly DraftModelOption[]>([]);
  const [cutoff, setCutoff] = useState(0.75);
  const [minDraft, setMinDraft] = useState(0);
  const [maxDraft, setMaxDraft] = useState(16);

  // Populate the draft-model picker from installed models — a draft model
  // is any installed model other than the one currently loaded. Resolving
  // names needs the model repository (IDs alone aren't display-worthy).
  const idsKey = useMemo(() => installedIds.join(','), [installedIds]);
  useEffect(() => {
    let cancelled = false;
    const candidates = installedIds.filter((id) => id !== currentModelId);
    Promise.all(candidates.map((id) => container.modelRepository.findById(id)))
      .then((models) => {
        if (cancelled) return;
        setOptions(
          models
            .filter((m): m is NonNullable<typeof m> => m !== null)
            .map((m) => ({ value: m.id, label: m.displayName })),
        );
      })
      .catch(() => {
        // Repository read failed — leave the list empty rather than crash.
        if (!cancelled) setOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [container, idsKey, installedIds, currentModelId]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-fg-muted">Draft Model</span>
          <button
            type="button"
            onClick={() => navigate('/developer-docs/rest-overview')}
            className="text-[10px] text-accent hover:underline"
          >
            Read how it works
          </button>
        </div>
        <div className="flex items-center gap-1">
          <select
            value={draftModelId ?? ''}
            onChange={(e) => onDraftModelChange(e.target.value || null)}
            aria-label="Draft model"
            className="flex-1 appearance-none rounded-md border border-border-strong bg-bg-base px-2 py-1.5 pr-7 text-xs text-fg-default focus:outline-none"
          >
            <option value="">
              {options.length === 0
                ? 'No compatible draft models installed'
                : 'Select a compatible draft model'}
            </option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {draftModelId && (
            <button type="button" onClick={() => onDraftModelChange(null)} aria-label="Clear" className="rounded-md p-1 text-fg-subtle hover:bg-bg-raised hover:text-fg-default">
              <Icon icon={X} size="xs" />
            </button>
          )}
        </div>
      </div>
      <SliderRow label="Drafting Probability Cutoff" value={cutoff} min={0} max={1} step={0.01} format={(n) => String(n)} onChange={setCutoff} />
      <SliderRow label="Min Draft Size" value={minDraft} min={0} max={16} step={1} onChange={setMinDraft} />
      <SliderRow label="Max Draft Size" value={maxDraft} min={1} max={64} step={1} onChange={setMaxDraft} />
    </div>
  );
}

function CollapsibleSection({ icon, title, defaultOpen = false, children }: { readonly icon: React.ReactNode; readonly title: string; readonly defaultOpen?: boolean; readonly children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={cn('overflow-hidden rounded-md bg-bg-raised', open ? 'border border-border-default' : 'border border-transparent')}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-bg-active/40">
        {icon}
        <span className="flex-1 text-xs font-medium text-fg-default">{title}</span>
        <Icon icon={CaretDown} size="xs" className={cn('text-fg-subtle transition-transform', open ? 'rotate-0' : '-rotate-90')} />
      </button>
      {open && <div className="px-3 pb-4 pt-1">{children}</div>}
    </section>
  );
}

function InlineRow({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-fg-muted">{label}</span>
      {children}
    </div>
  );
}

function SliderRow({ label, value, min, max, step, format, onChange }: { readonly label: string; readonly value: number; readonly min: number; readonly max: number; readonly step: number; readonly format?: (n: number) => string; readonly onChange: (v: number) => void }) {
  const display = format ? format(value) : String(value);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-fg-muted">{label}</span>
        <NumInput value={value} onChange={onChange} display={display} />
      </div>
      <Slider value={value} min={min} max={max} step={step} onValueChange={onChange} aria-label={label} />
    </div>
  );
}

function ToggleableSliderRow({ label, enabled, onToggle, value, min, max, step, format, onChange }: { readonly label: string; readonly enabled: boolean; readonly onToggle: (v: boolean) => void; readonly value: number; readonly min: number; readonly max: number; readonly step: number; readonly format?: (n: number) => string; readonly onChange: (v: number) => void }) {
  const display = format ? format(value) : String(value);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-2 text-fg-muted">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} className="h-3.5 w-3.5 rounded accent-accent" aria-label={`Enable ${label}`} />
          {label}
        </span>
        {enabled && <NumInput value={value} onChange={onChange} display={display} />}
      </div>
      {enabled && <Slider value={value} min={min} max={max} step={step} onValueChange={onChange} aria-label={`${label} slider`} />}
    </div>
  );
}

function NumInput({ value, onChange, display }: { readonly value: number; readonly onChange: (v: number) => void; readonly display?: string }) {
  return (
    <input
      type="number"
      value={display ?? value}
      onChange={(e) => {
        const next = Number(e.target.value);
        if (Number.isFinite(next)) onChange(next);
      }}
      className="w-16 rounded-md border border-border-strong bg-bg-base px-2 py-1 text-right font-mono text-xs text-fg-default [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      aria-label={String(value)}
    />
  );
}
