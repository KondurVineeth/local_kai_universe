import {
  FileText,
  FolderSimple,
  ImageSquare,
  Paperclip,
  Pencil,
  Trash,
} from '@phosphor-icons/react';
import { useState } from 'react';

import { Button, Icon, Textarea, Tooltip } from '@shared/ds/primitives';
import { useAutoFocus } from '@shared/hooks/useAutoFocus';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectIsThinkingModel,
  selectMessagesForThread,
  selectReasoningEnabledForThread,
} from '../../store/selectors';
import {
  deleteMessageThunk,
  editAndResendThunk,
  updateMessageThunk,
} from '../../store/thunks';

import { useChatAppearance } from './ChatAppearanceContext';

import type { AttachmentKind } from '../../../domain/entities/Attachment';
import type { Message } from '../../../domain/entities/Message';

export function UserMessage({
  message,
  readonly = false,
}: {
  readonly message: Message;
  readonly readonly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const dispatch = useAppDispatch();
  // BUG-CHAT-SPLIT-006: gate edit/delete on whether the thread is streaming.
  // Mid-stream user-message mutation orphans the assistant turn that's still
  // being generated against the OLD prompt.
  const threadMessages = useAppSelector(selectMessagesForThread(message.threadId));
  const threadStreaming = threadMessages.some((m) => m.streaming);
  // Carry the thread's reasoning setting into edit-and-resend so the
  // regenerated reply honors it (previously dropped → resend lost the
  // reasoning trace). Gated on the loaded model being a thinking model so
  // it agrees with the dock pill / simulator convention.
  const reasoningEnabled = useAppSelector(
    selectReasoningEnabledForThread(message.threadId),
  );
  const isThinkingModel = useAppSelector(selectIsThinkingModel);
  const { textClass, messagesStyle } = useChatAppearance();

  const save = () => {
    const next = draft.trim();
    if (next && next !== message.content) {
      // BUG-CHAT-SPLIT-013: persist via thunk so reloads see the edit.
      void dispatch(updateMessageThunk(message.threadId, message.id, next));
    }
    setEditing(false);
  };
  const saveAndResend = () => {
    const next = draft.trim();
    if (!next) return;
    void dispatch(
      editAndResendThunk(message.threadId, message.id, next, {
        reasoningEnabled: reasoningEnabled && isThinkingModel,
      }),
    );
    setEditing(false);
  };

  if (editing && !readonly) {
    return (
      <EditingFrame
        draft={draft}
        onChange={setDraft}
        onCancel={() => {
          setDraft(message.content);
          setEditing(false);
        }}
        onSave={save}
        onSaveAndResend={saveAndResend}
      />
    );
  }

  // Block style: a flat, left-aligned transcript row (no chat bubble).
  // Bubble style: the rounded raised-surface bubble, right-aligned.
  const block = messagesStyle === 'block';
  return (
    <div className={cn('group flex', block ? 'justify-start pt-3 first:pt-0' : 'justify-end')}>
      <div className={cn('flex flex-col gap-1', block ? 'w-full items-start' : 'items-end')}>
        <div
          className={cn(
            'max-w-full text-fg-default',
            textClass,
            block ? 'w-full' : 'rounded-lg bg-bg-raised px-3 py-2',
          )}
        >
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <MessageAttachments attachments={message.attachments} />
        )}
        {message.edited && (
          <span className="text-caption italic text-fg-subtle">edited</span>
        )}
        {!threadStreaming && !readonly && (
          <ActionRow
            onEdit={() => setEditing(true)}
            onDelete={() => void dispatch(deleteMessageThunk(message.threadId, message.id))}
          />
        )}
      </div>
    </div>
  );
}

interface EditingFrameProps {
  readonly draft: string;
  readonly onChange: (v: string) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
  readonly onSaveAndResend: () => void;
}

function EditingFrame({ draft, onChange, onCancel, onSave, onSaveAndResend }: EditingFrameProps) {
  const textareaRef = useAutoFocus<HTMLTextAreaElement>('end');
  return (
    <div className="flex justify-end">
      <div className="flex w-full max-w-[75%] flex-col gap-2">
        <Textarea
          ref={textareaRef}
          rows={3}
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Edit message"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={onSave} disabled={!draft.trim()}>
            Save
          </Button>
          <Button variant="primary" size="sm" onClick={onSaveAndResend} disabled={!draft.trim()}>
            Save &amp; re-send
          </Button>
        </div>
      </div>
    </div>
  );
}

const ATTACHMENT_ICON: Record<AttachmentKind, typeof Paperclip> = {
  file: Paperclip,
  image: ImageSquare,
  folder: FolderSimple,
  doc: FileText,
};

// Renders the attachments snapshotted onto a user message at send time.
// Read-only — these are part of the sent turn, not editable like the
// compose-strip chips.
function MessageAttachments({
  attachments,
}: {
  readonly attachments: NonNullable<Message['attachments']>;
}) {
  return (
    <div className="flex max-w-full flex-wrap justify-end gap-1.5">
      {attachments.map((a) => (
        <span
          key={a.id}
          className="inline-flex items-center gap-1 rounded-md bg-bg-raised px-1.5 py-0.5 text-caption text-fg-default"
        >
          <Icon icon={ATTACHMENT_ICON[a.kind]} size="xs" />
          <span className="max-w-[160px] truncate">{a.name}</span>
        </span>
      ))}
    </div>
  );
}

function ActionRow({ onEdit, onDelete }: { readonly onEdit: () => void; readonly onDelete: () => void }) {
  return (
    <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100">
      <Tooltip content="Edit" side="bottom">
        <Button variant="ghost" size="sm" iconOnly aria-label="Edit message" onClick={onEdit}>
          <Icon icon={Pencil} size="sm" />
        </Button>
      </Tooltip>
      <Tooltip content="Delete" side="bottom">
        <Button variant="ghost" size="sm" iconOnly aria-label="Delete message" onClick={onDelete}>
          <Icon icon={Trash} size="sm" />
        </Button>
      </Tooltip>
    </div>
  );
}
