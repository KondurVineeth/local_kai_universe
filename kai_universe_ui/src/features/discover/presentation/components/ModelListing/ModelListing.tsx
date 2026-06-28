import { CaretDown, MagnifyingGlass, Star } from '@phosphor-icons/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  Input,
  ScrollArea,
} from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectDiscoverFormatFilter,
  selectDiscoverSearchQuery,
  selectDiscoverSort,
} from '../../store/selectors';
import {
  formatFilterSet,
  searchQuerySet,
  sortSet,
  type DiscoverFormatFilter,
  type DiscoverSort,
} from '../../store/slice';

import { ModelListRow } from './ModelListRow';

import type { Model } from '@shared/domain/model/entities/Model';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';

interface ModelListingProps {
  readonly models: readonly Model[];
  readonly totalCount: number;
  readonly selectedId: ModelId | null;
  readonly onSelect: (id: ModelId) => void;
}

const FORMAT_LABELS: Record<DiscoverFormatFilter, string> = {
  all: 'All formats',
  mlx: 'MLX',
  gguf: 'GGUF',
};

const SORT_LABELS: Record<DiscoverSort, string> = {
  'best-match': 'Best match',
  'most-downloaded': 'Most downloaded',
  newest: 'Newest',
};

export function ModelListing({ models, totalCount, selectedId, onSelect }: ModelListingProps) {
  const dispatch = useAppDispatch();
  const query = useAppSelector(selectDiscoverSearchQuery);
  const format = useAppSelector(selectDiscoverFormatFilter);
  const sort = useAppSelector(selectDiscoverSort);

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border-default bg-bg-surface">
      <header className="flex shrink-0 flex-col gap-2 border-b border-border-default px-3 py-2.5">
        <Input
          inputSize="sm"
          value={query}
          onChange={(e) => dispatch(searchQuerySet(e.target.value))}
          placeholder="Search models, authors, tags…"
          leadingIcon={<Icon icon={MagnifyingGlass} size="sm" />}
          aria-label="Search models"
        />
        <div className="flex items-center justify-between gap-2">
          <FilterDropdown
            label={FORMAT_LABELS[format]}
            options={FORMAT_LABELS}
            value={format}
            onChange={(v) => dispatch(formatFilterSet(v))}
          />
          <FilterDropdown
            label={SORT_LABELS[sort]}
            options={SORT_LABELS}
            value={sort}
            onChange={(v) => dispatch(sortSet(v))}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-fg-subtle">
          <span>
            {models.length} of {totalCount} models
          </span>
          {format !== 'all' || sort !== 'best-match' ? (
            <button
              type="button"
              onClick={() => {
                dispatch(formatFilterSet('all'));
                dispatch(sortSet('best-match'));
              }}
              className="text-fg-accent hover:underline"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      </header>

      <ScrollArea className="flex-1">
        {models.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <ul className="flex flex-col">
            {models.map((m) => (
              <ModelListRow
                key={m.id}
                model={m}
                selected={m.id === selectedId}
                onSelect={() => onSelect(m.id)}
              />
            ))}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
}

interface FilterDropdownProps<V extends string> {
  readonly label: string;
  readonly options: Record<V, string>;
  readonly value: V;
  readonly onChange: (v: V) => void;
}

function FilterDropdown<V extends string>({ label, options, value, onChange }: FilterDropdownProps<V>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 rounded-md border border-border-default bg-bg-raised px-2 py-1 text-[10px] text-fg-default hover:bg-bg-active',
          )}
        >
          <span>{label}</span>
          <Icon icon={CaretDown} size="xs" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {(Object.keys(options) as V[]).map((key) => (
          <DropdownMenuItem key={key} onSelect={() => onChange(key)}>
            <span className={value === key ? 'text-fg-default' : 'text-fg-muted'}>
              {options[key]}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({ query }: { readonly query: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <Icon icon={Star} size="md" className="text-fg-subtle" />
      <p className="text-xs text-fg-default">
        {query ? `No models match "${query}"` : 'No models in this category'}
      </p>
      <p className="text-[10px] text-fg-subtle">
        Try a different category or clear your filters.
      </p>
    </div>
  );
}
