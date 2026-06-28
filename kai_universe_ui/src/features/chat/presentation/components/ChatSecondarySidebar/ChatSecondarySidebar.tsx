import { ChatCircle, Check, FolderPlus, ListBullets, MagnifyingGlass, NotePencil, Plus, X } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  selectShowResourceConsumptionWidget,
  selectSidebarSort as selectSettingsSidebarSort,
  selectSidebarSortOrder,
  sidebarSortChanged,
  sidebarSortOrderChanged,
} from '@features/settings';
import { SecondarySidebar } from '@shared/ds/layouts';
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  Tooltip,
} from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { exportThread } from '../../lib/exportThread';
import { setChatListCompact } from '../../store/configSlice';
import {
  selectActiveFolderId,
  selectChatListCompact,
  selectFolders,
  selectMessagesForThread,
  selectModelGate,
  selectMultiSelectedCount,
  selectMultiSelectedThreadIds,
  selectSelectedThreadId,
  selectThreads,
} from '../../store/selectors';
import {
  clearMultiSelect,
  createFolder,
  createThread,
  duplicateThread,
  moveThreadToFolder,
  pinThread,
  renameFolder,
  renameThread,
  selectThread,
  setFolderColor,
  toggleFolderExpanded,
  toggleMultiSelectThread,
} from '../../store/slice';
import {
  deleteFolderThunk,
  deleteThreadThunk,
  deleteThreadsThunk,
  moveThreadsToNewFolderThunk,
  openModelPickerThunk,
} from '../../store/thunks';

import { FolderRow } from './FolderRow';
import { ResourceConsumptionWidget } from './ResourceConsumptionWidget';
import { SearchQueryProvider } from './SearchQueryContext';
import { ThreadRow } from './ThreadRow';
import { useMarqueeSelect } from './useMarqueeSelect';

import type { FolderId } from '../../../domain/entities/Folder';
import type { Thread } from '../../../domain/entities/Thread';
import type { ThreadId } from '../../../domain/value-objects/ThreadId';
import type { SidebarSort, SidebarSortOrder } from '@features/settings';
import type { ModelLoadStatus } from '@features/shell';
import type { RootState } from '@shared/store/hooks';

const THREAD_DRAG_TYPE = 'application/x-lms-thread-id';

// Bucket the visible threads into pinned / inFolders / unfiled, applying the
// search filter. Pin is rendered orthogonally to folder membership; a pinned
// thread with a folderId appears in BOTH Pinned and its folder body. Threads
// whose folderId references a deleted folder fall through to Unfiled instead
// of vanishing — self-healing rendering for legacy/migrated state.
function useSidebarBuckets(
  threads: readonly Thread[],
  folders: ReturnType<typeof selectFolders>,
  query: string,
  sort: SidebarSort,
  order: SidebarSortOrder,
) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? threads.filter((t) => t.title.toLowerCase().includes(q)) : threads;
    return sortThreads(matched, sort, order);
  }, [threads, query, sort, order]);
  const folderIds = useMemo(() => new Set(folders.map((f) => f.id)), [folders]);
  const pinned = filtered.filter((t) => t.pinned);
  const inFolders = filtered.filter(
    (t) => !t.pinned && t.folderId && folderIds.has(t.folderId),
  );
  const unfiled = filtered.filter(
    (t) => !t.pinned && (!t.folderId || !folderIds.has(t.folderId)),
  );
  const searching = query.trim().length > 0;
  const visibleFolders = useMemo(() => {
    if (!searching) return folders;
    return folders.filter((f) => inFolders.some((t) => t.folderId === f.id));
  }, [folders, inFolders, searching]);
  return { pinned, inFolders, unfiled, visibleFolders };
}

