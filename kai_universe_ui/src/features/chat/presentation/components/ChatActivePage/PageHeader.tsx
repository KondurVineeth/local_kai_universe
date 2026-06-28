import {
  CaretDown,
  Cpu,
  DotsThree,
  DownloadSimple,
  FileText,
  PencilSimple,
  PushPin,
  PushPinSlash,
  SquaresFour,
  Trash,
  X,
} from '@phosphor-icons/react';
import { useState } from 'react';

import { selectLoadedModelId } from '@features/shell';
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
  Tooltip,
} from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { exportThread } from '../../lib/exportThread';
import { selectMessagesForThread, selectSplitThreadId } from '../../store/selectors';
import { pinThread, setSplitThread } from '../../store/slice';
import { deleteThreadThunk, openModelPickerThunk } from '../../store/thunks';

import type { Thread } from '../../../domain/entities/Thread';

interface PageHeaderProps {
  readonly thread: Thread;
  readonly onRename: () => void;
}

// Tab Bar Right Actions live in this header. Pin/unpin, split-view toggle,
// export menu, and a More menu with rename + delete (delete is gated by a
// confirm dialog — destructive + irreversible).
//
// SPLIT-012: clicking the title text opens the rename dialog. The active-
// chat model picker is now mounted here too (was a documented TODO) — it
// surfaces the loaded model and re-uses the shell's global picker via
// `openModelPickerThunk` rather than relocating the picker itself.
export function PageHeader({ thread, onRename }: PageHeaderProps) {
  const dispatch = useAppDispatch();
  const splitId = useAppSelector(selectSplitThreadId);
  const messages = useAppSelector(selectMessagesForThread(thread.id));
  const loadedModelId = useAppSelector(selectLoadedModelId);
  const splitOn = splitId !== null;
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const onExport = (format: 'markdown' | 'json') => exportThread(thread, messages, format);

  return (
    <div className="flex h-10 items-center justify-between gap-2 border-b border-border-default bg-bg-base px-4">
      <button
        type="button"
        onClick={onRename}
        aria-label="Rename chat"
        className="min-w-0 flex-1 truncate text-left text-sm font-medium text-fg-default hover:text-fg-default focus:outline-none focus-visible:ring-2 focus-visible:ring-border-active rounded"
      >
        {thread.title}
      </button>
      <ModelPickerButton
        modelId={loadedModelId}
        onClick={() => dispatch(openModelPickerThunk())}
      />
      <div className="flex items-center gap-1">
        <PinToggle
          pinned={!!thread.pinned}
          onToggle={() => dispatch(pinThread({ id: thread.id, pinned: !thread.pinned }))}
        />
        <SplitToggle
          on={splitOn}
          onToggle={() => dispatch(setSplitThread(splitOn ? null : thread.id))}
        />
        <ExportMenu onExport={onExport} />
        <MoreMenu
          onRename={onRename}
          onAskDelete={() => setConfirmingDelete(true)}
        />
      </div>
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete chat?"
          message={`"${thread.title}" and its messages will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          destructive
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            void dispatch(deleteThreadThunk(thread.id));
            setConfirmingDelete(false);
          }}
        />
      )}
    </div>
  );
}

// Active-chat model picker. Shows the loaded model id (or a "load a model"
// prompt) and opens the shell's global picker on click.
function ModelPickerButton({
  modelId,
  onClick,
}: {
  readonly modelId: string | null;
  readonly onClick: () => void;
}) {
  return (
    <Tooltip content={modelId ? 'Change model' : 'Load a model'} side="bottom">
      <button
        type="button"
        onClick={onClick}
        aria-label={modelId ? `Model: ${modelId}. Change model` : 'Load a model'}
        className="inline-flex max-w-[220px] items-center gap-1 rounded-md border border-border-default bg-bg-raised px-2 py-1 text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg-default"
      >
        <Icon icon={Cpu} size="xs" />
        <span className="truncate">{modelId ?? 'Load a model'}</span>
        <Icon icon={CaretDown} size="xs" />
      </button>
    </Tooltip>
  );
}

function PinToggle({ pinned, onToggle }: { readonly pinned: boolean; readonly onToggle: () => void }) {
  return (
    <Tooltip content={pinned ? 'Unpin' : 'Pin'} side="bottom">
      <Button variant="ghost" size="sm" iconOnly aria-label={pinned ? 'Unpin chat' : 'Pin chat'} onClick={onToggle}>
        <Icon icon={pinned ? PushPinSlash : PushPin} size="sm" />
      </Button>
    </Tooltip>
  );
}

function SplitToggle({ on, onToggle }: { readonly on: boolean; readonly onToggle: () => void }) {
  return (
    <Tooltip content={on ? 'Close split' : 'Split view'} side="bottom">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={on ? 'Close split view' : 'Open split view'}
        onClick={onToggle}
      >
        <Icon icon={on ? X : SquaresFour} size="sm" />
      </Button>
    </Tooltip>
  );
}

function ExportMenu({ onExport }: { readonly onExport: (format: 'markdown' | 'json') => void }) {
  return (
    <DropdownMenu>
      <Tooltip content="Export" side="bottom">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" iconOnly aria-label="Export chat">
            <Icon icon={DownloadSimple} size="sm" />
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuLabel>Export as</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onExport('markdown')}>
          <Icon icon={FileText} size="xs" />
          <span>Markdown (.md)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onExport('json')}>
          <Icon icon={FileText} size="xs" />
          <span>JSON (.json)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MoreMenu({
  onRename,
  onAskDelete,
}: {
  readonly onRename: () => void;
  readonly onAskDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" iconOnly aria-label="More chat actions">
          <Icon icon={DotsThree} size="sm" weight="bold" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuItem onSelect={onRename}>
          <Icon icon={PencilSimple} size="xs" />
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onAskDelete} className="text-danger">
          <Icon icon={Trash} size="xs" />
          <span>Delete chat</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
