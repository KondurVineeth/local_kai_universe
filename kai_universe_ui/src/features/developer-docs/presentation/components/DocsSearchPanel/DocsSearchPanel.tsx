import { MagnifyingGlass, X } from '@phosphor-icons/react';
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { rightPanelOpenSet } from '@features/shell';
import { useContainer } from '@shared/container-context';
import { Icon, Input, ScrollArea } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { searchDocs } from '../../../application/use-cases/searchDocs';
import { DOC_SECTION_LABELS } from '../../../domain/value-objects/DocSection';
import { selectSearchPanelOpen } from '../../store/selectors';
import { searchPanelOpenSet } from '../../store/slice';

import type { DocSearchHit } from '../../../application/use-cases/searchDocs';

export function DocsSearchPanel() {
  const isOpen = useAppSelector(selectSearchPanelOpen);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const container = useContainer();
  const pages = useMemo(() => container.developerDocs.docsRepository.listAll(), [container]);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [activeIndex, setActiveIndex] = useState(0);

  const hits = useMemo(() => searchDocs(pages, deferredQuery), [pages, deferredQuery]);

  // Reset focus index whenever the result set changes (new query, panel
  // re-open). Otherwise a stale index could point past the new list end.
  useEffect(() => {
    setActiveIndex(0);
  }, [hits]);

  // Flag reconciliation: the shell's per-route `rightPanelOpen` is the
  // single source of truth for whether the 320px column is visible (the
  // header RightPanelToggle drives it). `developerDocs.searchPanelOpen`
  // used to ALSO gate render — closing it left an empty column with no
  // way back. We now self-heal it to `true` whenever the panel mounts, so
  // re-opening the column via the header toggle always shows the search
  // panel. `close()` collapses the shell column instead.
  useEffect(() => {
    if (!isOpen) dispatch(searchPanelOpenSet(true));
  }, [isOpen, dispatch]);

  const trimmed = deferredQuery.trim();

  const close = () => {
    // Collapse the shell's right-panel column for the docs route. The
    // header's RightPanelToggle (⌘.) re-opens it.
    dispatch(rightPanelOpenSet(false));
    setQuery('');
  };
  const openHit = (hit: DocSearchHit) => navigate(`/developer-docs/${hit.slug}`);

  const onKeyDown = makeKeyboardHandler({ hits, activeIndex, setActiveIndex, openHit, close });

  return (
    <aside
      className="flex h-full min-w-0 flex-col border-l border-border-default bg-bg-surface"
      onKeyDown={onKeyDown}
    >
      <SearchHeader
        query={query}
        onChange={setQuery}
        onClose={close}
        activeDescendantId={
          hits[activeIndex] ? `docs-search-hit-${hits[activeIndex].slug}` : undefined
        }
      />
      <ScrollArea className="flex-1">
        {trimmed.length === 0 ? (
          <EmptyHero />
        ) : hits.length === 0 ? (
          <NoResults query={trimmed} />
        ) : (
          <ul id="docs-search-hits" role="listbox" className="flex flex-col gap-1 p-2">
            {hits.map((hit, i) => (
              <HitRow
                key={hit.slug}
                hit={hit}
                active={i === activeIndex}
                onSelect={() => openHit(hit)}
                onHover={() => setActiveIndex(i)}
              />
            ))}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
}

// Keyboard contract:
//   Esc          → close panel + clear query
//   ArrowDown    → move focus to next hit (clamped to last)
//   ArrowUp      → move focus to prev hit (clamped to first)
//   Enter        → open focused hit
// All four work from the input; ArrowUp/Down also work from the list.
function makeKeyboardHandler(args: {
  readonly hits: readonly DocSearchHit[];
  readonly activeIndex: number;
  readonly setActiveIndex: (updater: (i: number) => number) => void;
  readonly openHit: (h: DocSearchHit) => void;
  readonly close: () => void;
}) {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      args.close();
      return;
    }
    if (args.hits.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      args.setActiveIndex((i) => Math.min(args.hits.length - 1, i + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      args.setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const hit = args.hits[args.activeIndex];
      if (hit) args.openHit(hit);
    }
  };
}

function SearchHeader({
  query,
  onChange,
  onClose,
  activeDescendantId,
}: {
  readonly query: string;
  readonly onChange: (v: string) => void;
  readonly onClose: () => void;
  readonly activeDescendantId: string | undefined;
}) {
  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border-default px-3">
      <Input
        inputSize="sm"
        leadingIcon={<Icon icon={MagnifyingGlass} size="xs" />}
        placeholder="Search the docs…"
        value={query}
        onChange={(e) => onChange(e.currentTarget.value)}
        autoFocus
        className="flex-1"
        aria-label="Search the developer docs"
        aria-controls="docs-search-hits"
        aria-activedescendant={activeDescendantId}
      />
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-fg-subtle hover:bg-bg-raised hover:text-fg-default"
        aria-label="Close search panel"
      >
        <Icon icon={X} size="xs" weight="bold" />
      </button>
    </header>
  );
}

function HitRow({
  hit,
  active,
  onSelect,
  onHover,
}: {
  readonly hit: DocSearchHit;
  readonly active: boolean;
  readonly onSelect: () => void;
  readonly onHover: () => void;
}) {
  const rowRef = useRef<HTMLLIElement | null>(null);
  // Scroll the active hit into view when arrow-key navigation moves
  // focus past the visible area of the ScrollArea.
  useEffect(() => {
    if (active) rowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [active]);
  return (
    <li
      ref={rowRef}
      id={`docs-search-hit-${hit.slug}`}
      role="option"
      aria-selected={active}
    >
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={onHover}
        className={`flex w-full flex-col gap-1 rounded-sm px-2 py-2 text-left transition-colors ${
          active ? 'bg-bg-raised' : 'hover:bg-bg-raised'
        }`}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-fg-default">{hit.title}</span>
          {DOC_SECTION_LABELS[hit.section] && (
            <span className="shrink-0 text-caption uppercase tracking-wide text-fg-subtle">
              {DOC_SECTION_LABELS[hit.section]}
            </span>
          )}
        </span>
        <span className="line-clamp-2 text-caption text-fg-subtle">{hit.snippet}</span>
      </button>
    </li>
  );
}

function EmptyHero() {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 px-6 text-center text-fg-subtle">
      <Icon icon={MagnifyingGlass} size="xl" className="text-fg-subtle" />
      <p className="text-xs">Search the developer docs</p>
      <p className="text-caption text-fg-subtle">
        <kbd className="rounded border border-border-default bg-bg-raised px-1 py-0.5 text-[10px]">↑</kbd>
        <kbd className="ml-1 rounded border border-border-default bg-bg-raised px-1 py-0.5 text-[10px]">↓</kbd>
        <span className="ml-1">to move,</span>
        <kbd className="ml-1 rounded border border-border-default bg-bg-raised px-1 py-0.5 text-[10px]">Enter</kbd>
        <span className="ml-1">to open,</span>
        <kbd className="ml-1 rounded border border-border-default bg-bg-raised px-1 py-0.5 text-[10px]">Esc</kbd>
        <span className="ml-1">to close.</span>
      </p>
    </div>
  );
}

function NoResults({ query }: { readonly query: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-xs text-fg-default">No matches</p>
      <p className="text-caption text-fg-subtle">
        Nothing in the docs matches &ldquo;{query}&rdquo;.
      </p>
    </div>
  );
}