// Sorts the thread list per the user's sidebar-sort preference. The sort
// field + order are owned by `@features/settings` (single source of truth);
// the chat feature has no duplicate sort state any more. The slice returns
// threads createdAt-descending; we always re-sort a copy so the slice's
// ordering isn't mutated. `date-modified` has no per-thread mtime in the
// mock so it falls back to createdAt.
function sortThreads(
  threads: readonly Thread[],
  sort: SidebarSort,
  order: SidebarSortOrder,
): readonly Thread[] {
  const copy = [...threads];
  const dir = order === 'asc' ? 1 : -1;
  copy.sort((a, b) => {
    let primary: number;
    if (sort === 'name') {
      primary = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    } else {
      // date-created / date-modified (no mtime in the mock → createdAt).
      primary = a.createdAt.localeCompare(b.createdAt);
    }
    if (primary !== 0) return primary * dir;
    // Stable secondary key keeps the list calm when the primary ties.
    return a.createdAt.localeCompare(b.createdAt) * dir;
  });
  return copy;
}

function useSidebarHandlers(activeFolderId: FolderId | null, ready: boolean) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const selectedId = useAppSelector(selectSelectedThreadId);
  const navigateOnNextSelection = useRef(false);
  useEffect(() => {
    if (navigateOnNextSelection.current && selectedId) {
      navigateOnNextSelection.current = false;
      navigate(`/chat/${selectedId}`);
    }
  }, [navigate, selectedId]);
  return {
    dispatch,
    // UX-CHAT-002: never auto-create state the user can't act on yet. When no
    // model is loaded, the New chat affordances become picker-openers instead
    // of thread-spawners — the noise of unusable "New Chat" rows in the
    // sidebar goes away on a brand-new install.
    handleNewChat: () => {
      if (!ready) {
        dispatch(openModelPickerThunk());
        return;
      }
      navigateOnNextSelection.current = true;
      dispatch(createThread({ folderId: activeFolderId }));
    },
    handleNewChatInFolder: (folderId: FolderId) => {
      if (!ready) {
        dispatch(openModelPickerThunk());
        return;
      }
      navigateOnNextSelection.current = true;
      dispatch(createThread({ folderId }));
    },
    handleNewFolder: () => dispatch(createFolder('New Folder')),
    handleSelect: (id: ThreadId) => {
      dispatch(selectThread(id));
      navigate(`/chat/${id}`);
    },
  };
}

export function ChatSecondarySidebar() {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  // Clear bulk-select state on first sidebar mount. Multi-select is a
  // transient UI mode (shift-click in flight); persisting "3 selected"
  // across reloads would confuse a user who closed the app on a Tuesday
  // and reopened it on Friday.
  const dispatchedClearOnMountRef = useRef(false);
  const threads = useAppSelector(selectThreads);
  const folders = useAppSelector(selectFolders);
  const selectedId = useAppSelector(selectSelectedThreadId);
  const activeFolderId = useAppSelector(selectActiveFolderId);
  const { ready, transient, status } = useAppSelector(selectModelGate);
  const { dispatch, handleNewChat, handleNewChatInFolder, handleNewFolder, handleSelect } =
    useSidebarHandlers(activeFolderId, ready);
  useEffect(() => {
    if (dispatchedClearOnMountRef.current) return;
    dispatchedClearOnMountRef.current = true;
    dispatch(clearMultiSelect());
  }, [dispatch]);
  // Sidebar sort is owned by @features/settings — single source of truth.
  const sort = useAppSelector(selectSettingsSidebarSort);
  const sortOrder = useAppSelector(selectSidebarSortOrder);
  // Developer panel toggle — gates the RAM/CPU readout in the footer.
  const showResourceWidget = useAppSelector(selectShowResourceConsumptionWidget);
  const { pinned, inFolders, unfiled, visibleFolders } = useSidebarBuckets(
    threads,
    folders,
    query,
    sort,
    sortOrder,
  );

  const exitSearch = () => {
    setQuery('');
    setSearchMode(false);
  };

  const empty = threads.length === 0 && folders.length === 0;

  return (
    <SecondarySidebar
      title="Chats"
      headerActions={
        <HeaderActions
          onOpenSearch={() => setSearchMode(true)}
          onNewChat={handleNewChat}
          searchEnabled={!empty}
          ready={ready}
        />
      }
      headerOverride={
        searchMode ? (
          <SearchHeader
            value={query}
            onChange={setQuery}
            onClear={() => setQuery('')}
            onExit={exitSearch}
          />
        ) : undefined
      }
      subHeader={
        <SidebarPrimaryActions
          onNewFolder={handleNewFolder}
          sort={sort}
          sortOrder={sortOrder}
          onSortChange={(next) => dispatch(sidebarSortChanged(next))}
          onSortOrderChange={(next) => dispatch(sidebarSortOrderChanged(next))}
        />
      }
      footer={showResourceWidget ? <ResourceConsumptionWidget /> : undefined}
    >
      <SidebarBody
        empty={empty}
        query={query}
        ready={ready}
        transient={transient}
        status={status}
        buckets={{ pinned, inFolders, unfiled, visibleFolders }}
        selectedId={selectedId}
        onNewChat={handleNewChat}
        onSelect={handleSelect}
        onNewChatInFolder={handleNewChatInFolder}
        dispatch={dispatch}
      />
    </SecondarySidebar>
  );
}

