import { ArrowCounterClockwise, CaretDown, Check, Gear, Sliders } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { Button, Icon, Slider, Switch } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectLoadConfig } from '../../store/selectors';
import { loadConfigChanged, loadConfigReset, type LoadConfig } from '../../store/slice';

import type { Model } from '@shared/domain/model/entities/Model';

// The persisted `LoadConfig` covers the load-time knobs that the audit
// requires to survive tab switches / reload. The remaining switches in the
// Advanced section (RoPE, mmap, flash-attn, etc.) stay ephemeral — they're
// cosmetic in the mock and not called out by the audit.
export function LoadTab({ model }: { readonly model: Model }) {
  const cap = model.contextLengthTokens;
  const dispatch = useAppDispatch();
  const persisted = useAppSelector(selectLoadConfig);

  const [ctxOpen, setCtxOpen] = useState(true);
  const [advOpen, setAdvOpen] = useState(true);
  // Local draft mirrors the persisted config; Apply commits, Reset reverts
  // to the slice's defaults. Re-sync the draft whenever the persisted
  // config changes underneath us (e.g. a Reset dispatched elsewhere).
  const [draft, setDraft] = useState<LoadConfig>(persisted);
  useEffect(() => {
    setDraft(persisted);
  }, [persisted]);

  const dirty = (Object.keys(draft) as (keyof LoadConfig)[]).some(
    (k) => draft[k] !== persisted[k],
  );
  const patch = (p: Partial<LoadConfig>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <div className="flex flex-col gap-2 p-3">
      <CollapsibleSection
        icon={<Icon icon={Gear} size="xs" className="text-fg-muted" />}
        title="Context and Offload"
        open={ctxOpen}
        onToggle={() => setCtxOpen((v) => !v)}
      >
        <ContextOffloadContent
          ctx={Math.min(draft.contextLength, cap)}
          cap={cap}
          gpuOffload={draft.gpuOffloadPct}
          onCtxChange={(v) => patch({ contextLength: v })}
          onGpuChange={(v) => patch({ gpuOffloadPct: v })}
        />
      </CollapsibleSection>

      <CollapsibleSection
        icon={<Icon icon={Sliders} size="xs" className="text-fg-muted" />}
        title="Advanced"
        open={advOpen}
        onToggle={() => setAdvOpen((v) => !v)}
      >
        <AdvancedContent draft={draft} onPatch={patch} />
      </CollapsibleSection>

      <ApplyResetBar
        dirty={dirty}
        onApply={() => dispatch(loadConfigChanged(draft))}
        onReset={() => dispatch(loadConfigReset())}
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

function ContextOffloadContent({
  ctx, cap, gpuOffload, onCtxChange, onGpuChange,
}: {
  readonly ctx: number;
  readonly cap: number;
  readonly gpuOffload: number;
  readonly onCtxChange: (v: number) => void;
  readonly onGpuChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <NumRow label="Context Length" value={ctx} onChange={onCtxChange} />
        <Slider value={ctx} min={512} max={cap} step={512} onValueChange={onCtxChange} aria-label="Context length" />
        <span className="text-[10px] text-fg-subtle">
          Model supports up to{' '}
          <span className="rounded-sm bg-bg-raised px-1 font-mono text-fg-default">
            {cap.toLocaleString()}
          </span>{' '}
          tokens
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <NumRow label="GPU Offload" value={gpuOffload} onChange={onGpuChange} />
        <Slider value={gpuOffload} min={0} max={100} step={1} onValueChange={onGpuChange} aria-label="GPU offload" />
      </div>
    </div>
  );
}

function AdvancedContent({
  draft,
  onPatch,
}: {
  readonly draft: LoadConfig;
  readonly onPatch: (p: Partial<LoadConfig>) => void;
}) {
  const [unifiedKv, setUnifiedKv] = useState(true);
  const [ropeBase, setRopeBase] = useState(false);
  const [ropeScale, setRopeScale] = useState(false);
  const [offloadKv, setOffloadKv] = useState(true);
  const [keepInMem, setKeepInMem] = useState(true);
  const [tryMmap, setTryMmap] = useState(true);
  const [seedEnabled, setSeedEnabled] = useState(false);
  const [flashAttn, setFlashAttn] = useState(true);
  const [kCacheQuant, setKCacheQuant] = useState(false);
  const [vCacheQuant, setVCacheQuant] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <NumRow
          label="CPU Thread Pool Size"
          value={draft.cpuThreads}
          onChange={(v) => onPatch({ cpuThreads: v })}
        />
        <Slider
          value={draft.cpuThreads}
          min={1}
          max={32}
          step={1}
          onValueChange={(v) => onPatch({ cpuThreads: v })}
          aria-label="CPU thread pool size"
        />
      </div>
      <AdvRow label="Evaluation Batch Size">
        <NumInput
          value={draft.evalBatchSize}
          onChange={(v) => onPatch({ evalBatchSize: v })}
        />
      </AdvRow>
      <AdvRow label="Max Concurrent Predictions" experimental>
        <NumInput
          value={draft.maxConcurrentPredictions}
          onChange={(v) => onPatch({ maxConcurrentPredictions: v })}
        />
      </AdvRow>
      <AdvRow label="Unified KV Cache" experimental>
        <Switch checked={unifiedKv} onCheckedChange={setUnifiedKv} aria-label="Unified KV cache" />
      </AdvRow>
      <CheckRow label="RoPE Frequency Base" checked={ropeBase} onChange={setRopeBase} autoText="Auto" />
      <CheckRow label="RoPE Frequency Scale" checked={ropeScale} onChange={setRopeScale} autoText="Auto" />
      <AdvRow label="Offload KV Cache to GPU Memory">
        <Switch checked={offloadKv} onCheckedChange={setOffloadKv} aria-label="Offload KV cache" />
      </AdvRow>
      <AdvRow label="Keep Model in Memory">
        <Switch checked={keepInMem} onCheckedChange={setKeepInMem} aria-label="Keep model in memory" />
      </AdvRow>
      <AdvRow label="Try mmap()">
        <Switch checked={tryMmap} onCheckedChange={setTryMmap} aria-label="Try mmap" />
      </AdvRow>
      <CheckRow label="Seed" checked={seedEnabled} onChange={setSeedEnabled} autoText="Random Seed" />
      <AdvRow label="Flash Attention">
        <Switch checked={flashAttn} onCheckedChange={setFlashAttn} aria-label="Flash attention" />
      </AdvRow>
      <CheckRow label="K Cache Quantization Type" checked={kCacheQuant} onChange={setKCacheQuant} experimental />
      <CheckRow label="V Cache Quantization Type" checked={vCacheQuant} onChange={setVCacheQuant} experimental />
    </div>
  );
}

function CollapsibleSection({
  icon, title, open, onToggle, children,
}: {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <section className={cn('overflow-hidden rounded-md bg-bg-raised', open ? 'border border-border-default' : 'border border-transparent')}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-bg-active/40"
      >
        {icon}
        <span className="flex-1 text-xs font-medium text-fg-default">{title}</span>
        <Icon icon={CaretDown} size="xs" className={cn('text-fg-subtle transition-transform', open ? 'rotate-0' : '-rotate-90')} />
      </button>
      {open && <div className="px-3 pb-4 pt-1">{children}</div>}
    </section>
  );
}

function NumRow({ label, value, onChange }: { readonly label: string; readonly value: number; readonly onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-fg-muted">{label}</span>
      <NumInput value={value} onChange={onChange} />
    </div>
  );
}

function NumInput({ value, onChange }: { readonly value: number; readonly onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const next = Number(e.target.value);
        if (Number.isFinite(next)) onChange(next);
      }}
      className="w-20 rounded-md border border-border-strong bg-bg-base px-2 py-1 text-right font-mono text-xs text-fg-default [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      aria-label={String(value)}
    />
  );
}

function AdvRow({ label, experimental, children }: { readonly label: string; readonly experimental?: boolean; readonly children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="flex items-center gap-1.5 text-fg-muted">
        {label}
        {experimental && <span className="rounded-sm bg-bg-base px-1 py-0.5 text-[9px] uppercase tracking-wider text-fg-subtle">Experimental</span>}
      </span>
      {children}
    </div>
  );
}

function CheckRow({ label, checked, onChange, autoText, experimental }: { readonly label: string; readonly checked: boolean; readonly onChange: (v: boolean) => void; readonly autoText?: string; readonly experimental?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="flex items-center gap-2 text-fg-muted">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5 rounded accent-accent" aria-label={label} />
        {label}
        {experimental && <span className="rounded-sm bg-bg-base px-1 py-0.5 text-[9px] uppercase tracking-wider text-fg-subtle">Experimental</span>}
      </span>
      {!checked && autoText && <span className="text-fg-subtle">{autoText}</span>}
    </div>
  );
}
