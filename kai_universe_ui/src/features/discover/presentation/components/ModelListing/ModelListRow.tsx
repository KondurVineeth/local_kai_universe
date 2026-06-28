import { Brain, Eye, SealCheck, Star, Wrench } from '@phosphor-icons/react';

import { Icon, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { capabilityChipTone } from '@shared/lib/modelChipTones';
import { useAppSelector } from '@shared/store/hooks';

import { selectDiscoverDownloadFor } from '../../store/selectors';

import type { Model } from '@shared/domain/model/entities/Model';

interface ModelListRowProps {
  readonly model: Model;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

// Single-row model card. Compact layout: author-initial icon + name +
// description + capability dots + staff-pick chip + relative time. When a
// download is in flight, a thin accent bar at the bottom of the row tracks
// progress so the list reflects what's happening without needing the
// detail pane open.
export function ModelListRow({ model, selected, onSelect }: ModelListRowProps) {
  const download = useAppSelector(selectDiscoverDownloadFor(model.id));
  const pct =
    download && download.totalBytes > 0
      ? Math.round((download.receivedBytes / download.totalBytes) * 100)
      : 0;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'group relative flex w-full items-start gap-2 border-b border-border-default px-3 py-2.5 text-left transition-colors',
          selected ? 'bg-bg-raised' : 'hover:bg-bg-raised/40',
        )}
      >
        <AuthorMark author={model.author} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-medium text-fg-default">{model.displayName}</span>
            {model.staffPick && (
              <Tooltip content="Staff Pick" side="top">
                <span className="inline-flex items-center text-fg-accent">
                  <Icon icon={SealCheck} size="xs" weight="fill" />
                </span>
              </Tooltip>
            )}
          </div>
          <p className="line-clamp-2 text-[10px] leading-relaxed text-fg-subtle">
            {model.description}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-fg-subtle">
            <CapabilityDots model={model} />
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-0.5">
              <Icon icon={Star} size="xs" />
              {formatCount(model.downloadCount)}
            </span>
            <span aria-hidden>·</span>
            <span>{relativeTime(model.publishedAt)}</span>
          </div>
        </div>
        {download && download.status === 'downloading' && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-accent transition-[width] duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        )}
      </button>
    </li>
  );
}

function AuthorMark({ author }: { readonly author: string }) {
  const initial = author.charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-bg-active text-[10px] font-semibold uppercase text-fg-default"
    >
      {initial}
    </span>
  );
}

function CapabilityDots({ model }: { readonly model: Model }) {
  // Same per-capability palette as the detail pane's capability chips, so a
  // user who learns "amber = tools" in the list carries that scanning model
  // over to the right pane.
  const caps: Array<{ icon: typeof Brain; label: string; tokenLabel: string; on: boolean }> = [
    { icon: Brain, label: 'Reasoning', tokenLabel: 'Reasoning', on: model.capabilities.reasoning },
    { icon: Wrench, label: 'Tool use', tokenLabel: 'Tool Use', on: model.capabilities.tools },
    { icon: Eye, label: 'Vision', tokenLabel: 'Vision', on: model.capabilities.vision },
  ];
  const visible = caps.filter((c) => c.on);
  if (visible.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      {visible.map((c) => {
        const tone = capabilityChipTone(c.tokenLabel);
        return (
          <Tooltip key={c.label} content={c.label} side="top">
            <span
              className={cn(
                // 12px icon + 2px padding on each side = 16px (h-4 w-4).
                // Gives the icon breathing room inside the coloured dot so
                // the glyph doesn't visually touch the edge.
                'inline-flex h-4 w-4 items-center justify-center rounded-full p-0.5',
                tone.bg,
                tone.text,
              )}
            >
              <Icon icon={c.icon} size="xs" />
            </span>
          </Tooltip>
        );
      })}
    </span>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}