interface SidebarBodyProps {
  readonly empty: boolean;
  readonly query: string;
  readonly ready: boolean;
  readonly transient: boolean;
  readonly status: ModelLoadStatus;
  readonly buckets: {
    readonly pinned: readonly Thread[];
    readonly inFolders: readonly Thread[];
    readonly unfiled: readonly Thread[];
    readonly visibleFolders: ReturnType<typeof selectFolders>;
  };
  readonly selectedId: ThreadId | null;
  readonly onNewChat: () => void;
  readonly onSelect: (id: ThreadId) => void;
  readonly onNewChatInFolder: (id: FolderId) => void;
  readonly dispatch: ReturnType<typeof useAppDispatch>;
}

// Picks the sidebar body branch: empty install / no search results / the
// thread list. Extracted so ChatSecondarySidebar stays under the line cap.
function SidebarBody({
  empty,
  query,
  ready,
  transient,
  status,
  buckets,
  selectedId,
  onNewChat,
  onSelect,
  onNewChatInFolder,
  dispatch,
}: SidebarBodyProps) {
  const { pinned, inFolders, unfiled, visibleFolders } = buckets;
  if (empty) {
    return (
      <EmptySidebar onNewChat={onNewChat} ready={ready} transient={transient} status={status} />
    );
  }
  // UX-CHAT-030: searching with no matches used to render a blank body.
  if (
    query.trim().length > 0 &&
    pinned.length === 0 &&
    inFolders.length === 0 &&
    unfiled.length === 0
  ) {
    return <NoSearchResults query={query} />;
  }
  return (
    <SearchQueryProvider value={query}>
      <MultiSelectBar />
      <MarqueeShell>
        <ThreadList
          pinned={pinned}
          inFolders={inFolders}
          unfiled={unfiled}
          folders={visibleFolders}
          selectedId={selectedId}
          onSelect={onSelect}
          dispatch={dispatch}
          onNewChatInFolder={onNewChatInFolder}
        />
      </MarqueeShell>
    </SearchQueryProvider>
  );
}

