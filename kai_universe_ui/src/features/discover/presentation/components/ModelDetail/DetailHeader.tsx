import { Copy, DownloadSimple, SealCheck, Star } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Icon, Tooltip } from '@shared/ds/primitives';
import { useAppDispatch } from '@shared/store/hooks';

import { categorySet } from '../../store/slice';

import type { Model } from '@shared/domain/model/entities/Model';

// Top of the detail pane. Matches the reference:
//   ┌─ author-mark ─ slug + copy ─────────────────────────── [Staff Pick] ┐
//   │ ↓ 89,487   ★ 12   Last updated: 123 days ago                          │
export function DetailHeader({ model }: { readonly model: Model }) {
  const [copied, setCopied] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const slug = `${model.author}/${model.id}`;
  const onCopy = () => {
    void navigator.clipboard?.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  // Previously the badge was a fake anchor (`href="#staff-pick"` with
  // preventDefault) that looked clickable but did nothing — UX rule 1
  // ("no dead buttons"). Now it filters the list to Staff Picks so the
  // affordance pays off.
  const onStaffPick = () => {
    dispatch(categorySet('staff-picks'));
    navigate('/discover');
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <AuthorMark author={model.author} />
          <h1 className="flex min-w-0 items-center gap-2">
            <code className="truncate font-mono text-sm text-fg-default">{slug}</code>
            <Tooltip content={copied ? 'Copied!' : 'Copy slug'} side="top">
              <Button variant="ghost" size="sm" iconOnly aria-label="Copy slug" onClick={onCopy}>
                <Icon icon={Copy} size="xs" />
              </Button>
            </Tooltip>
          </h1>
        </div>
        {model.staffPick && (
          <button
            type="button"
            onClick={onStaffPick}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-fg-accent hover:bg-accent/30"
          >
            <Icon icon={SealCheck} size="xs" weight="fill" />
            Staff Pick
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-fg-subtle">
        <span className="inline-flex items-center gap-1">
          <Icon icon={DownloadSimple} size="xs" />
          {formatCount(model.downloadCount)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Icon icon={Star} size="xs" />
          {formatCount(model.starCount)}
        </span>
        <span>Last updated: {relativeTime(model.publishedAt)}</span>
      </div>
    </div>
  );
}

function AuthorMark({ author }: { readonly author: string }) {
  const initial = author.charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/20 text-[12px] font-semibold uppercase text-fg-accent"
    >
      {initial}
    </span>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return n.toLocaleString();
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
