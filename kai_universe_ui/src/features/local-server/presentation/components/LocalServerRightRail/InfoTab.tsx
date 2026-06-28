import { Brain, Cpu, Eye, Info, Wrench } from '@phosphor-icons/react';

import { selectServerPort } from '@features/settings';
import { Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import {
  archChipTone,
  capabilityChipTone,
  domainChipTone,
  formatChipTone,
} from '@shared/lib/modelChipTones';
import { useAppSelector } from '@shared/store/hooks';

import { selectServerStatus } from '../../store/selectors';

import type { Model } from '@shared/domain/model/entities/Model';

export function InfoTab({ model }: { readonly model: Model }) {
  // Key the API-usage copy off the LIVE server status, not the persisted
  // `serverEnabled` intent — otherwise the panel claims the server is
  // reachable while it's still in `starting` / already `stopping`.
  const serverRunning = useAppSelector(selectServerStatus) === 'running';
  const port = useAppSelector(selectServerPort);
  const domain = model.capabilities.embeddings ? 'embedding' : 'llm';
  const variant = model.variants[0];

  return (
    <div className="flex flex-col gap-4 p-3">
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
          <Chip tone={formatChipTone(variant?.format ?? 'gguf')}>
            {(variant?.format ?? 'GGUF').toUpperCase()}
          </Chip>
        </InfoRow>
        <InfoRow label="Quantization">
          <Chip>{variant?.quantization ?? '—'}</Chip>
        </InfoRow>
        <InfoRow label="Arch">
          <Chip tone={archChipTone(model.arch)}>{model.arch}</Chip>
        </InfoRow>
        <InfoRow label="Capabilities">
          <CapabilityChips model={model} />
        </InfoRow>
        <InfoRow label="Domain">
          <Chip tone={domainChipTone(domain)}>{domain}</Chip>
        </InfoRow>
        <InfoRow label="Parameters">
          <span className="font-mono text-[10px] text-fg-default">{model.parameterCountB}B</span>
        </InfoRow>
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-border-default bg-bg-raised/30 p-3">
        <header className="flex items-center gap-2">
          <Icon icon={Cpu} size="xs" className="text-fg-muted" />
          <h2 className="text-xs font-medium text-fg-default">API Usage</h2>
        </header>
        <InfoRow label="Model Identifier">
          <span className="rounded-sm bg-bg-raised px-1.5 py-0.5 font-mono text-[10px] text-fg-default">
            {model.id}
          </span>
        </InfoRow>
        {serverRunning ? (
          <p className="text-[10px] text-fg-subtle">
            Send requests to{' '}
            <span className="font-mono text-blue-400">http://localhost:{port}/v1/chat/completions</span>
          </p>
        ) : (
          <p className="text-[10px] text-fg-subtle">
            The local server is not running. Start the server to use this model via the API.
          </p>
        )}
      </section>
    </div>
  );
}

function InfoRow({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-center gap-2 text-[11px]">
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

function CapabilityChips({ model }: { readonly model: Model }) {
  const caps = [
    { icon: Wrench, label: 'Tool Use', on: model.capabilities.tools },
    { icon: Brain, label: 'Reasoning', on: model.capabilities.reasoning },
    { icon: Eye, label: 'Vision', on: model.capabilities.vision },
  ].filter((c) => c.on);

  if (caps.length === 0) {
    return <span className="text-[10px] text-fg-subtle">—</span>;
  }

  return (
    <>
      {caps.map((c) => {
        const tone = capabilityChipTone(c.label);
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
            {c.label}
          </span>
        );
      })}
    </>
  );
}