// Wraps ThreadList with marquee-select. Pointerdown on empty space starts
// a drag rectangle; release adds every row whose bounding box intersects
// the rect to the multi-select set. Esc cancels.
function MarqueeShell({ children }: { readonly children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { containerRef, rect, onPointerDown, onPointerMove, onPointerUp } =
    useMarqueeSelect({
      onSelect: (ids) => {
        for (const id of ids) dispatch(toggleMultiSelectThread(id));
      },
    });
  return (
    <div
      ref={containerRef}
      className="relative"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {children}
      {rect && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-sm border border-accent bg-accent/15"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}
    </div>
  );
}

interface SearchHeaderProps {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly onClear: () => void;
  readonly onExit: () => void;
}

// Replaces the title bar while in search mode: an autofocused input that
// fills the row, with Clear (×) and Exit (back) affordances. Esc also exits.
function SearchHeader({ value, onChange, onClear, onExit }: SearchHeaderProps) {
  return (
    <div className="flex w-full items-center gap-2">
      <Icon icon={MagnifyingGlass} size="sm" className="shrink-0 text-fg-subtle" />
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onExit();
        }}
        placeholder="Search chats"
        aria-label="Search chats"
        className="flex-1 bg-transparent text-xs text-fg-default placeholder:text-fg-subtle focus:outline-none"
      />
      {value && (
        <Tooltip content="Clear" side="bottom">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Clear search"
            onClick={onClear}
          >
            <Icon icon={X} size="sm" />
          </Button>
        </Tooltip>
      )}
      <Tooltip content="Close search" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Close search"
          onClick={onExit}
          className="px-2 text-micro"
        >
          Done
        </Button>
      </Tooltip>
    </div>
  );
}

interface ThreadListProps {
  readonly pinned: readonly Thread[];
  readonly inFolders: readonly Thread[];
  readonly unfiled: readonly Thread[];
  readonly folders: ReturnType<typeof selectFolders>;
  readonly selectedId: ThreadId | null;
  readonly onSelect: (id: ThreadId) => void;
  readonly dispatch: ReturnType<typeof useAppDispatch>;
  readonly onNewChatInFolder: (id: FolderId) => void;
}

function ThreadList({ pinned, inFolders, unfiled, folders, selectedId, onSelect, dispatch, onNewChatInFolder }: ThreadListProps) {
  const showUnfiledTitle = folders.length > 0 || pinned.length > 0;
  // Always render the Unfiled section when at least one folder exists, even
  // if it is empty — otherwise dragging the last chat out of a folder has
  // no drop target. The section renders a "Drop here to unfile" affordance
  // when empty (handled inside UnfiledSection).
  const showUnfiledSection = unfiled.length > 0 || folders.length > 0;
  return (
    <div className="flex flex-col gap-2 px-2 py-2">
      {pinned.length > 0 && (
        <SectionList title="Pinned" threads={pinned} selectedId={selectedId} folders={folders} onSelect={onSelect} dispatch={dispatch} />
      )}
      {folders.map((f) => (
        <FolderRow
          key={f.id}
          folder={f}
          onToggle={() => dispatch(toggleFolderExpanded(f.id))}
          onRename={(id, name) => dispatch(renameFolder({ id, name }))}
          onDelete={() => void dispatch(deleteFolderThunk(f.id))}
          onSetColor={(color) => dispatch(setFolderColor({ id: f.id, color }))}
          onDropThread={(threadId) =>
            dispatch(moveThreadToFolder({ id: threadId, folderId: f.id }))
          }
          onNewChat={() => onNewChatInFolder(f.id)}
        >
          <FolderThreads
            threads={inFolders.filter((t) => t.folderId === f.id)}
            folders={folders}
            selectedId={selectedId}
            onSelect={onSelect}
            dispatch={dispatch}
          />
        </FolderRow>
      ))}
      {showUnfiledSection && (
        <UnfiledSection
          title={showUnfiledTitle ? 'Unfiled' : ''}
          threads={unfiled}
          selectedId={selectedId}
          folders={folders}
          onSelect={onSelect}
          dispatch={dispatch}
        />
      )}
    </div>
  );
}

interface UnfiledSectionProps {
  readonly title: string;
  readonly threads: readonly Thread[];
  readonly selectedId: ThreadId | null;
  readonly folders: ReturnType<typeof selectFolders>;
  readonly onSelect: (id: ThreadId) => void;
  readonly dispatch: ReturnType<typeof useAppDispatch>;
}

