import {
  DotsThree,
  Folder as FolderIcon,
  FolderOpen,
  NotePencil,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
  Input,
} from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectPendingFolderRenameId, selectThreadCountInFolder } from '../../store/selectors';
import { finishFolderRename } from '../../store/slice';

import { HighlightText } from './HighlightText';
import { useSearchQuery } from './SearchQueryContext';

import type { Folder, FolderColor, FolderId } from '../../../domain/entities/Folder';
import type { ThreadId } from '../../../domain/value-objects/ThreadId';

const THREAD_DRAG_TYPE = 'application/x-lms-thread-id';

// Counter-based DnD highlight. Boolean state flickers when the cursor
// crosses into a child element (onDragLeave fires for the parent on every
// child enter). enter++/leave-- gives a stable highlight.
function useThreadDropZone(onDropThread: (id: ThreadId) => void) {
  const enterCount = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  return {
    dragOver,
    handlers: {
      onDragEnter(e: React.DragEvent) {
        if (!e.dataTransfer.types.includes(THREAD_DRAG_TYPE)) return;
        enterCount.current += 1;
        if (enterCount.current === 1) setDragOver(true);
      },
      onDragLeave() {
        enterCount.current = Math.max(0, enterCount.current - 1);
        if (enterCount.current === 0) setDragOver(false);
      },
      onDragOver(e: React.DragEvent) {
        if (!e.dataTransfer.types.includes(THREAD_DRAG_TYPE)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      },
      onDrop(e: React.DragEvent) {
        const id = e.dataTransfer.getData(THREAD_DRAG_TYPE);
        if (!id) return;
        e.preventDefault();
        enterCount.current = 0;
        setDragOver(false);
        onDropThread(id as ThreadId);
      },
    },
  };
}

interface FolderRowProps {
  readonly folder: Folder;
  readonly children: ReactNode;
  readonly onToggle: () => void;
  readonly onRename: (id: FolderId, name: string) => void;
  readonly onDelete: () => void;
  readonly onSetColor: (color: FolderColor | null) => void;
  readonly onDropThread: (threadId: ThreadId) => void;
  readonly onNewChat: () => void;
}

// Drives the auto-rename-on-create handshake with the slice. The slice flags
// `pendingFolderRenameId` when createFolder runs; this hook seeds the local
// `editing` state to true on mount when flagged (no first-render flash) and
// dispatches finishFolderRename in an effect so the slice clears the flag
// (otherwise it persists across reload, see BUGS-FOLDER-001).
function useAutoRenameOnCreate(folderId: FolderId) {
  const pendingRenameId = useAppSelector(selectPendingFolderRenameId);
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(pendingRenameId === folderId);
  useEffect(() => {
    if (pendingRenameId === folderId) {
      // setEditing is a no-op if already true from the init; the dispatch is
      // the load-bearing call here — it clears the persisted flag.
      setEditing(true);
      dispatch(finishFolderRename());
    }
  }, [pendingRenameId, folderId, dispatch]);
  return [editing, setEditing] as const;
}

export function FolderRow({
  folder,
  children,
  onToggle,
  onRename,
  onDelete,
  onSetColor,
  onDropThread,
  onNewChat,
}: FolderRowProps) {
  const [editing, setEditing] = useAutoRenameOnCreate(folder.id);
  const [draft, setDraft] = useState(folder.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { dragOver, handlers } = useThreadDropZone(onDropThread);
  const chatCount = useAppSelector(selectThreadCountInFolder(folder.id));

  const commit = () => {
    const next = draft.trim() || folder.name;
    if (next !== folder.name) onRename(folder.id, next);
    setEditing(false);
  };

  return (
    // Hoist DnD onto the wrapper so the body and child rows are also drop
    // targets — the previous setup highlighted only the header, which broke
    // when the user dragged over the expanded body.
    <li className="flex flex-col" {...handlers}>
      <FolderHeader
        folder={folder}
        editing={editing}
        draft={draft}
        dragOver={dragOver}
        onToggle={onToggle}
        onChangeDraft={setDraft}
        onCommit={commit}
        onCancelEdit={() => {
          setDraft(folder.name);
          setEditing(false);
        }}
        onStartRename={() => {
          setDraft(folder.name);
          setEditing(true);
        }}
        onAskDelete={() => setConfirmingDelete(true)}
        onNewChat={onNewChat}
        onSetColor={onSetColor}
      />
      {folder.expanded && (
        <ul className="ml-3 flex flex-col gap-0.5 pl-2">{children}</ul>
      )}
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete folder?"
          message={
            chatCount === 0
              ? `Delete the empty folder "${folder.name}"?`
              : `Delete "${folder.name}" and the ${chatCount === 1 ? '1 chat' : `${chatCount} chats`} inside? This can't be undone.`
          }
          confirmLabel={chatCount === 0 ? 'Delete folder' : `Delete folder + ${chatCount === 1 ? '1 chat' : `${chatCount} chats`}`}
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

interface FolderHeaderProps {
  readonly folder: Folder;
  readonly editing: boolean;
  readonly draft: string;
  readonly dragOver: boolean;
  readonly onToggle: () => void;
  readonly onChangeDraft: (value: string) => void;
  readonly onCommit: () => void;
  readonly onCancelEdit: () => void;
  readonly onStartRename: () => void;
  readonly onAskDelete: () => void;
  readonly onNewChat: () => void;
  readonly onSetColor: (color: FolderColor | null) => void;
}

function FolderHeader({
  folder,
  editing,
  draft,
  dragOver,
  onToggle,
  onChangeDraft,
  onCommit,
  onCancelEdit,
  onStartRename,
  onAskDelete,
  onNewChat,
  onSetColor,
}: FolderHeaderProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-fg-muted transition-colors',
        dragOver
          ? 'bg-accent/30 text-fg-default ring-1 ring-accent'
          : 'hover:bg-bg-raised/40 hover:text-fg-default',
      )}
    >
      {editing ? (
        // While editing, the toggle button is suppressed — the input becomes
        // a sibling of the icons (an input nested in a button is invalid
        // HTML, and Radix/React will swallow its focus when collapsed).
        <>
          <Icon
            icon={folder.expanded ? FolderOpen : FolderIcon}
            size="md"
            className={folderColorClass(folder.color)}
          />
          <RenameInput
            value={draft}
            onChange={onChangeDraft}
            onCommit={onCommit}
            onCancel={onCancelEdit}
          />
        </>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={folder.expanded}
          className="flex flex-1 items-center gap-1.5 truncate text-left"
        >
          <Icon
            icon={folder.expanded ? FolderOpen : FolderIcon}
            size="md"
            className={folderColorClass(folder.color)}
          />
          <FolderTitle name={folder.name} />
        </button>
      )}
      {!editing && (
        <FolderActionsMenu
          activeColor={folder.color ?? null}
          onRename={onStartRename}
          onDelete={onAskDelete}
          onNewChat={onNewChat}
          onSetColor={onSetColor}
        />
      )}
    </div>
  );
}

// Tailwind built-in palette utilities (no token leakage). Each entry maps
// a FolderColor to the icon's text-color class. `null`/missing falls back
// to the inherited muted color. Kept in lockstep with FolderColor — adding
// a new value requires a new entry here.
function folderColorClass(color: FolderColor | null | undefined): string | undefined {
  switch (color) {
    case 'blue':
      return 'text-blue-400';
    case 'green':
      return 'text-emerald-400';
    case 'purple':
      return 'text-violet-400';
    case 'orange':
      return 'text-orange-400';
    case 'red':
      return 'text-rose-400';
    case 'pink':
      return 'text-pink-400';
    default:
      return undefined;
  }
}

// Radix DropdownMenu restores focus to its trigger on close, racing past our
// autoFocus. requestAnimationFrame defers the focus+select to the next paint
// so the input wins the race and the existing name is highlighted ready to
// type-replace.
// Reads the active sidebar search query from context so we can highlight
// matched substrings in folder names without prop-drilling.
function FolderTitle({ name }: { readonly name: string }) {
  const query = useSearchQuery();
  return <HighlightText text={name} query={query} className="truncate" />;
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
      className="flex-1"
      aria-label="Rename folder"
    />
  );
}

