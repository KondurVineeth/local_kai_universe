import {
  Copy,
  DotsThree,
  DownloadSimple,
  Folder as FolderIcon,
  PencilSimple,
  PushPin,
  PushPinSlash,
  Trash,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
  Input,
} from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppSelector } from '@shared/store/hooks';

import { selectChatListCompact } from '../../store/selectors';

import { HighlightText } from './HighlightText';
import { useSearchQuery } from './SearchQueryContext';

import type { Folder, FolderId } from '../../../domain/entities/Folder';
import type { Thread } from '../../../domain/entities/Thread';
import type { ThreadId } from '../../../domain/value-objects/ThreadId';

const THREAD_DRAG_TYPE = 'application/x-lms-thread-id';

interface ThreadRowProps {
  readonly thread: Thread;
  readonly selected: boolean;
  // Multi-selection visual flag — the row paints an accent ring when in
  // the bulk-select set. Independent from `selected` (the routed thread
  // can also be in the multi-select set).
  readonly multiSelected: boolean;
  readonly folders: readonly Folder[];
  // Event-bearing select handler so the parent can branch on shift-click
  // (toggle multi-select) vs plain click (route to thread).
  readonly onSelect: (e: React.MouseEvent) => void;
  readonly onRename: (id: ThreadId, title: string) => void;
  readonly onDelete: () => void;
  readonly onPin: (pinned: boolean) => void;
  readonly onDuplicate: () => void;
  readonly onMoveToFolder: (folderId: FolderId | null) => void;
  readonly onExport: () => void;
}