// Drop target: dragging a thread here clears its folderId.
function UnfiledSection({ title, threads, selectedId, folders, onSelect, dispatch }: UnfiledSectionProps) {
  // Counter-based DnD tracking — boolean state flickers when the cursor
  // crosses into a child element (onDragLeave fires for the parent on every
  // child enter). enter++/leave-- gives a stable highlight.
  const enterCount = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const onDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(THREAD_DRAG_TYPE)) return;
    enterCount.current += 1;
    if (enterCount.current === 1) setDragOver(true);
  };
  const onDragLeave = () => {
    enterCount.current = Math.max(0, enterCount.current - 1);
    if (enterCount.current === 0) setDragOver(false);
  };
  const reset = () => {
    enterCount.current = 0;
    setDragOver(false);
  };
  const isEmpty = threads.length === 0;
  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(THREAD_DRAG_TYPE)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        const id = e.dataTransfer.getData(THREAD_DRAG_TYPE);
        if (!id) return;
        e.preventDefault();
        reset();
        dispatch(moveThreadToFolder({ id: id as ThreadId, folderId: null }));
      }}
      className={cn(
        'rounded-md transition-colors',
        dragOver && 'ring-1 ring-accent ring-offset-0 bg-accent/10',
        isEmpty && 'min-h-[2rem]',
      )}
    >
      {isEmpty ? (
        <div className="px-2 py-2 text-caption text-fg-subtle">
          {title || 'Unfiled'}
          <span className="ml-2 italic opacity-70">drop here to unfile</span>
        </div>
      ) : (
        <SectionList
          title={title}
          threads={threads}
          selectedId={selectedId}
          folders={folders}
          onSelect={onSelect}
          dispatch={dispatch}
        />
      )}
    </div>
  );
}

function FolderThreads({ threads, folders, selectedId, onSelect, dispatch }: Omit<ThreadListProps, 'pinned' | 'inFolders' | 'unfiled' | 'onNewChatInFolder'> & { readonly threads: readonly Thread[] }) {
  if (threads.length === 0) {
    // Empty-folder state. The parent FolderRow already wires the drop
    // target on its <li>, so any drop on this body lands in the folder —
    // we just need to communicate that visually. Dashed border + the
    // recommendation copy gives the user the next-step prompt CLAUDE.md
    // empty-states need.
    return (
      <li className="rounded-md border border-dashed border-border-default px-2 py-2 text-caption text-fg-subtle">
        Empty — drag a chat here to file it.
      </li>
    );
  }
  return (
    <>
      {threads.map((t) => (
        <ThreadRowConnected
          key={t.id}
          thread={t}
          selected={t.id === selectedId}
          folders={folders}
          onSelect={() => onSelect(t.id)}
          dispatch={dispatch}
        />
      ))}
    </>
  );
}

interface SectionListProps {
  readonly title: string;
  readonly threads: readonly Thread[];
  readonly selectedId: ThreadId | null;
  readonly folders: ReturnType<typeof selectFolders>;
  readonly onSelect: (id: ThreadId) => void;
  readonly dispatch: ReturnType<typeof useAppDispatch>;
}

function SectionList({ title, threads, selectedId, folders, onSelect, dispatch }: SectionListProps) {
  return (
    <div className="flex flex-col">
      {title && (
        <div className="px-2 pb-1 pt-1 text-caption font-semibold uppercase tracking-wide text-fg-subtle">
          {title}
        </div>
      )}
      <ul className="flex flex-col gap-0.5">
        {threads.map((t) => (
          <ThreadRowConnected
            key={t.id}
            thread={t}
            selected={t.id === selectedId}
            folders={folders}
            onSelect={() => onSelect(t.id)}
            dispatch={dispatch}
          />
        ))}
      </ul>
    </div>
  );
}

interface ThreadRowConnectedProps {
  readonly thread: Thread;
  readonly selected: boolean;
  readonly folders: ReturnType<typeof selectFolders>;
  readonly onSelect: () => void;
  readonly dispatch: ReturnType<typeof useAppDispatch>;
}