// Curated palette mirrors `FolderColor`. Order matches the swatches the user
// sees in the menu — first row has the warm/cool variety; "Default" clears.
const COLOR_OPTIONS: ReadonlyArray<{
  readonly value: FolderColor | null;
  readonly label: string;
  readonly swatchClass: string;
}> = [
  { value: null, label: 'Default', swatchClass: 'bg-fg-subtle' },
  { value: 'blue', label: 'Blue', swatchClass: 'bg-blue-400' },
  { value: 'green', label: 'Green', swatchClass: 'bg-emerald-400' },
  { value: 'purple', label: 'Purple', swatchClass: 'bg-violet-400' },
  { value: 'orange', label: 'Orange', swatchClass: 'bg-orange-400' },
  { value: 'red', label: 'Red', swatchClass: 'bg-rose-400' },
  { value: 'pink', label: 'Pink', swatchClass: 'bg-pink-400' },
];

function FolderActionsMenu({
  activeColor,
  onRename,
  onDelete,
  onNewChat,
  onSetColor,
}: {
  readonly activeColor: FolderColor | null;
  readonly onRename: () => void;
  readonly onDelete: () => void;
  readonly onNewChat: () => void;
  readonly onSetColor: (color: FolderColor | null) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Folder actions"
          className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
        >
          <Icon icon={DotsThree} size="sm" weight="bold" />
        </Button>
      </DropdownMenuTrigger>
      {/* IA hierarchy, top → bottom:
            1. Primary actions  — "what do you do with this folder"
            2. Appearance       — color customization (subordinate)
            3. Destructive      — delete, separated visually to slow misclicks
          Separators carry the group boundaries; each group gets its own
          common region (Gestalt) so the eye scans groups before items. */}
      <DropdownMenuContent align="end" className="min-w-[220px] p-1">
        <DropdownMenuItem onSelect={onNewChat}>
          <Icon icon={NotePencil} size="xs" />
          <span>New chat in folder</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onRename}>
          <Icon icon={PencilSimple} size="xs" />
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ColorRow activeColor={activeColor} onSetColor={onSetColor} />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDelete} className="text-danger">
          <Icon icon={Trash} size="xs" />
          <span>Delete folder</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Inline color-swatch row inside the dropdown menu. Renders as a single
