import { DownloadSimple, Tray, X } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';


import {
  Badge,
  Button,
  EmptyState,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ProgressBar,
  Tooltip,
} from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { formatBytes, formatDownloadStatus } from '@shared/lib/format';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { useDownloadsList } from '../../hooks/useDownloadsList';
import { selectDownloadsPanelOpen } from '../../store/selectors';
import { downloadsPanelOpenSet } from '../../store/slice';

import type { Download as DownloadEntity } from '@shared/domain/download/entities/Download';

// LMS-SHELL-005 — Downloads Indicator.
//
// Renders the badge in the header and opens a popover with active downloads.
// Concrete observation of progress flows through the FixtureDownloadRepository
// + DownloadProgressSimulator pair via the useDownloadsList hook.
// Failed downloads have no Retry (the repository can't re-simulate one) but
// they shouldn't be permanent noise either. Dismissal is purely a
// presentation concern — the repository never models a "remove" — so we keep
// a local set of dismissed ids and filter them out of the rendered list. The
// set survives polls but resets on app relaunch, matching the previous
// "failed rows stay until you re-launch" contract minus the noise.
function useDismissibleDownloads(downloads: readonly DownloadEntity[]) {
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  }, []);
  const visibleDownloads = useMemo(
    () => downloads.filter((d) => !dismissedIds.has(d.id)),
    [downloads, dismissedIds],
  );
  return { visibleDownloads, dismiss };
}

export function DownloadsIndicator() {
  const open = useAppSelector(selectDownloadsPanelOpen);
  const dispatch = useAppDispatch();
  const { downloads, activeCount, isLoading } = useDownloadsList();
  const { visibleDownloads, dismiss } = useDismissibleDownloads(downloads);

  const tooltipLabel = activeCount > 0 ? `${activeCount} active download${activeCount === 1 ? '' : 's'}` : 'Downloads';

  // UX-SHELL-009 — one-shot pop animation when activeCount goes 0 → ≥1.
  // We re-key the badge by an incrementing counter on each transition so
  // the keyframe re-runs cleanly (CSS animations don't restart on prop
  // change unless the element is replaced).
  const prevActiveRef = useRef(activeCount);
  const [popKey, setPopKey] = useState(0);
  useEffect(() => {
    const prev = prevActiveRef.current;
    prevActiveRef.current = activeCount;
    if (prev === 0 && activeCount > 0) {
      setPopKey((k) => k + 1);
    }
  }, [activeCount]);

  return (
    <Popover open={open} onOpenChange={(v) => dispatch(downloadsPanelOpenSet(v))}>
      <Tooltip content={tooltipLabel} side="bottom">
        <PopoverTrigger>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={tooltipLabel}
            aria-haspopup="dialog"
            aria-expanded={open}
            className="relative"
          >
            <Icon icon={DownloadSimple} size="md" />
            {activeCount > 0 && (
              <Badge
                key={popKey}
                tone="accent"
                size="sm"
                className={cn(
                  'absolute -right-1 -top-1 min-w-[14px] px-1 leading-none rounded-full',
                  'badge-pop',
                )}
                aria-hidden
              >
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent align="end" sideOffset={8} className="w-[360px]">
        <header className="flex items-center justify-between border-b border-border-default px-3 py-2">
          <span className="text-xs font-medium text-fg-default">Downloads</span>
          {/* "View all" routed to /discover which is currently a stub —
              dead-end. Re-surface the button once Discover ships a
              downloads tab (UX2-SHELL-018). */}
        </header>

        {isLoading ? (
          <div className="px-3 py-4 text-center text-caption text-fg-muted">Loading…</div>
        ) : visibleDownloads.length === 0 ? (
          <EmptyState
            icon={Tray}
            title="No downloads yet"
            description="Active and recent model downloads will appear here."
          />
        ) : (
          <ul className="max-h-[280px] overflow-y-auto py-1">
            {visibleDownloads.map((d) => (
              <DownloadRow key={d.id} download={d} onDismiss={() => dismiss(d.id)} />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function DownloadRow({
  download,
  onDismiss,
}: {
  readonly download: DownloadEntity;
  readonly onDismiss: () => void;
}) {
  const total = Number(download.totalBytes);
  const received = Number(download.receivedBytes);
  const percent = total > 0 ? Math.round((received / total) * 100) : 0;
  const tone = download.status === 'failed' ? 'danger' : 'accent';
  const isFailed = download.status === 'failed';

  return (
    <li className="flex flex-col gap-1 px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-caption">
        <span className="truncate text-fg-default">{download.modelId}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="text-fg-muted">{percent}%</span>
          {isFailed && (
            <Tooltip content="Dismiss" side="left">
              <button
                type="button"
                onClick={onDismiss}
                aria-label={`Dismiss failed download for ${download.modelId}`}
                className="rounded-sm p-0.5 text-fg-subtle hover:bg-bg-active hover:text-fg-default"
              >
                <Icon icon={X} size="xs" />
              </button>
            </Tooltip>
          )}
        </span>
      </div>
      <ProgressBar value={received} max={total} tone={tone} />
      <div className="flex items-center justify-between text-caption text-fg-subtle">
        <span>{formatDownloadStatus(download.status)}</span>
        <span>
          {formatBytes(received as never)} / {formatBytes(total as never)}
        </span>
      </div>
    </li>
  );
}
