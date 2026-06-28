import { CaretDown, CaretUp, MagnifyingGlass } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Icon, ScrollArea } from '@shared/ds/primitives';
import { useAppSelector } from '@shared/store/hooks';

import { selectInstalledAtByModel, selectInstalledQuantByModel } from '../../store/selectors';

import { ModelRow } from './ModelRow';

import type { DeviceFilter } from '../../store/slice';
import type { Model } from '@shared/domain/model/entities/Model';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';

interface ModelsTableProps {
  readonly models: readonly Model[];
  readonly totalCount: number;
  readonly query: string;
  readonly device: DeviceFilter;
  readonly selectedId: ModelId | null;
  readonly pinned: readonly ModelId[];
  readonly onSelect: (id: ModelId) => void;
}

type SortKey = 'name' | 'params' | 'size' | 'modified';
type SortDir = 'asc' | 'desc';

// Default sort: pinned-first then most-recent-install. Selecting a column
// header swaps to that key (re-click toggles direction). Pinned rows stay
// in their own bucket at the top, sorted within by the active key — so
// sort never reorders pinned out of the pinned group.

export function ModelsTable({
  models,
  totalCount,
  query,
  device,
  selectedId,
  pinned,
  onSelect,
}: ModelsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('modified');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const installedAt = useAppSelector(selectInstalledAtByModel);
  const installedQuant = useAppSelector(selectInstalledQuantByModel);

  const sorted = useMemo(
    () => sortModelsKeepingPinnedFirst(models, pinned, sortKey, sortDir, installedAt, installedQuant),
    [models, pinned, sortKey, sortDir, installedAt, installedQuant],
  );

  if (models.length === 0) {
    return <EmptyState query={query} totalCount={totalCount} device={device} />;
  }
  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HeaderRow sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
      <ScrollArea className="flex-1">
        <ul className="flex flex-col">
          {sorted.map((m) => (
            <ModelRow
              key={m.id}
              model={m}
              selected={m.id === selectedId}
              pinned={pinned.includes(m.id)}
              onSelect={() => onSelect(m.id)}
            />
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

const GRID_TEMPLATE =
  'minmax(60px,1fr) minmax(80px,1fr) minmax(60px,80px) minmax(140px,1.5fr) minmax(220px,2fr) minmax(60px,80px) minmax(60px,80px) minmax(100px,1fr) 80px';

function HeaderRow({
  sortKey,
  sortDir,
  onSort,
}: {
  readonly sortKey: SortKey;
  readonly sortDir: SortDir;
  readonly onSort: (key: SortKey) => void;
}) {
  // Header is a flat 9-cell grid that must match ModelRow's grid columns.
  // Order: Device, Arch, Params, Publisher, LLM, Quant, Size, Modified, Actions.
  return (
    <div
      className="grid shrink-0 border-b border-border-default bg-bg-surface px-4 py-2 text-[10px] uppercase tracking-wider text-fg-subtle"
      style={{ gridTemplateColumns: GRID_TEMPLATE }}
    >
      <Cell label="Device" />
      <Cell label="Arch" />
      <SortCell label="Params" myKey="params" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      <Cell label="Publisher" />
      <SortCell label="Model" myKey="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      <Cell label="Quant" />
      <SortCell label="Size" myKey="size" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      <SortCell label="Modified" myKey="modified" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      <span className="text-right">Actions</span>
    </div>
  );
}

function Cell({ label }: { readonly label: string }) {
  return <span>{label}</span>;
}

function SortCell({
  label,
  myKey,
  sortKey,
  sortDir,
  onSort,
}: {
  readonly label: string;
  readonly myKey: SortKey;
  readonly sortKey: SortKey;
  readonly sortDir: SortDir;
  readonly onSort: (key: SortKey) => void;
}) {
  const active = sortKey === myKey;
  return (
    <button
      type="button"
      onClick={() => onSort(myKey)}
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className="inline-flex items-center gap-1 text-left transition-colors hover:text-fg-default"
    >
      <span>{label}</span>
      {active && (
        <Icon
          icon={sortDir === 'asc' ? CaretUp : CaretDown}
          size="xs"
          weight="bold"
          className="text-fg-default"
        />
      )}
    </button>
  );
}

function sortModelsKeepingPinnedFirst(
  models: readonly Model[],
  pinned: readonly ModelId[],
  key: SortKey,
  dir: SortDir,
  installedAt: Readonly<Record<string, string | undefined>>,
  installedQuant: Readonly<Record<string, string | undefined>>,
): readonly Model[] {
  const pinnedSet = new Set(pinned);
  const pinnedRows = models.filter((m) => pinnedSet.has(m.id));
  const restRows = models.filter((m) => !pinnedSet.has(m.id));
  const cmp = makeComparator(key, dir, installedAt, installedQuant);
  return [...[...pinnedRows].sort(cmp), ...[...restRows].sort(cmp)];
}

// Resolve the size the row actually displays: the installed variant, not
// variants[0]. Sorting on variants[0] would order rows by a quant the user
// never downloaded — visibly wrong against the Size column.
function installedSizeBytes(
  m: Model,
  installedQuant: Readonly<Record<string, string | undefined>>,
): number {
  const quant = installedQuant[m.id];
  const variant = m.variants.find((v) => v.quantization === quant) ?? m.variants[0];
  return Number(variant?.sizeBytes ?? 0);
}

function makeComparator(
  key: SortKey,
  dir: SortDir,
  installedAt: Readonly<Record<string, string | undefined>>,
  installedQuant: Readonly<Record<string, string | undefined>>,
): (a: Model, b: Model) => number {
  const mult = dir === 'asc' ? 1 : -1;
  return (a, b) => {
    let av: number | string;
    let bv: number | string;
    switch (key) {
      case 'name':
        av = a.displayName.toLowerCase();
        bv = b.displayName.toLowerCase();
        break;
      case 'params':
        av = a.parameterCountB;
        bv = b.parameterCountB;
        break;
      case 'size':
        av = installedSizeBytes(a, installedQuant);
        bv = installedSizeBytes(b, installedQuant);
        break;
      case 'modified':
        av = installedAt[a.id] ?? '';
        bv = installedAt[b.id] ?? '';
        break;
    }
    if (av < bv) return -1 * mult;
    if (av > bv) return 1 * mult;
    return 0;
  };
}

// Matches ZL Universe's "No matching results" pattern with a cross-feature
// jump to Discover seeded with the same query. The Remote filter gets its
// own copy — "remote" is empty by design until a device is paired, not a
// missing-results situation, so it must explain itself rather than offer a
// Discover search that wouldn't help.
function EmptyState({
  query,
  totalCount,
  device,
}: {
  readonly query: string;
  readonly totalCount: number;
  readonly device: DeviceFilter;
}) {
  const navigate = useNavigate();

  if (device === 'remote' && !query) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <p className="text-xs text-fg-default">No remote models</p>
        <p className="max-w-sm text-[11px] text-fg-subtle">
          Remote models appear here once you pair a device. Pair one from the
          Remote section, then its models show up under this filter.
        </p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/remote')}>
          Open Remote
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <p className="text-xs text-fg-subtle">
        {query ? 'No matching results' : totalCount === 0 ? 'You have no installed models yet' : 'No models match this category'}
      </p>
      {query && (
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<Icon icon={MagnifyingGlass} size="xs" />}
          onClick={() => navigate(`/discover?q=${encodeURIComponent(query)}`)}
        >
          Search more results for &quot;{query}&quot;
        </Button>
      )}
      {totalCount === 0 && (
        <Button variant="primary" size="sm" onClick={() => navigate('/discover')}>
          Browse Discover
        </Button>
      )}
    </div>
  );
}