export function ThreadRow({
  thread,
  selected,
  multiSelected,
  folders,
  onSelect,
  onRename,
  onDelete,
  onPin,
  onDuplicate,
  onMoveToFolder,
  onExport,
}: ThreadRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(thread.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const commit = () => {
    const next = draft.trim() || thread.title;
    if (next !== thread.title) onRename(thread.id, next);
    setEditing(false);
  };

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(THREAD_DRAG_TYPE, thread.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  if (editing) {
    return (
      <li className="px-1">
        <RenameInput
          value={draft}
          onChange={setDraft}
          onCommit={commit}
          onCancel={() => {
            setDraft(thread.title);
            setEditing(false);
          }}
        />
      </li>
    );
  }
  return (
    <li draggable onDragStart={onDragStart} data-thread-id={thread.id}>
      <RowDisplay
        thread={thread}
        selected={selected}
        multiSelected={multiSelected}
        folders={folders}
        onSelect={onSelect}
        onStartRename={() => setEditing(true)}
        onAskDelete={
          thread.messageCount === 0 ? null : () => setConfirmingDelete(true)
        }
        onPin={onPin}
        onDuplicate={onDuplicate}
        onMoveToFolder={onMoveToFolder}
        onExport={onExport}
      />
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete chat?"
          message={`"${thread.title}" and its messages will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          destructive
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            onDelete();
            setConfirmingDelete(false);
          }}
        />
      )}
    </li>
  );
}

function RenameInput({
  value,
  onChange,
  onCommit,
  onCancel,
}: {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly onCommit: () => void;
  readonly onCancel: () => void;
}) {
  // Radix DropdownMenu restores focus to its trigger on close — that runs
  // after our autoFocus, so the input loses focus immediately. Re-focusing
  // and selecting on the next frame wins the race.
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <Input
      inputSize="sm"
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommit();
        else if (e.key === 'Escape') onCancel();
      }}
      className="w-full"
      aria-label="Rename chat"
    />
  );
}

interface RowDisplayProps {
  readonly thread: Thread;
  readonly selected: boolean;
  readonly multiSelected: boolean;
  readonly folders: readonly Folder[];
  readonly onSelect: (e: React.MouseEvent) => void;
  readonly onStartRename: () => void;
  // null = thread is empty and would just respawn via createThread's de-dupe
  // rule, so the menu hides Delete entirely instead of exposing a no-op.
  readonly onAskDelete: (() => void) | null;
  readonly onPin: (pinned: boolean) => void;
  readonly onDuplicate: () => void;
  readonly onMoveToFolder: (folderId: FolderId | null) => void;
  readonly onExport: () => void;
}

function RowDisplay({
  thread,
  selected,
  multiSelected,
  folders,
  onSelect,
  onStartRename,
  onAskDelete,
  onPin,
  onDuplicate,
  onMoveToFolder,
  onExport,
}: RowDisplayProps) {
  return (
    <RowShell selected={selected} multiSelected={multiSelected}>
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={onStartRename}
        className="flex flex-1 items-center gap-1.5 truncate text-left"
      >
        {thread.pinned && <Icon icon={PushPin} size="xs" weight="fill" className="shrink-0" />}
        <ThreadTitle title={thread.title} />
      </button>
      <RowActionsMenu
        pinned={!!thread.pinned}
        folders={folders}
        currentFolderId={thread.folderId ?? null}
        onRename={onStartRename}
        onDelete={onAskDelete}
        onPin={onPin}
        onDuplicate={onDuplicate}
        onMoveToFolder={onMoveToFolder}
        onExport={onExport}
      />
    </RowShell>
  );
}

// The row's outer chrome (selection bg, multi-select ring, padding). Reads
// the chatListCompact preference so dense mode trims vertical padding.
function RowShell({
  selected,
  multiSelected,
  children,
}: {
  readonly selected: boolean;
  readonly multiSelected: boolean;
  readonly children: React.ReactNode;
}) {
  const compact = useAppSelector(selectChatListCompact);
  return (
    <div
      className={cn(
        'group flex w-full items-center gap-1 rounded-md px-2 text-xs',
        compact ? 'py-0.5' : 'py-1.5',
        selected
          ? 'bg-bg-raised text-fg-default'
          : 'text-fg-muted hover:bg-bg-raised/60 hover:text-fg-default',
        multiSelected && 'ring-1 ring-accent ring-inset',
      )}
    >
      {children}
    </div>
  );
}

// Reads the active sidebar search query from context so we don't drill it
// through the whole render tree just for the highlight effect.
function ThreadTitle({ title }: { readonly title: string }) {
  const query = useSearchQuery();
  return <HighlightText text={title} query={query} className="truncate" />;
}

interface RowActionsMenuProps {
  readonly pinned: boolean;
  readonly folders: readonly Folder[];
  readonly currentFolderId: FolderId | null;
  readonly onRename: () => void;
  readonly onDelete: (() => void) | null;
  readonly onPin: (pinned: boolean) => void;
  readonly onDuplicate: () => void;
  readonly onMoveToFolder: (folderId: FolderId | null) => void;
  readonly onExport: () => void;
}

function RowActionsMenu({
  pinned,
  folders,
  currentFolderId,
  onRename,
  onDelete,
  onPin,
  onDuplicate,
  onMoveToFolder,
  onExport,
}: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Chat actions"
          className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
        >
          <Icon icon={DotsThree} size="sm" weight="bold" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] max-h-[60vh] overflow-y-auto">
        <DropdownMenuItem onSelect={onRename}>
          <Icon icon={PencilSimple} size="xs" />
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onPin(!pinned)}>
          <Icon icon={pinned ? PushPinSlash : PushPin} size="xs" />
          <span>{pinned ? 'Unpin' : 'Pin'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}>
          <Icon icon={Copy} size="xs" />
          <span>Duplicate</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExport}>
          <Icon icon={DownloadSimple} size="xs" />
          <span>Export</span>
        </DropdownMenuItem>
        {(() => {
          const otherFolders = folders.filter((f) => f.id !== currentFolderId);
          const hasMoveTargets = currentFolderId !== null || otherFolders.length > 0;
          if (!hasMoveTargets) return null;
          return (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide">
                Move to folder
              </DropdownMenuLabel>
              {currentFolderId !== null && (
                <DropdownMenuItem onSelect={() => onMoveToFolder(null)}>
                  <Icon icon={FolderIcon} size="xs" />
                  <span>Remove from folder</span>
                </DropdownMenuItem>
              )}
              {otherFolders.map((f) => (
                <DropdownMenuItem key={f.id} onSelect={() => onMoveToFolder(f.id)}>
                  <Icon icon={FolderIcon} size="xs" />
                  <span className="truncate">{f.name}</span>
                </DropdownMenuItem>
              ))}
            </>
          );
        })()}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-danger">
              <Icon icon={Trash} size="xs" />
              <span>Delete</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
