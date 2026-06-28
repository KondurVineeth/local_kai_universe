import { Question } from '@phosphor-icons/react';

import {
  bypassMemoryLoadWarningsChanged,
  customContextLengthChanged,
  defaultContextLengthChanged,
  maxImagePxChanged,
  modelLoadingGuardrailsChanged,
  neverExceedImagePxChanged,

  selectBypassMemoryLoadWarnings,
  selectCustomContextLength,
  selectDefaultContextLength,
  selectMaxImagePx,
  selectModelLoadingGuardrails,
  selectNeverExceedImagePx} from '@features/settings';
import { Icon, Input, Switch, Tooltip } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { PanelLayout, RadioRow, SettingGroup } from '../shared/SettingsPrimitives';

import type {
  BypassMemoryLoadWarnings,
  DefaultContextLength,
  ModelLoadingGuardrails,
} from '@features/settings';

export function ModelDefaultsPanel() {
  return (
    <PanelLayout title="Model Defaults">
      <ImageInputGroup />
      <DefaultContextLengthGroup />
      <ModelLoadingGuardrailsGroup />
      <BypassMemoryLoadWarningsGroup />
    </PanelLayout>
  );
}

function ImageInputGroup() {
  const dispatch = useAppDispatch();
  const neverExceed = useAppSelector(selectNeverExceedImagePx);
  const maxPx = useAppSelector(selectMaxImagePx);
  return (
    <SettingGroup sectionTitle="Image Input">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-fg-default">
            <span>Never exceed</span>
            <Input
              type="number"
              min={64}
              value={maxPx}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (Number.isFinite(n)) dispatch(maxImagePxChanged(n));
              }}
              className="w-16"
              aria-label="Max image pixels"
            />
            <span>px</span>
          </div>
          <Switch
            checked={neverExceed}
            onCheckedChange={(v) => dispatch(neverExceedImagePxChanged(v))}
            aria-label="Never exceed image px"
          />
        </div>
        <p className="mt-2 text-xs text-fg-subtle">
          Resize images such that the longest edge is no larger than the value above. Proportions are maintained.
        </p>
      </div>
    </SettingGroup>
  );
}

function DefaultContextLengthGroup() {
  const dispatch = useAppDispatch();
  const value = useAppSelector(selectDefaultContextLength);
  const custom = useAppSelector(selectCustomContextLength);
  const options: Array<{ value: DefaultContextLength; label: string; sub: string }> = [
    {
      value: 'custom',
      label: 'Custom value',
      sub: 'Set the default context length for loading new models...',
    },
    {
      value: 'model-maximum',
      label: 'Model maximum',
      sub: 'Use the maximum context length supported by each model.',
    },
  ];
  return (
    <SettingGroup sectionTitle="Default Context Length">
      <div className="px-4 py-2">
        <p className="mb-2 text-xs font-medium text-fg-subtle">Default Context Length</p>
      </div>
      {options.map((opt) => (
        <div key={opt.value} className="border-t border-border-default first:border-t-0">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <button
              type="button"
              onClick={() => dispatch(defaultContextLengthChanged(opt.value))}
              className="flex flex-1 items-start gap-3 text-left"
            >
              <div className="mt-0.5 shrink-0">
                {value === opt.value ? (
                  <div className="h-4 w-4 rounded-full bg-accent" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-fg-subtle" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-fg-default">{opt.label}</span>
                <span className="text-xs text-fg-subtle">{opt.sub}</span>
              </div>
            </button>
            {opt.value === 'custom' && value === 'custom' && (
              <Input
                type="number"
                min={512}
                value={custom}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  if (Number.isFinite(n)) dispatch(customContextLengthChanged(n));
                }}
                className="w-20"
                aria-label="Custom context length"
              />
            )}
          </div>
        </div>
      ))}
    </SettingGroup>
  );
}

function ModelLoadingGuardrailsGroup() {
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

function BypassMemoryLoadWarningsGroup() {
  const dispatch = useAppDispatch();
  const value = useAppSelector(selectBypassMemoryLoadWarnings);
  const options: Array<{ value: BypassMemoryLoadWarnings; label: string; sub: string }> = [
    {
      value: 'requires-alt',
      label: 'Requires holding Alt/Option',
      sub: 'Only loads when manually confirmed with Alt/Option.',
    },
    {
      value: 'no-restriction',
      label: 'No restriction (not recommended)',
      sub: 'Always allows loading, even if it may cause instability or crashes.',
    },
  ];
  return (
    <SettingGroup>
      <div className="border-b border-border-default px-4 py-3">
        <p className="text-sm font-medium text-fg-default">Load Anyway</p>
        <p className="mt-0.5 text-xs text-fg-subtle">
          Bypass system checks to force-load models even when resources are insufficient.
        </p>
      </div>
      {options.map((opt) => (
        <RadioRow
          key={opt.value}
          label={opt.label}
          sub={opt.sub}
          selected={value === opt.value}
          onSelect={() => dispatch(bypassMemoryLoadWarningsChanged(opt.value))}
        />
      ))}
    </SettingGroup>
  );
}