function ThreadRowConnected({ thread, selected, folders, onSelect, dispatch }: ThreadRowConnectedProps) {
  const messages = useAppSelector((s: RootState) => selectMessagesForThread(thread.id)(s));
  const multiSelectedSet = useAppSelector(selectMultiSelectedThreadIds);
  const multiSelected = !!multiSelectedSet[thread.id];
  // Shift-click toggles multi-select membership. Plain click routes to the
  // thread (clearing any in-progress multi-select first so the user
  // doesn't have to manually deselect after focusing on a single chat).
  const handleSelect = (e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      e.preventDefault();
      dispatch(toggleMultiSelectThread(thread.id));
      return;
    }
    if (Object.keys(multiSelectedSet).length > 0) dispatch(clearMultiSelect());
    onSelect();
  };
  return (
    <ThreadRow
      thread={thread}
      selected={selected}
      multiSelected={multiSelected}
      folders={folders}
      onSelect={handleSelect}
      onRename={(id, title) => dispatch(renameThread({ id, title }))}
      onDelete={() => void dispatch(deleteThreadThunk(thread.id))}
      onPin={(pinned) => dispatch(pinThread({ id: thread.id, pinned }))}
      onDuplicate={() => dispatch(duplicateThread(thread.id))}
      onMoveToFolder={(folderId: FolderId | null) => dispatch(moveThreadToFolder({ id: thread.id, folderId }))}
      onExport={() => exportThread(thread, messages, 'markdown')}
    />
  );
}

// Visible only when ≥1 thread is in the multi-select set. Surfaces:
//   - Count + Cancel ("3 selected")
//   - Bulk pin / unpin (toggles to whichever majority is opposite)
//   - Move to folder (popover with folder list + Unfile)
//   - Bulk delete (with confirm dialog)
function MultiSelectBar() {
  const dispatch = useAppDispatch();
  const selectedSet = useAppSelector(selectMultiSelectedThreadIds);
  const count = useAppSelector(selectMultiSelectedCount);
  const folders = useAppSelector(selectFolders);
  const allThreads = useAppSelector(selectThreads);
  const [confirming, setConfirming] = useState(false);
  if (count === 0) return null;
  const ids = Object.keys(selectedSet) as ThreadId[];
  const selectedThreads = allThreads.filter((t) => selectedSet[t.id]);
  const allPinned = selectedThreads.length > 0 && selectedThreads.every((t) => t.pinned);
  const onBulkPin = () => {
    for (const id of ids) dispatch(pinThread({ id, pinned: !allPinned }));
  };
  const onBulkMove = (folderId: FolderId | null) => {
    for (const id of ids) dispatch(moveThreadToFolder({ id, folderId }));
    dispatch(clearMultiSelect());
  };
  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-border-default bg-bg-raised px-2 py-1.5">
      <span className="flex-1 text-caption text-fg-default">{count} selected</span>
      <Tooltip content={allPinned ? 'Unpin' : 'Pin'} side="bottom">
        <Button variant="ghost" size="sm" iconOnly aria-label={allPinned ? 'Unpin selected' : 'Pin selected'} onClick={onBulkPin}>
          <Icon icon={Plus} size="xs" weight="bold" />
        </Button>
      </Tooltip>
      <DropdownMenu>
        <Tooltip content="Move to folder" side="bottom">
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" iconOnly aria-label="Move selected to folder">
              <Icon icon={FolderPlus} size="xs" />
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuItem onSelect={() => onBulkMove(null)}>
            <span>Unfile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void dispatch(moveThreadsToNewFolderThunk(ids));
            }}
          >
            <Icon icon={FolderPlus} size="xs" />
            <span>Move to new folder…</span>
          </DropdownMenuItem>
          {folders.length > 0 && <div className="my-1 border-t border-border-default" />}
          {folders.map((f) => (
            <DropdownMenuItem key={f.id} onSelect={() => onBulkMove(f.id)}>
              <span>{f.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip content="Delete selected" side="bottom">
        <Button variant="ghost" size="sm" iconOnly aria-label="Delete selected" onClick={() => setConfirming(true)}>
          <Icon icon={X} size="xs" weight="bold" className="text-danger" />
        </Button>
      </Tooltip>
      <Button variant="ghost" size="sm" onClick={() => dispatch(clearMultiSelect())}>
        Cancel
      </Button>
      {confirming && (
        <ConfirmDialog
          title={`Delete ${count} chat${count === 1 ? '' : 's'}?`}
          message="The selected chats and their messages will be permanently removed. This can't be undone."
          confirmLabel={`Delete ${count}`}
          destructive
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            void dispatch(deleteThreadsThunk(ids));
            setConfirming(false);
          }}
        />
      )}
    </div>
  );
}

