import { useState, type KeyboardEvent } from 'react';

import { Input, Select, Slider, Switch } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { setConfigField } from '../../store/configSlice';
import { selectInferenceConfig } from '../../store/selectors';

import { PanelSection } from './PanelSection';
import { ValueBox } from './ValueBox';

import type { ContextOverflowStrategy } from '../../../domain/entities/InferenceConfig';

const OVERFLOW_OPTIONS = [
  { value: 'truncate-middle', label: 'Truncate Middle' },
  { value: 'truncate-start', label: 'Truncate Start' },
  { value: 'rolling-window', label: 'Rolling Window' },
  { value: 'error', label: 'Stop with Error' },
];

export function SettingsPanel() {
  const config = useAppSelector(selectInferenceConfig);
  const dispatch = useAppDispatch();
  const summary = `temp ${config.temperature.toFixed(2)} · ${
    OVERFLOW_OPTIONS.find((o) => o.value === config.contextOverflow)?.label ?? config.contextOverflow
  }`;
  return (
    <PanelSection panelKey="modelSettings" title="Settings" summary={summary}>
      <div className="flex flex-col gap-3">
        <TemperatureRow
          value={config.temperature}
          onChange={(v) => dispatch(setConfigField({ key: 'temperature', value: v }))}
        />
        <ToggleRow
          label="Limit Response Length"
          checked={config.limitResponseLength}
          onChange={(v) => dispatch(setConfigField({ key: 'limitResponseLength', value: v }))}
        />
        {/* CONFIG-025: when the toggle is on, expose a value editor (slider +
            box) for the actual `responseLengthLimit` token cap. Range 64–8192
            covers the common ZL Universe defaults. */}
        {config.limitResponseLength && (
          <ResponseLengthRow
            value={config.responseLengthLimit}
            onChange={(v) =>
              dispatch(setConfigField({ key: 'responseLengthLimit', value: v }))
            }
          />
        )}
        <SelectRow
          label="Context Overflow"
          value={config.contextOverflow}
          onChange={(v) => dispatch(setConfigField({ key: 'contextOverflow', value: v as ContextOverflowStrategy }))}
        />
        <StopStringsRow
          values={config.stopStrings}
          onChange={(next) => dispatch(setConfigField({ key: 'stopStrings', value: next }))}
        />
      </div>
    </PanelSection>
  );
}

function TemperatureRow({ value, onChange }: { readonly value: number; readonly onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-micro text-fg-muted">Temperature</span>
        <ValueBox
          value={value}
          min={0}
          max={2}
          step={0.05}
          onChange={onChange}
          format={(n) => n.toFixed(2)}
          ariaLabel="Temperature"
        />
      </div>
      <Slider value={value} min={0} max={2} step={0.05} onValueChange={onChange} aria-label="Temperature slider" />
    </div>
  );
}

function ResponseLengthRow({
  value,
  onChange,
}: {
  readonly value: number;
  readonly onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-micro text-fg-muted">Max response tokens</span>
        <ValueBox
          value={value}
          min={64}
          max={8192}
          step={64}
          onChange={onChange}
          ariaLabel="Max response tokens"
          width="w-20"
        />
      </div>
      <Slider
        value={value}
        min={64}
        max={8192}
        step={64}
        onValueChange={onChange}
        aria-label="Max response tokens slider"
      />
    </div>
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
    <div className="flex items-center justify-between">
      <span className="text-micro text-fg-muted">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function SelectRow({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_140px] items-center gap-2">
      <span className="text-micro text-fg-muted">{label}</span>
      <Select
        options={OVERFLOW_OPTIONS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      />
    </div>
  );
}

function StopStringsRow({
  values,
  onChange,
}: {
  // Tolerate undefined — old persisted state predating stopStrings can rehydrate
  // here before the migration / merge backfills it.
  readonly values: readonly string[] | undefined;
  readonly onChange: (next: readonly string[]) => void;
}) {
  const list = values ?? [];
  const [draft, setDraft] = useState('');
  // CONFIG-012: highlight when the draft is already in the list so the user
  // sees their Enter is a no-op.
  const trimmed = draft.trim();
  const duplicate = trimmed.length > 0 && list.includes(trimmed);
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (!trimmed) return;
    e.preventDefault();
    // CONFIG-012: dedupe on Enter so we never push duplicate entries that
    // would then collide on key (which used to use the value itself).
    if (list.includes(trimmed)) {
      // Leave the draft in place so the user can see it's already added.
      return;
    }
    onChange([...list, trimmed]);
    setDraft('');
  };
  return (
    <div className="grid grid-cols-[1fr_140px] items-start gap-2">
      <span className="pt-1.5 text-micro text-fg-muted">Stop Strings</span>
      <div className="flex flex-col gap-1">
        <Input
          inputSize="sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Enter a string and press ↵"
          aria-label="Add stop string"
          className="w-full"
          aria-invalid={duplicate ? true : undefined}
        />
        {duplicate && (
          <span className="text-caption text-fg-subtle" role="status">
            Already added
          </span>
        )}
        {list.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {list.map((s, idx) => (
              // CONFIG-012: key by index, not value. Using the value itself
              // as the key meant React would re-mount the wrong row whenever
              // a value happened to coincide with another (or whenever the
              // value mutated mid-edit). Index keys are stable for an
              // append-only / index-aware-delete workflow like this one.
              <li
                // eslint-disable-next-line react/no-array-index-key
                key={`${idx}-${s}`}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md bg-bg-raised px-1.5 py-0.5 text-caption text-fg-default',
                )}
              >
                <span className="font-mono">{s}</span>
                <button
                  type="button"
                  onClick={() => onChange(list.filter((_, i) => i !== idx))}
                  aria-label={`Remove stop string ${s}`}
                  className="text-fg-subtle hover:text-fg-default"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
