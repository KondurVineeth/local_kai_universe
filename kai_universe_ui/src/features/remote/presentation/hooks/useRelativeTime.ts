import { useEffect, useState } from 'react';

// Renders an ISO timestamp as a coarse relative string ("just now",
// "3 min ago", "2 hr ago", "1 day ago") and re-renders on an interval so
// the value stays current as time passes — a static "Last seen 0 min ago"
// that never updates reads as a frozen UI. Ticks once a minute, which is
// the finest granularity the formatter resolves.
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'unknown';
  const ms = Date.now() - then;
  if (ms < 0) return 'just now';
  if (ms < 60_000) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export function useRelativeTime(iso: string): string {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  return formatRelativeTime(iso);
}
