import {
  ArrowClockwise,
  Brain,
  Eject,
  MagnifyingGlass,
  Prohibit,
  Warning,
  Wrench,
  X,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { onboardingReset } from '@features/onboarding';
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  Icon,
  Spinner,
  Tooltip,
} from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { formatBytes, formatParameterCount } from '@shared/lib/format';
import { useAppDispatch } from '@shared/store/hooks';

import type { ModelLoadStatus } from '../../../domain/value-objects/ModelLoadStatus';
import type { ModelCapabilityFilter } from '../../store/slice';
import type { Model } from '@shared/domain/model/entities/Model';

export interface ModelPickerMenuProps {
  readonly loadedModel: Model | null;
  readonly status: ModelLoadStatus;
  readonly models: readonly Model[];
  // Total count of installed models (pre-filter). Used by the empty-state
  // branch to distinguish "no models installed" from "filter excluded all"
  // (UX-SHELL-011).
  readonly installedCount: number;
  readonly isLoading: boolean;
  readonly query: string;
  readonly onQueryChange: (q: string) => void;
  readonly capabilityFilter: ModelCapabilityFilter;
  readonly onCapabilityFilterChange: (f: ModelCapabilityFilter) => void;
  // Last model-load failure message (from shell.modelLoadError). When set,
  // an error banner with Retry + Dismiss surfaces above the results.
  readonly loadError: string | null;
  // Retry the last failed load. Undefined when there's no failed model id to
  // point at (e.g. error cleared) — the banner then only offers Dismiss.
  readonly onRetryLoad?: () => void;
  readonly onDismissError: () => void;
  readonly onSelectModel: (m: Model) => void;
  readonly onEject: () => void;
  readonly onClose?: () => void;
}

const FILTER_LABELS: Record<ModelCapabilityFilter, string> = {
  all: 'All',
  reasoning: 'Reasoning',
  tools: 'Tools',
  vision: 'Vision',
};

type SortKey = 'recency' | 'size' | 'downloaded';
type SortDir = 'asc' | 'desc';

// Re-styled to match the ZL Universe reference (image #94):
//   - Top filter input with close button
//   - Currently Loaded block (purple/accent-tinted) with memory consumption + eject
//   - Your Models list with sort tabs + "All" filter dropdown + per-row badges
//   - Footer toggle for "Manually choose model load parameters"
export function ModelPickerMenu({
  loadedModel,
  status,
  models,
  installedCount,
  isLoading,
  query,
  onQueryChange,
  capabilityFilter,
  onCapabilityFilterChange,
  loadError,
  onRetryLoad,
  onDismissError,
  onSelectModel,
  onEject,
  onClose,
}: ModelPickerMenuProps) {
  // While ejecting, model selection rows + the in-menu eject button must
  // be disabled — clicking them races the in-flight eject thunk.
  const ejecting = status === 'unloading';
  const [sort, setSort] = useState<SortKey>('recency');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = sortModels(models, sort, sortDir);

  // Click handler for sort tabs: clicking the active tab toggles direction;
  // clicking a different tab switches key and resets to descending (newest /
  // largest / most-downloaded first — the "interesting end" of each axis).
  const handleSort = (key: SortKey) => {
    if (key === sort) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="flex flex-col">
      <FilterRow value={query} onChange={onQueryChange} onClose={onClose} />

      {loadError && (
        <LoadErrorBanner
          message={loadError}
          onRetry={onRetryLoad}
          onDismiss={onDismissError}
        />
      )}

      {loadedModel && (
        <CurrentlyLoaded model={loadedModel} onEject={onEject} ejecting={ejecting} />
      )}

      <YourModelsHeader
        sort={sort}
        sortDir={sortDir}
        onSort={handleSort}
        capabilityFilter={capabilityFilter}
        onCapabilityFilterChange={onCapabilityFilterChange}
      />

      <ResultsBody
        isLoading={isLoading}
        models={sorted}
        installedCount={installedCount}
        query={query}
        capabilityFilter={capabilityFilter}
        onClearQuery={() => onQueryChange('')}
        onClearCapabilityFilter={() => onCapabilityFilterChange('all')}
        loadedModelId={loadedModel?.id ?? null}
        ejecting={ejecting}
        onSelect={onSelectModel}
      />
    </div>
  );
}

// ─── load-error banner (UX2-SHELL — surfaces shell.modelLoadError) ────────────

function LoadErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  readonly message: string;
  readonly onRetry?: () => void;
  readonly onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 border-b border-danger/40 bg-danger/10 px-3 py-2"
    >
      <Icon icon={Warning} size="sm" className="mt-0.5 shrink-0 text-danger" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-xs font-medium text-fg-default">Couldn&apos;t load model</span>
        <span className="text-caption text-fg-muted">{message}</span>
        <div className="flex items-center gap-1.5">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-md border border-border-default bg-bg-raised px-2 py-0.5 text-caption text-fg-default hover:bg-bg-active"
            >
              <Icon icon={ArrowClockwise} size="xs" />
              <span>Retry</span>
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md px-2 py-0.5 text-caption text-fg-subtle hover:text-fg-default"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── filter row ──────────────────────────────────────────────────────────────

function FilterRow({
  value,
  onChange,
  onClose,
}: {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly onClose?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border-default px-3 py-2">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type to filter models..."
        className="flex-1 bg-transparent text-xs text-fg-default placeholder:text-fg-subtle focus:outline-none"
      />
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close model picker"
          className="rounded-sm p-0.5 text-fg-subtle hover:bg-bg-active hover:text-fg-default"
        >
          <Icon icon={X} size="sm" />
        </button>
      )}
    </div>
  );
}

// ─── currently loaded ────────────────────────────────────────────────────────

function CurrentlyLoaded({
  model,
  onEject,
  ejecting,
}: {
  readonly model: Model;
  readonly onEject: () => void;
  readonly ejecting: boolean;
}) {
  return (
    <div className="border-b border-border-default px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between text-caption text-fg-subtle">
        <span>Currently Loaded (1)</span>
      </div>
      <div className="flex items-center gap-2 rounded-md bg-accent/30 px-2 py-2">
        <code className="flex-1 truncate font-mono text-xs text-fg-default">
          {model.author}/{model.id}
        </code>
        <Badge tone="neutral" size="sm">
          Context: {model.contextLengthTokens.toLocaleString()}
        </Badge>
        <Badge tone="neutral" size="sm">
          {model.format.toUpperCase()}
        </Badge>
        <button
          type="button"
          onClick={onEject}
          disabled={ejecting}
          aria-label={ejecting ? 'Ejecting…' : 'Eject'}
          className={cn(
            // Matches the Badge sizing next to it (text-[10px] + tight
            // padding) so the eject affordance doesn't visually dominate.
            'inline-flex items-center gap-1 rounded-md border border-border-default bg-bg-raised px-1.5 py-0.5 text-[10px] text-fg-default',
            ejecting ? 'cursor-not-allowed opacity-60' : 'hover:bg-bg-active',
          )}
        >
          <Icon icon={Eject} size="xs" />
          <span>{ejecting ? 'Ejecting…' : 'Eject'}</span>
        </button>
      </div>
    </div>
  );
}

// ─── your models header ──────────────────────────────────────────────────────

function YourModelsHeader({
  sort,
  sortDir,
  onSort,
  capabilityFilter,
  onCapabilityFilterChange,
}: {
  readonly sort: SortKey;
  readonly sortDir: SortDir;
  readonly onSort: (s: SortKey) => void;
  readonly capabilityFilter: ModelCapabilityFilter;
  readonly onCapabilityFilterChange: (f: ModelCapabilityFilter) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border-default px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-caption text-fg-subtle">Your Models</span>
        <CapabilityFilterMenu value={capabilityFilter} onChange={onCapabilityFilterChange} />
      </div>
      <div className="flex items-center gap-1 text-caption">
        <SortTab
          active={sort === 'recency'}
          dir={sort === 'recency' ? sortDir : undefined}
          onClick={() => onSort('recency')}
        >
          Recency
        </SortTab>
        <SortTab
          active={sort === 'size'}
          dir={sort === 'size' ? sortDir : undefined}
          onClick={() => onSort('size')}
        >
          Size
        </SortTab>
        <SortTab
          active={sort === 'downloaded'}
          dir={sort === 'downloaded' ? sortDir : undefined}
          onClick={() => onSort('downloaded')}
        >
          Downloaded
        </SortTab>
      </div>
    </div>
  );
}