// Shown when a search query matches no threads. Answers "why is this
// empty" without a dead-end blank pane.
function NoSearchResults({ query }: { readonly query: string }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-m px-3 py-6 text-center"
      aria-label="No search results"
    >
      <Icon icon={MagnifyingGlass} size="lg" className="text-fg-subtle" />
      <p className="text-xs font-medium text-fg-default">No chats found</p>
      <p className="text-caption text-fg-muted">
        Nothing matches “{query.trim()}”. Try a different search.
      </p>
    </div>
  );
}

function HeaderActions({
  onOpenSearch,
  onNewChat,
  searchEnabled,
  ready,
}: {
  readonly onOpenSearch: () => void;
  readonly onNewChat: () => void;
  readonly searchEnabled: boolean;
  readonly ready: boolean;
}) {
  // UX-CHAT-028: the "More" Dots button had no onClick — a dead control. Removed
  // for minimum diff. The icon-only "New chat" affordance stays here as a
  // secondary entry point so power-users keep their familiar muscle memory; the
  // dominant entry is the full-width primary button below the title (UX-CHAT-006).
  // UX-CHAT-002: when no model is loaded the icon-only header button reads as
  // "open the picker" — we surface that intent via tooltip copy + aria-label
  // so the affordance never silently spawns an unusable thread.
  const tooltip = ready ? 'New chat' : 'Load a model to start a new chat';
  return (
    <>
      {searchEnabled && (
        <Tooltip content="Search chats" side="bottom">
          <Button variant="ghost" size="sm" iconOnly aria-label="Search chats" onClick={onOpenSearch}>
            <Icon icon={MagnifyingGlass} size="md" />
          </Button>
        </Tooltip>
      )}
      <Tooltip content={tooltip} side="bottom">
        <Button variant="ghost" size="sm" iconOnly aria-label={tooltip} onClick={onNewChat}>
          <Icon icon={NotePencil} size="md" />
        </Button>
      </Tooltip>
    </>
  );
}

// "New chat" is reachable via the compose icon in the section header, the
// welcome-screen CTA, and the empty-state CTA. The sub-header carries the
// "Create folder" action + a small sort menu (Recent / Alphabetical /
// Oldest).
//
// The previous visual treatment (ghost button, FolderPlus icon, "New
// folder" label, full-width row) read as a folder row indistinguishable
// from the actual folders in the list below — users couldn't tell the
// difference between the action and an existing folder named "New folder".
// Switch to the universal "create new" pattern: dashed accent-tinted
// outline + Plus icon + "Create folder" verb-first copy.
function SidebarPrimaryActions({
  onNewFolder,
  sort,
  sortOrder,
  onSortChange,
  onSortOrderChange,
}: {
  readonly onNewFolder: () => void;
  readonly sort: SidebarSort;
  readonly sortOrder: SidebarSortOrder;
  readonly onSortChange: (next: SidebarSort) => void;
  readonly onSortOrderChange: (next: SidebarSortOrder) => void;
}) {
  return (
    <div className="flex items-center gap-s">
      <button
        type="button"
        onClick={onNewFolder}
        className="flex h-auto flex-1 items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong px-2 py-1.5 text-xs text-fg-muted transition-colors hover:border-accent hover:bg-accent/10 hover:text-fg-accent"
      >
        <Icon icon={Plus} size="xs" weight="bold" />
        <span>Create folder</span>
      </button>
      <SortMenu
        sort={sort}
        sortOrder={sortOrder}
        onSortChange={onSortChange}
        onSortOrderChange={onSortOrderChange}
      />
    </div>
  );
}

