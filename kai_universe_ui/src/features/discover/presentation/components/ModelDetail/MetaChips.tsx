import { cn } from '@shared/lib/cn';
import {
  archChipTone,
  capabilityChipTone,
  domainChipTone,
  formatChipTone,
  paramsChipTone,
} from '@shared/lib/modelChipTones';

import type { Model } from '@shared/domain/model/entities/Model';

// Inline meta row. Each category uses its own tinted chip so the user can
// scan info type at a glance:
//   Params  [8B]            ← neutral (size is the signal)
//   Arch    [llama]         ← arch family palette
//   Domain  [llm]           ← llm / embedding tint
//   Format  [GGUF] [MLX]    ← per-format palette
export function MetaChips({ model }: { readonly model: Model }) {
  const formats = [...new Set(model.variants.map((v) => v.format))];
  const domain = model.capabilities.embeddings ? 'embedding' : 'llm';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px]">
        <MetaPair label="Params" value={formatParams(model.parameterCountB)} tone={paramsChipTone()} />
        <MetaPair label="Arch" value={model.arch} tone={archChipTone(model.arch)} />
        <MetaPair label="Domain" value={domain} tone={domainChipTone(domain)} />
        <MetaPairMulti
          label="Format"
          values={formats.map((f) => ({ label: f.toUpperCase(), tone: formatChipTone(f) }))}
        />
      </div>
      <Capabilities model={model} />
    </div>
  );
}

interface ChipTone {
  readonly bg: string;
  readonly text: string;
}

function MetaPair({
  label,
  value,
  tone,
}: {
  readonly label: string;
  readonly value: string;
  readonly tone: ChipTone;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-fg-subtle">{label}</span>
      <span className={cn('rounded-sm px-1.5 py-0.5 font-mono text-[10px]', tone.bg, tone.text)}>
        {value}
      </span>
    </span>
  );
}

function MetaPairMulti({
  label,
  values,
}: {
  readonly label: string;
  readonly values: ReadonlyArray<{ label: string; tone: ChipTone }>;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-fg-subtle">{label}</span>
      <span className="inline-flex items-center gap-1">
        {values.map((v) => (
          <span
            key={v.label}
            className={cn(
              'rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold',
              v.tone.bg,
              v.tone.text,
            )}
          >
            {v.label}
          </span>
        ))}
      </span>
    </span>
  );
}

function Capabilities({ model }: { readonly model: Model }) {
  const labels: string[] = [];
  if (model.capabilities.tools) labels.push('Tool Use');
  if (model.capabilities.reasoning) labels.push('Reasoning');
  if (model.capabilities.vision) labels.push('Vision');
  if (model.capabilities.embeddings) labels.push('Embeddings');
  if (labels.length === 0) return null;
  return (
    <div className="flex items-center gap-3 text-[11px]">
      <span className="text-fg-subtle">Capabilities</span>
      <span className="inline-flex flex-wrap items-center gap-1">
        {labels.map((l) => {
          const tone = capabilityChipTone(l);
          return (
            <span
              key={l}
              className={cn(
                'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium',
                tone.bg,
                tone.text,
              )}
            >
              {l}
            </span>
          );
        })}
      </span>
    </div>
  );
}

function formatParams(b: number): string {
  if (b >= 1) return `${b.toFixed(b % 1 === 0 ? 0 : 1)}B`;
  return `${Math.round(b * 1000)}M`;
}
