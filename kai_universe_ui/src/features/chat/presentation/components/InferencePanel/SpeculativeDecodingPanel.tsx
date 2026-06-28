import { X } from '@phosphor-icons/react';

import { APP_URLS } from '@shared/config/appUrls';
import { Icon, Slider, Switch } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { useAvailableDraftModels } from '../../hooks/useAvailableDraftModels';
import { setConfigField } from '../../store/configSlice';
import { selectInferenceConfig } from '../../store/selectors';

import { PanelSection } from './PanelSection';
import { ValueBox } from './ValueBox';

export function SpeculativeDecodingPanel() {
  const config = useAppSelector(selectInferenceConfig);
  const dispatch = useAppDispatch();
  const { models, isLoading, error } = useAvailableDraftModels();
  // CONFIG-008: master toggle now wires to `speculativeDecodingEnabled`
  // (previously dead state). When off the per-knob rows collapse, matching
  // the ZL Universe reference where speculative decoding is a single switch.
  const enabled = config.speculativeDecodingEnabled;
  const summary = !enabled
    ? 'Disabled'
    : config.draftModelId
      ? `${config.draftModelId} · ${config.draftTokens} tokens`
      : 'No draft model';
  return (
    <PanelSection panelKey="speculativeDecoding" title="Speculative Decoding" summary={summary}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-micro text-fg-muted">Speculative Decoding</span>
          <Switch
            checked={enabled}
            onCheckedChange={(v) =>
              dispatch(setConfigField({ key: 'speculativeDecodingEnabled', value: v }))
            }
            aria-label="Enable speculative decoding"
          />
        </div>
        {enabled && (
          <>
            <DraftModelRow
              value={config.draftModelId}
              models={models}
              isLoading={isLoading}
              error={error}
              onChange={(id) => dispatch(setConfigField({ key: 'draftModelId', value: id }))}
            />
            <DraftTokensRow
              value={config.draftTokens}
              onChange={(v) => dispatch(setConfigField({ key: 'draftTokens', value: v }))}
            />
            <div className="flex items-center justify-between">
              <span className="text-micro text-fg-muted">Visualize accepted draft tokens</span>
              <Switch
                checked={config.visualizeDraftTokens}
                onCheckedChange={(v) =>
                  dispatch(setConfigField({ key: 'visualizeDraftTokens', value: v }))
                }
                aria-label="Visualize accepted draft tokens"
              />
            </div>
          </>
        )}
      </div>
    </PanelSection>
  );
}

interface DraftModelRowProps {
  readonly value: string | null;
  readonly models: readonly { readonly id: string; readonly displayName: string; readonly parameterCountB: number }[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onChange: (id: string | null) => void;
}

function DraftModelRow({ value, models, isLoading, error, onChange }: DraftModelRowProps) {
  // Empty state when no models are installed (CONFIG-007). The dropdown is
  // disabled and shows an inline hint pointing at My Models.
  const empty = !isLoading && !error && models.length === 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-micro text-fg-muted">Draft Model</span>
        <a
          href={APP_URLS.docs}
          target="_blank"
          rel="noreferrer"
          className="text-caption text-fg-accent hover:underline"
        >
          Read how it works
        </a>
      </div>
      <div className="flex items-center gap-1">
        <span className="relative inline-flex w-full">
          <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            aria-label="Draft model"
            disabled={isLoading || empty || !!error}
            className="w-full appearance-none rounded-md border border-border-strong bg-bg-base px-2 py-1.5 pr-7 text-xs text-fg-default focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 disabled:text-fg-muted"
          >
            <option value="">
              {isLoading
                ? 'Loading models…'
                : error
                  ? 'Couldn’t load models'
                  : empty
                    ? 'No installed models'
                    : 'Select a compatible draft model'}
            </option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName} ({m.parameterCountB}B)
              </option>
            ))}
          </select>
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Clear draft model"
            className="rounded-md p-1 text-fg-subtle hover:bg-bg-raised hover:text-fg-default"
          >
            <Icon icon={X} size="xs" />
          </button>
        )}
      </div>
      {empty && (
        <span className="text-caption text-fg-subtle">
          Install a small (≤4B) model from My Models to enable speculative decoding.
        </span>
      )}
      {error && (
        // CONFIG-007 follow-up: the hook's `error` was silently dropped.
        // Surface it so a failed model-repository read is visible.
        <span className="text-caption text-danger">
          Couldn’t load installed models: {error}
        </span>
      )}
    </div>
  );
}

function DraftTokensRow({ value, onChange }: { readonly value: number; readonly onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-micro text-fg-muted">Draft Tokens to Generate</span>
        <ValueBox
          value={value}
          min={1}
          max={16}
          step={1}
          onChange={onChange}
          ariaLabel="Draft tokens to generate"
        />
      </div>
      <Slider value={value} min={1} max={16} step={1} onValueChange={onChange} aria-label="Draft tokens slider" />
    </div>
  );
}