// menu item visually, but each swatch is its own button so a mouse can
// click one without committing the parent item. Keyboard nav still treats
// this as a single row — Tab moves to the next menu item, not between
// swatches; the trade-off is acceptable for a 7-cell affordance.
function ColorRow({
  activeColor,
  onSetColor,
}: {
  readonly activeColor: FolderColor | null;
  readonly onSetColor: (color: FolderColor | null) => void;
}) {
  return (
    <div className="px-2 py-2">
      <div className="px-1 text-[10px] font-medium uppercase tracking-wider text-fg-subtle">
        Color
      </div>
      <div className="mt-2 flex items-center gap-1.5 px-1">
        {COLOR_OPTIONS.map((opt) => {
          const selected = activeColor === opt.value;
          return (
            <button
              key={opt.value ?? 'default'}
              type="button"
              onClick={() => onSetColor(opt.value)}
              aria-label={opt.label}
              aria-pressed={selected}
              className={cn(
                // Larger hit target (16→18px) + tighter gap reads as a clean
                // row of equal-weight chips; selected gets a thicker accent
                // ring, unselected gets a subtle hover ring.
                'h-[18px] w-[18px] rounded-full transition-shadow',
                opt.swatchClass,
                selected
                  ? 'ring-2 ring-fg-default ring-offset-2 ring-offset-bg-raised'
                  : 'hover:ring-2 hover:ring-offset-2 hover:ring-border-strong hover:ring-offset-bg-raised',
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
