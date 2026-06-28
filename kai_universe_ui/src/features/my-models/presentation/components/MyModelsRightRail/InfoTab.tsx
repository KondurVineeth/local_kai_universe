import { Brain, Eye, Info, Wrench } from '@phosphor-icons/react';

import { Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { formatBytes } from '@shared/lib/format';
import {
  archChipTone,
  capabilityChipTone,
  domainChipTone,
  formatChipTone,
} from '@shared/lib/modelChipTones';
import { useAppSelector } from '@shared/store/hooks';

import { selectInstalledQuantFor } from '../../store/selectors';

import type { Model } from '@shared/domain/model/entities/Model';
import type { Bytes } from '@shared/domain/primitives/Bytes';

export function InfoTab({ model }: { readonly model: Model }) {
  const installedQuant = useAppSelector(selectInstalledQuantFor(model.id));
  return (
    <div className="flex flex-col gap-4 p-3">
      {model.description && <DescriptionSection description={model.description} />}
      <MetadataSection model={model} installedQuant={installedQuant} />
      <SourceFileSection model={model} installedQuant={installedQuant} />
    </div>
  );
}

function DescriptionSection({ description }: { readonly description: string }) {
  return (
    <section className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-raised/30 p-3">
      <header className="flex items-center gap-2">
        <Icon icon={Info} size="xs" className="text-fg-muted" />
        <h2 className="text-xs font-medium text-fg-default">Description</h2>
      </header>
      <p className="text-[11px] leading-relaxed text-fg-muted">{description}</p>
    </section>
  );
}

function MetadataSection({
  model,
  installedQuant,
}: {
  readonly model: Model;
  readonly installedQuant: string | undefined;
}) {
  const installedVariant =
    model.variants.find((v) => v.quantization === installedQuant) ?? model.variants[0];
  const sizeBytes = installedVariant?.sizeBytes;
  const domain = model.capabilities.embeddings ? 'embedding' : 'llm';
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border-default bg-bg-raised/30 p-3">
      <header className="flex items-center gap-2">
        <Icon icon={Info} size="xs" className="text-fg-muted" />
        <h2 className="text-xs font-medium text-fg-default">Model Information</h2>
      </header>
      <InfoRow label="Model">
        <span className="rounded-sm bg-bg-raised px-1.5 py-0.5 font-mono text-[10px] text-fg-default">
          {model.author}/{model.id}
        </span>
      </InfoRow>
      <InfoRow label="Format">
        {installedVariant ? (
          <Chip tone={formatChipTone(installedVariant.format)}>{installedVariant.format.toUpperCase()}</Chip>
        ) : (
          <span className="text-[10px] text-fg-subtle">—</span>
        )}
      </InfoRow>
      <InfoRow label="Quantization">
        <Chip>{installedQuant ?? installedVariant?.quantization ?? '—'}</Chip>
      </InfoRow>
      <InfoRow label="Arch">
        <Chip tone={archChipTone(model.arch)}>{model.arch}</Chip>
      </InfoRow>
      <InfoRow label="Capabilities">
        <Capabilities model={model} />
      </InfoRow>
      <InfoRow label="Domain">
        <Chip tone={domainChipTone(domain)}>{domain}</Chip>
      </InfoRow>
      <InfoRow label="Size on disk">
        <span className="font-mono text-[10px] text-fg-default">
          {sizeBytes ? formatBytes(sizeBytes as Bytes) : '—'}
        </span>
      </InfoRow>
    </section>
  );
}

function InfoRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2 text-[11px]">
      <span className="text-fg-subtle">{label}</span>
      <span className="inline-flex flex-wrap items-center gap-1">{children}</span>
    </div>
  );
}

function Chip({
  children,
  tone,
}: {
  readonly children: React.ReactNode;
  readonly tone?: { readonly bg: string; readonly text: string };
}) {
  const t = tone ?? { bg: 'bg-bg-raised', text: 'text-fg-default' };
  return (
    <span className={cn('rounded-sm px-1.5 py-0.5 font-mono text-[10px]', t.bg, t.text)}>
      {children}
    </span>
  );
}

function Capabilities({ model }: { readonly model: Model }) {
  const caps: Array<{ icon: typeof Wrench; label: string; on: boolean }> = [
    { icon: Wrench, label: 'Tool use', on: model.capabilities.tools },
    { icon: Brain, label: 'Reasoning', on: model.capabilities.reasoning },
    { icon: Eye, label: 'Vision', on: model.capabilities.vision },
  ];
  const on = caps.filter((c) => c.on);
  if (on.length === 0) {
    return <span className="text-[10px] text-fg-subtle">—</span>;
  }
  return (
    <>
      {on.map((c) => {
        const tone = capabilityChipTone(c.label === 'Tool use' ? 'Tool Use' : c.label);
        return (
          <span
            key={c.label}
            className={cn(
              'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px]',
              tone.bg,
              tone.text,
            )}
          >
            <Icon icon={c.icon} size="xs" />
            <span>{c.label}</span>
          </span>
        );
      })}
    </>
  );
}

function SourceFileSection({
  model,
  installedQuant,
}: {
  readonly model: Model;
  readonly installedQuant: string | undefined;
}) {
  // Read-only display of which variant the install ledger believes is on
  // disk. The override SWITCH lives in the Load tab — duplicating it here
  // (and the previous always-false hardcoded copy) violated UX rule 1
  // ("no dead buttons"). The display row stays so users can confirm which
  // variant they installed without leaving the Info tab.
  const installedVariant =
    model.variants.find((v) => v.quantization === installedQuant) ?? model.variants[0];
  if (!installedVariant) return null;
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border-default bg-bg-raised/30 p-3">
      <header className="flex items-center gap-2">
        <Icon icon={Info} size="xs" className="text-fg-muted" />
        <h2 className="text-xs font-medium text-fg-default">Source File</h2>
      </header>
      <div className="flex items-center gap-2 rounded-md border border-border-default bg-bg-raised px-2 py-1.5">
        <Chip tone={formatChipTone(installedVariant.format)}>
          {installedVariant.format.toUpperCase()}
        </Chip>
        <span className="flex-1 truncate font-mono text-[11px] text-fg-default">
          {model.displayName}
        </span>
        <Chip>{installedQuant ?? installedVariant.quantization}</Chip>
      </div>
      <span className="text-[10px] text-fg-subtle">
        To load this model from a different file, enable Source File Override in the Load tab.
      </span>
    </section>
  );
}
