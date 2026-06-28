import { Brain, DotsThree, Eye, Gear, PushPin, Wrench } from '@phosphor-icons/react';

import { Button, Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { formatBytes } from '@shared/lib/format';
import {
  archChipTone,
  capabilityChipTone,
  formatChipTone,
} from '@shared/lib/modelChipTones';
import { useAppSelector } from '@shared/store/hooks';

import { selectInstalledAtFor, selectInstalledQuantFor } from '../../store/selectors';

import { RowActionsMenu } from './RowActionsMenu';

import type { Model } from '@shared/domain/model/entities/Model';
import type { Bytes } from '@shared/domain/primitives/Bytes';


interface ModelRowProps {
  readonly model: Model;
  readonly selected: boolean;
  readonly pinned: boolean;
  readonly onSelect: () => void;
}

export function ModelRow({ model, selected, pinned, onSelect }: ModelRowProps) {
  const installedQuant = useAppSelector(selectInstalledQuantFor(model.id));
  const installedAt = useAppSelector(selectInstalledAtFor(model.id));
  const installedVariant =
    model.variants.find((v) => v.quantization === installedQuant) ?? model.variants[0];
  const sizeBytes = installedVariant?.sizeBytes;
  const arch = archChipTone(model.arch);
  const format = formatChipTone(installedVariant?.format ?? 'gguf');
  // Row uses a div with role="button" rather than a real <button> so we can
  // legally nest the kebab/gear action buttons inside it. Native <button>
  // inside <button> is invalid HTML; the browser reparents the inner one as
  // a sibling, which makes `e.stopPropagation()` on the kebab leak through
  // and fires `onSelect` (opens the right rail) whenever the dropdown
  // trigger or any of its menu items is clicked.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        aria-pressed={selected}
        className={cn(
          'group grid w-full cursor-pointer items-center border-b border-border-default px-4 py-3 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          selected ? 'bg-bg-raised' : 'hover:bg-bg-raised/40',
        )}
        style={{ gridTemplateColumns: 'minmax(60px,1fr) minmax(80px,1fr) minmax(60px,80px) minmax(140px,1.5fr) minmax(220px,2fr) minmax(60px,80px) minmax(60px,80px) minmax(100px,1fr) 80px' }}
      >
        <span className="inline-flex items-center gap-1 text-fg-default">
          {pinned && <Icon icon={PushPin} size="xs" weight="fill" className="text-fg-accent" />}
          <span>Local</span>
        </span>
        <span>
          <Chip tone={arch}>{model.arch}</Chip>
        </span>
        <span>
          <Chip>{formatParams(model.parameterCountB)}</Chip>
        </span>
        <span className="truncate text-fg-default">{model.author}</span>
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-fg-default">
          <span className="truncate font-mono text-[11px]">{model.author}/{model.id}</span>
          <CapabilityDots model={model} />
        </span>
        <span>
          <Chip tone={format}>{installedQuant ?? installedVariant?.quantization ?? ''}</Chip>
        </span>
        <span className="font-mono text-fg-default">
          {sizeBytes ? formatBytes(sizeBytes as Bytes) : '—'}
        </span>
        <span className="text-fg-subtle">{relativeTime(installedAt ?? model.publishedAt)}</span>
        <span className="flex items-center justify-end gap-0.5">
          <RowActionsMenu model={model} pinned={pinned}>
            <Button variant="ghost" size="sm" iconOnly aria-label="More actions" onClick={(e) => e.stopPropagation()}>
              <Icon icon={DotsThree} size="sm" weight="bold" />
            </Button>
          </RowActionsMenu>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Open model panel"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <Icon icon={Gear} size="sm" />
          </Button>
        </span>
      </div>
    </li>
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
    <span className={cn('inline-flex rounded-sm px-1.5 py-0.5 font-mono text-[10px]', t.bg, t.text)}>
      {children}
    </span>
  );
}

function CapabilityDots({ model }: { readonly model: Model }) {
  const caps: Array<{ label: string; icon: typeof Brain }> = [];
  if (model.capabilities.tools) caps.push({ label: 'Tool use', icon: Wrench });
  if (model.capabilities.reasoning) caps.push({ label: 'Reasoning', icon: Brain });
  if (model.capabilities.vision) caps.push({ label: 'Vision', icon: Eye });
  if (caps.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {caps.map((c) => (
        <span
          key={c.label}
          aria-label={c.label}
          className={cn(
            'inline-flex h-4 w-4 items-center justify-center rounded-full p-0.5',
            capabilityChipTone(c.label === 'Tool use' ? 'Tool Use' : c.label).bg,
            capabilityChipTone(c.label === 'Tool use' ? 'Tool Use' : c.label).text,
          )}
        >
          <Icon icon={c.icon} size="xs" />
        </span>
      ))}
    </span>
  );
}

function formatParams(b: number): string {
  if (b >= 1) return `${b.toFixed(b % 1 === 0 ? 0 : 1)}B`;
  return `${Math.round(b * 1000)}M`;
}

function relativeTime(iso?: string): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}
