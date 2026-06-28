// Compact "x time ago" formatter used in low-stakes places (last-edited
// timestamps, "Saved n min ago" indicators). Falls back to a short locale
// date string for anything older than a week.
//
// Not localized — strings are English. If/when we wire ZL Universe's
// `Settings → Language` to a real i18n layer this becomes the obvious
// boundary to swap.
export function formatRelativeTime(
  isoOrDate: string | Date | null | undefined,
  now: Date = new Date(),
): string {
  if (!isoOrDate) return '';
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'just now';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  // Older than a week — show a short date instead. Avoids "47 days ago"
  // which reads as imprecise the moment you cross "last month".
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