function CapabilityFilterMenu({
  value,
  onChange,
}: {
  readonly value: ModelCapabilityFilter;
  readonly onChange: (f: ModelCapabilityFilter) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-border-default bg-bg-raised px-2 py-0.5 text-caption text-fg-default"
          aria-label="Capability filter"
        >
          {FILTER_LABELS[value]}
          <span aria-hidden className="text-fg-subtle">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[140px]">
        {(Object.keys(FILTER_LABELS) as ModelCapabilityFilter[]).map((key) => (
          <DropdownMenuItem key={key} onSelect={() => onChange(key)}>
            <span className={value === key ? 'text-fg-default' : ''}>{FILTER_LABELS[key]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortTab({
  active,
  dir,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly dir?: SortDir;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 transition-colors',
        active ? 'bg-accent text-fg-default' : 'text-fg-subtle hover:text-fg-default',
      )}
    >
      <span>{children}</span>
      {active && <span aria-hidden>{dir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );
}

// ─── results body ────────────────────────────────────────────────────────────

interface ResultsBodyProps {
  readonly isLoading: boolean;
  readonly models: readonly Model[];
  readonly installedCount: number;
  readonly query: string;
  readonly capabilityFilter: ModelCapabilityFilter;
  readonly onClearQuery: () => void;
  readonly onClearCapabilityFilter: () => void;
  readonly loadedModelId: string | null;
  // Disables every selectable row while the loaded model is mid-eject.
  // Without this, clicking a row mid-eject races: loadModelThunk sets
  // modelLoadStatus='loading' with the new id, then the in-flight eject
  // completes and clobbers loadedModelId back to null.
  readonly ejecting: boolean;
  readonly onSelect: (m: Model) => void;
}

function ResultsBody({
  isLoading,
  models,
  installedCount,
  query,
  capabilityFilter,
  onClearQuery,
  onClearCapabilityFilter,
  loadedModelId,
  ejecting,
  onSelect,
}: ResultsBodyProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center px-3 py-6">
        <Spinner size="md" />
      </div>
    );
  }
  // UX-SHELL-011 — three distinct empty-state copies + actions:
  //   (a) user typed a query that excludes everything → "Clear search"
  //   (b) capability filter active and excludes everything → "Show all"
  //   (c) zero models installed at all → "Discover models →"
  // Detection priority is (a) > (b) > (c) — if both query and filter are
  // active, clearing the query is the lighter-weight action to suggest.
  if (models.length === 0) {
    const hasQuery = query.trim().length > 0;
    const hasCapabilityFilter = capabilityFilter !== 'all';
    const noneInstalled = installedCount === 0;
    if (hasQuery) {
      return (
        <EmptyStateWithAction
          title={`No models match "${query.trim()}"`}
          description="Your search excluded every installed model."
          actionLabel="Clear search"
          onAction={onClearQuery}
        />
      );
    }
    if (hasCapabilityFilter) {
      return (
        <EmptyStateWithAction
          title="No models match this capability filter"
          description={`None of your installed models report "${FILTER_LABELS[capabilityFilter]}" capability.`}
          actionLabel="Show all"
          onAction={onClearCapabilityFilter}
        />
      );
    }
    if (noneInstalled) {
      // Discover surface is still a stub — pointing the user there is a
      // dead-end (UX2-SHELL-017). Until Discover ships, the action triggers
      // the onboarding replay directly (resets onboarding state + routes to
      // the wizard), which has a working starter-model picker. Routing to
      // bare /settings was itself a dead-end — the user landed on the
      // General panel with no idea the Replay control was the next step.
      return <NoModelsInstalledEmptyState />;
    }
    // Fallback (should be unreachable given the branches above) — keep the
    // generic message instead of crashing.
    return (
      <EmptyState
        icon={Prohibit}
        title="No models match"
        description="Try a different search term."
      />
    );
  }
  return (
    <div className="max-h-[320px] overflow-y-auto border-b border-border-default">
      {models.map((m, idx) => (
        <div
          key={m.id}
          className={cn(idx > 0 && 'border-t border-border-default')}
        >
          <ModelListRow
            model={m}
            isLoaded={loadedModelId === m.id}
            ejecting={ejecting}
            onClick={() => onSelect(m)}
          />
        </div>
      ))}
    </div>
  );
}

function ModelListRow({
  model,
  isLoaded,
  ejecting,
  onClick,
}: {
  readonly model: Model;
  readonly isLoaded: boolean;
  readonly ejecting: boolean;
  readonly onClick: () => void;
}) {
  const recommended = model.variants.find((v) => v.recommended) ?? model.variants[0];
  const series = model.id.split('-')[0]; // crude: derive series from id (e.g. "qwen3-4b" → "qwen3")
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoaded || ejecting}
      className={cn(
        'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
        'hover:bg-bg-raised disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      <span className="flex-1 truncate text-xs text-fg-default">{model.displayName}</span>

      {recommended?.quantization && (
        <Badge tone="neutral" size="sm">
          {recommended.quantization}
        </Badge>
      )}
      {/* Capability indicators — small round chips with tooltips on hover.
          Tooltips match ZL Universe's reference text exactly. 4px gap between
          chips when both are present. */}
      <span className="flex items-center gap-1">
        {model.capabilities.tools && (
          <Tooltip content="This model has been trained for tool use" side="top">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/30 text-fg-accent">
              <Icon icon={Wrench} size="xs" />
            </span>
          </Tooltip>
        )}
        {model.capabilities.reasoning && (
          <Tooltip content="This model supports reasoning" side="top">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/20 text-success">
              <Icon icon={Brain} size="xs" />
            </span>
          </Tooltip>
        )}
      </span>

      <span className="w-20 truncate text-left text-caption text-fg-muted">{model.author}</span>
      <span className="w-10 truncate text-left text-caption text-fg-muted">
        {formatParameterCount(model.parameterCountB)}
      </span>
      <span className="w-16 text-left">
        <Badge tone="danger" size="sm">{series}</Badge>
      </span>
      <span className="flex w-20 items-center gap-1 text-left">
        {/* All unique formats this model is available in (e.g. GGUF + MLX).
            Derived from variants — no hardcoding, comes through the
            ModelRepository port via the fixture adapter. Format codes are
            uppercased for display per ZL Universe convention. */}
        {[...new Set(model.variants.map((v) => v.format))].map((fmt) => (
          <Badge key={fmt} tone="neutral" size="sm">
            {fmt.toUpperCase()}
          </Badge>
        ))}
      </span>
      {recommended && (
        <span className="w-16 text-left text-caption text-fg-muted">
          {formatBytes(recommended.sizeBytes)}
        </span>
      )}
    </button>
  );
}

// ─── no-models-installed empty state ─────────────────────────────────────────

// The "no models installed" empty state's action triggers the onboarding
// replay directly rather than routing to a dead-end. Dispatching
// `onboardingReset` (a barrel-exported cross-feature action) + navigating to
// the wizard is the same effect the Settings → Replay control produces.
function NoModelsInstalledEmptyState() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const replay = () => {
    dispatch(onboardingReset());
    navigate('/onboarding/welcome');
  };
  return (
    <EmptyStateWithAction
      title="No models installed yet"
      description="Use the onboarding wizard to pick a starter model — Discover ships in the next sprint."
      actionLabel="Replay onboarding →"
      onAction={replay}
    />
  );
}

// ─── sorting ─────────────────────────────────────────────────────────────────

function sortModels(models: readonly Model[], key: SortKey, dir: SortDir): readonly Model[] {
  const arr = [...models];
  // Default comparators are written for descending. Flip at the end if asc.
  if (key === 'recency') {
    arr.sort((a, b) => (b.publishedAt > a.publishedAt ? 1 : -1));
  } else if (key === 'size') {
    arr.sort((a, b) => {
      const aSize = a.variants[0]?.sizeBytes ?? 0;
      const bSize = b.variants[0]?.sizeBytes ?? 0;
      return Number(bSize) - Number(aSize);
    });
  } else {
    arr.sort((a, b) => b.downloadCount - a.downloadCount);
  }
  return dir === 'asc' ? arr.reverse() : arr;
}

// ─── empty-state with action (UX-SHELL-011) ──────────────────────────────────

function EmptyStateWithAction({
  title,
  description,
  actionLabel,
  onAction,
}: {
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-3 py-6 text-center">
      <Icon icon={Prohibit} size="md" className="text-fg-subtle" />
      <span className="text-xs font-medium text-fg-default">{title}</span>
      <span className="text-caption text-fg-subtle">{description}</span>
      <button
        type="button"
        onClick={onAction}
        className="mt-1 rounded-md border border-border-default bg-bg-raised px-3 py-1 text-caption text-fg-default hover:bg-bg-active"
      >
        {actionLabel}
      </button>
    </div>
  );
}

// Search input icon kept exported in case any other place references it.
export { MagnifyingGlass };
