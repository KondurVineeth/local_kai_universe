import { Star } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

import { Icon } from '@shared/ds/primitives';

import type { Model } from '@shared/domain/model/entities/Model';

export function MoreFromAuthor({
  model,
  allModels,
}: {
  readonly model: Model;
  readonly allModels: readonly Model[];
}) {
  const siblings = allModels.filter((m) => m.author === model.author && m.id !== model.id).slice(0, 6);
  if (siblings.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[10px] font-medium uppercase tracking-wider text-fg-subtle">
        More from {model.author}
      </h2>
      <ul className="flex flex-col gap-1">
        {siblings.map((s) => (
          <li key={s.id}>
            <Link
              to={`/discover/${s.id}`}
              className="flex items-center justify-between gap-2 rounded-md border border-border-default bg-bg-surface px-3 py-2 text-xs text-fg-default transition-colors hover:bg-bg-raised"
            >
              <span className="min-w-0 truncate">
                <span className="font-mono text-[11px]">{s.author}/{s.id}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-fg-subtle">
                <Icon icon={Star} size="xs" />
                {formatCount(s.downloadCount)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
