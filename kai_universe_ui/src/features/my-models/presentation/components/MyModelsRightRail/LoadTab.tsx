import { ArrowCounterClockwise, Gear, Sliders } from '@phosphor-icons/react';

import { Button, Icon, Slider, Switch } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectMyModelsLoadConfig } from '../../store/selectors';
import { loadConfigReset, loadConfigSet, type LoadOverride } from '../../store/slice';

import type { Model } from '@shared/domain/model/entities/Model';

// Coerce raw input strings to a safe number-or-null. `Number('')` is 0 and
// `Number('foo')` is NaN — both poison the slice + Radix sliders. Treat
// empty input as the absence of a value (callers fall back to defaults).
function safeNumber(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

type Patch = Partial<LoadOverride>;

export function LoadTab({ model }: { readonly model: Model }) {
  const dispatch = useAppDispatch();
  const cfg = useAppSelector(selectMyModelsLoadConfig(model.id));
  const set = (patch: Patch) => dispatch(loadConfigSet({ modelId: model.id, patch }));
  // An empty override object means every field still reads its default —
  // nothing to reset, so the affordance is disabled.
  const hasOverride = Object.keys(cfg).length > 0;
  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-fg-subtle">
          Load Configuration
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={!hasOverride}
          leadingIcon={<Icon icon={ArrowCounterClockwise} size="xs" />}
          onClick={() => dispatch(loadConfigReset(model.id))}
        >
          Reset to defaults
        </Button>
      </div>
      <ContextAndOffload model={model} cfg={cfg} set={set} />
      <Advanced cfg={cfg} set={set} />
    </div>
  );
}

function ContextAndOffload({
  model,
  cfg,
  set,
}: {
  readonly model: Model;
  readonly cfg: LoadOverride;
  readonly set: (patch: Patch) => void;
}) {
  // For embedding models the catalogue context cap can be < 512. Floor at
  // 512 only if the cap allows it; otherwise the slider min/max invert and
  // Radix throws.
  const rawCap = model.contextLengthTokens;
  const cap = Math.max(512, rawCap);
  const ctx = cfg.contextLength ?? Math.min(4096, cap);
  const gpuOffloadPct = cfg.gpuOffloadPct ?? 100;
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border-default bg-bg-raised/30 p-3">
      <header className="flex items-center gap-2">
        <Icon icon={Gear} size="xs" className="text-fg-muted" />
        <h2 className="text-xs font-medium text-fg-default">Context and Offload</h2>
      </header>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-fg-muted">Context Length</span>
          <input
            type="number"
            value={ctx}
            min={512}
            max={cap}
            step={512}
            onChange={(e) => {
              const v = safeNumber(e.target.value);
              if (v === null) return;
              set({ contextLength: clamp(v, 512, cap) });
            }}
            className="w-24 rounded-sm border border-border-strong bg-bg-base px-2 py-1 text-right font-mono text-[10px] text-fg-default [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Context length"
          />
        </div>
        <Slider
          value={ctx}
          min={512}
          max={cap}
          step={512}
          onValueChange={(v) => set({ contextLength: v })}
          aria-label="Context length slider"
        />
        <span className="text-[10px] text-fg-subtle">
          Model supports up to{' '}
          <span className="rounded-sm bg-bg-raised px-1 font-mono text-fg-default">
            {rawCap.toLocaleString()}
          </span>{' '}
          tokens
        </span>
      </div>
      <div className="flex flex-col gap-2 border-t border-border-default pt-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-fg-muted">GPU Offload</span>
          <span className="font-mono text-[10px] text-fg-default">{gpuOffloadPct}%</span>
        </div>
        <Slider
          value={gpuOffloadPct}
          min={0}
          max={100}
          step={5}
          onValueChange={(v) => set({ gpuOffloadPct: v })}
          aria-label="GPU offload percentage"
        />
        <span className="text-[10px] text-fg-subtle">
          Higher = more layers on GPU. 0% runs entirely on CPU.
        </span>
      </div>
    </section>
  );
}

function Advanced({
  cfg,
  set,
}: {
  readonly cfg: LoadOverride;
  readonly set: (patch: Patch) => void;
}) {
  const maxConcurrent = cfg.maxConcurrent ?? 4;
  const kvCacheOn = cfg.kvCacheQuantization ?? false;
  const sourceOverrideOn = cfg.sourceFileOverrideEnabled ?? false;
  const sourceOverridePath = cfg.sourceFileOverridePath ?? '';
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border-default bg-bg-raised/30 p-3">
      <header className="flex items-center gap-2">
        <Icon icon={Sliders} size="xs" className="text-fg-muted" />
        <h2 className="text-xs font-medium text-fg-default">Advanced</h2>
      </header>
      <RowField label="Max Concurrent Predictions" experimental>
        <input
          type="number"
          value={maxConcurrent}
          min={1}
          max={32}
          onChange={(e) => {
            const v = safeNumber(e.target.value);
            if (v === null) return;
            set({ maxConcurrent: clamp(Math.round(v), 1, 32) });
          }}
          className="w-16 rounded-sm border border-border-strong bg-bg-base px-2 py-1 text-right font-mono text-[10px] text-fg-default [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Max concurrent predictions"
        />
      </RowField>
      <RowField label="Seed">
        <input
          type="number"
          placeholder="Random seed"
          value={cfg.seed ?? ''}
          onChange={(e) => {
            const v = safeNumber(e.target.value);
            // Integers only; clamp to int32 to mirror llama.cpp.
            set({
              seed:
                v === null
                  ? null
                  : Math.trunc(clamp(v, -2_147_483_648, 2_147_483_647)),
            });
          }}
          className="w-32 rounded-sm border border-border-strong bg-bg-base px-2 py-1 text-right font-mono text-[10px] text-fg-default [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Seed"
        />
      </RowField>
      <RowField label="KV Cache Quantization" experimental>
        <Switch
          checked={kvCacheOn}
          onCheckedChange={(v) => set({ kvCacheQuantization: v })}
          aria-label="KV cache quantization"
        />
      </RowField>
      <RowField label="Source File Override">
        <Switch
          checked={sourceOverrideOn}
          onCheckedChange={(v) => set({ sourceFileOverrideEnabled: v })}
          aria-label="Source file override"
        />
      </RowField>
      {sourceOverrideOn && (
        <SourcePathInput value={sourceOverridePath} onChange={(v) => set({ sourceFileOverridePath: v })} />
      )}
    </section>
  );
}

function SourcePathInput({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 pt-1">
      <span className="text-[10px] text-fg-subtle">
        Load this model from an alternate file path. Validation happens at load time.
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/path/to/model.gguf"
        className="w-full rounded-sm border border-border-strong bg-bg-base px-2 py-1 font-mono text-[10px] text-fg-default"
        aria-label="Source file override path"
      />
    </div>
  );
}

function RowField({
  label,
  experimental,
  children,
}: {
  readonly label: string;
  readonly experimental?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="inline-flex items-center gap-2">
        <span className="text-fg-muted">{label}</span>
        {experimental && (
          <span className="rounded-sm bg-bg-raised px-1 py-0.5 text-[9px] uppercase tracking-wider text-fg-subtle">
            Experimental
          </span>
        )}
      </span>
      {children}
    </div>
  );
}
