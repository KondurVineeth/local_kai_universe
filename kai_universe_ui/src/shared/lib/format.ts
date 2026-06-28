import type { DownloadStatus } from '../domain/download/entities/Download';
import type { Bytes } from '../domain/primitives/Bytes';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

export function formatBytes(bytes: Bytes | number, fractionDigits = 1): string {
  let n = Math.max(0, Number(bytes));
  let unit = 0;
  while (n >= 1024 && unit < BYTE_UNITS.length - 1) {
    n /= 1024;
    unit += 1;
  }
  const formatted = unit === 0 ? Math.round(n).toString() : n.toFixed(fractionDigits);
  return `${formatted} ${BYTE_UNITS[unit]}`;
}

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return RELATIVE_FORMATTER.format(diffSec, 'second');
  if (abs < 3600) return RELATIVE_FORMATTER.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return RELATIVE_FORMATTER.format(Math.round(diffSec / 3600), 'hour');
  return RELATIVE_FORMATTER.format(Math.round(diffSec / 86400), 'day');
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en').format(n);
}

export function formatTokenCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function formatParameterCount(b: number): string {
  if (b >= 1) return `${b}B`;
  return `${Math.round(b * 1000)}M`;
}

// UX-SHELL-010 — display label for DownloadStatus enum values. Lower-cased
// raw enum strings are unfit for the UI; this helper centralises the
// translation so every download surface (indicator popover, Discover list,
// MyModels list, etc.) reads the same.
const DOWNLOAD_STATUS_LABELS: Record<DownloadStatus, string> = {
  queued: 'Queued',
  downloading: 'Downloading',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export function formatDownloadStatus(status: DownloadStatus): string {
  return DOWNLOAD_STATUS_LABELS[status] ?? status;
}