// Sort options mirror the `@features/settings` SidebarSort union — the
// settings Chat panel and this menu now drive the same state.
const SORT_OPTIONS: readonly { value: SidebarSort; label: string }[] = [
  { value: 'date-created', label: 'Date created' },
  { value: 'date-modified', label: 'Date modified' },
  { value: 'name', label: 'Name' },
];

const ORDER_OPTIONS: readonly { value: SidebarSortOrder; label: string }[] = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];

function SortMenu({
  sort,
  sortOrder,
  onSortChange,
  onSortOrderChange,
}: {
  readonly sort: SidebarSort;
  readonly sortOrder: SidebarSortOrder;
  readonly onSortChange: (next: SidebarSort) => void;
  readonly onSortOrderChange: (next: SidebarSortOrder) => void;
}) {
  const dispatch = useAppDispatch();
  const compact = useAppSelector(selectChatListCompact);
  return (
    <DropdownMenu>
      <Tooltip content="View" side="top">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" iconOnly aria-label="View options">
            <Icon icon={ListBullets} size="sm" />
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <div className="px-2 py-1 text-caption font-semibold uppercase tracking-wide text-fg-subtle">
          Sort by
        </div>
        {SORT_OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt.value} onSelect={() => onSortChange(opt.value)}>
            <Icon
              icon={Check}
              size="xs"
              className={sort === opt.value ? 'text-fg-accent' : 'opacity-0'}
            />
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
        <div className="my-1 border-t border-border-default" />
        <div className="px-2 py-1 text-caption font-semibold uppercase tracking-wide text-fg-subtle">
          Order
        </div>
        {ORDER_OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt.value} onSelect={() => onSortOrderChange(opt.value)}>
            <Icon
              icon={Check}
              size="xs"
              className={sortOrder === opt.value ? 'text-fg-accent' : 'opacity-0'}
            />
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
        <div className="my-1 border-t border-border-default" />
        <DropdownMenuItem onSelect={() => dispatch(setChatListCompact(!compact))}>
          <Icon
            icon={Check}
            size="xs"
            className={compact ? 'text-fg-accent' : 'opacity-0'}
          />
          <span>Compact rows</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// UX-CHAT-007: the "no chats yet" state used to be a blank div. Now answers
// the two empty-state questions (why empty / what's the one click) using the
// shared `gap-3xl` rhythm. When no model is loaded, the CTA is "Load a model"
// (and clicking it opens the picker via openModelPickerThunk inside
// handleNewChat) — keeping clarity rule #1 ahead of friction rule #2.
function EmptySidebar({
  onNewChat,
  ready,
  transient,
  status,
}: {
  readonly onNewChat: () => void;
  readonly ready: boolean;
  readonly transient: boolean;
  readonly status: ModelLoadStatus;
}) {
  const ctaLabel = transient
    ? status === 'loading' ? 'Loading model…' : 'Ejecting…'
    : ready ? 'New chat' : 'Load a model';
  const subCopy = transient
    ? 'Hang tight — the chat unlocks when the model is ready.'
    : ready
      ? 'Start your first conversation. New chats appear here.'
      : 'Load a model first — then your conversations will live here.';
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3xl px-3 py-6 text-center"
      aria-label="No chats yet"
    >
      <Icon icon={ChatCircle} size="xl" className="text-fg-subtle" />
      <div className="flex flex-col items-center gap-m">
        <p className="text-xs font-medium text-fg-default">No chats yet</p>
        <p className="text-caption text-fg-muted">{subCopy}</p>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={onNewChat}
        disabled={transient}
        leadingIcon={<Icon icon={Plus} size="sm" weight="bold" />}
      >
        {ctaLabel}
      </Button>
    </div>
  );
}
