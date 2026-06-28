import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { selectShowGenInfo } from '@features/settings';
import { Button, Textarea } from '@shared/ds/primitives';
import { useAutoFocus } from '@shared/hooks/useAutoFocus';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectIsThinkingModel,
  selectMessagesForThread,
  selectReasoningEnabledForThread,
} from '../../store/selectors';
import {
  branchFromMessageThunk,
  continueThunk,
  deleteMessageThunk,
  regenerateThunk,
  updateMessageThunk,
} from '../../store/thunks';

import { useChatAppearance } from './ChatAppearanceContext';
import { DraftHighlightedBody } from './DraftHighlightedBody';
import { MarkdownBody } from './MarkdownBody';
import { MessageActions } from './MessageActions';
import { MessageMetrics } from './MessageMetrics';
import { ReasoningBlock } from './ReasoningBlock';

import type { Message } from '../../../domain/entities/Message';

// Settings: "Show generation info" — 'all' shows metrics on every reply,
// 'last-message-only' just the latest, 'none' hides them.
function useShowMetrics(
  threadMessages: readonly Message[],
  messageId: Message['id'],
): boolean {
  const showGenInfo = useAppSelector(selectShowGenInfo);
  if (showGenInfo === 'none') return false;
  if (showGenInfo === 'all') return true;
  const last = threadMessages[threadMessages.length - 1];
  return !!last && last.id === messageId;
}

// Per-thread reasoning toggle, gated on the loaded model being a "thinking"
// model so regenerate agrees with the dock pill / simulator convention.
function useEffectiveReasoning(threadId: Message['threadId']): boolean {
  const reasoningEnabled = useAppSelector(selectReasoningEnabledForThread(threadId));
  const isThinkingModel = useAppSelector(selectIsThinkingModel);
  return reasoningEnabled && isThinkingModel;
}

export function AssistantMessage({
  message,
  readonly = false,
}: {
  readonly message: Message;
  readonly readonly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  // BUG-CHAT-SPLIT-006/008: gate destructive + restart UI on whether ANY
  // message in the thread is streaming (not just this one).
  const threadMessages = useAppSelector(selectMessagesForThread(message.threadId));
  const threadStreaming = threadMessages.some((m) => m.streaming);
  const showMetrics = useShowMetrics(threadMessages, message.id);
  const effectiveReasoning = useEffectiveReasoning(message.threadId);

  const onCopy = () => {
    void navigator.clipboard?.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const onRegenerate = () => {
    if (threadStreaming) return;
    void dispatch(
      regenerateThunk(message.threadId, message.id, { reasoningEnabled: effectiveReasoning }),
    );
  };
  const onContinue = () => {
    if (threadStreaming) return;
    void dispatch(continueThunk(message.threadId, message.id));
  };
  // SPLIT-014: Continue only when the turn didn't end naturally. Dead
  // `maxTokens` reason removed — the simulator uses 'Length cap reached'.
  const canContinue =
    message.stopReason === 'User cancelled' ||
    message.stopReason === 'Length cap reached' ||
    message.stopReason === 'Interrupted by reload';
  const onBranch = async () => {
    const result = await dispatch(branchFromMessageThunk(message.threadId, message.id));
    if (typeof result === 'string') navigate(`/chat/${result}`);
  };
  const saveEdit = () => {
    const next = draft.trim();
    // BUG-CHAT-SPLIT-013: persist via thunk so reloads see the edit.
    if (next && next !== message.content) {
      void dispatch(updateMessageThunk(message.threadId, message.id, next));
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(message.content);
    setEditing(false);
  };
  const onEdit = () => {
    if (!threadStreaming) setEditing(true);
  };
  const onDelete = () => {
    if (threadStreaming) return;
    void dispatch(deleteMessageThunk(message.threadId, message.id));
  };

  if (editing && !readonly) {
    return (
      <EditingFrame draft={draft} onChange={setDraft} onSave={saveEdit} onCancel={cancelEdit} />
    );
  }

  return (
    <Display
      message={message}
      copied={copied}
      threadStreaming={threadStreaming}
      readonly={readonly}
      showMetrics={showMetrics}
      onCopy={onCopy}
      onRegenerate={onRegenerate}
      onContinue={canContinue ? onContinue : undefined}
      onBranch={() => void onBranch()}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

interface DisplayProps {
  readonly message: Message;
  readonly copied: boolean;
  readonly threadStreaming: boolean;
  readonly readonly: boolean;
  readonly showMetrics: boolean;
  readonly onCopy: () => void;
  readonly onRegenerate: () => void;
  readonly onContinue: (() => void) | undefined;
  readonly onBranch: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

function Display({
  message,
  copied,
  threadStreaming,
  readonly,
  showMetrics,
  onCopy,
  onRegenerate,
  onContinue,
  onBranch,
  onEdit,
  onDelete,
}: DisplayProps) {
  const { textClass, viewMode, messagesStyle } = useChatAppearance();
  return (
    <div className={cn('group flex flex-col', messagesStyle === 'block' && 'pt-3 first:pt-0')}>
      {message.modelName && (
        <span className="text-xs text-fg-subtle">{message.modelName}</span>
      )}
      {message.reasoningTrace && (
        <div className="mt-2">
          <ReasoningBlock
            messageId={message.id}
            trace={message.reasoningTrace}
            elapsedMs={message.reasoningElapsedMs}
            isStreaming={message.streaming}
            hasBody={message.content.length > 0}
          />
        </div>
      )}
      <div className={cn('mt-4 leading-relaxed text-fg-default', textClass)}>
        {message.streaming && message.content.length === 0 ? (
          <GeneratingSkeleton />
        ) : message.visualizedDraft ? (
          <DraftHighlightedBody content={message.content} streaming={message.streaming} />
        ) : viewMode === 'plain' ? (
          // Plain view mode: render the raw assistant text with no markdown
          // formatting (no headings, lists, code fences) — just whitespace.
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <MarkdownBody content={message.content} streaming={message.streaming} />
        )}
      </div>
      {message.edited && !message.streaming && (
        <span className="mt-1 text-caption italic text-fg-subtle">edited</span>
      )}
      {!message.streaming && (
        <>
          {showMetrics && (
            <div className="mt-6">
              <MessageMetrics message={message} streaming={message.streaming} />
            </div>
          )}
          <div className="mt-2">
            <MessageActions
              onCopy={onCopy}
              copied={copied}
              {...(readonly
                ? {}
                : {
                    onBranch,
                    ...(threadStreaming
                      ? {}
                      : {
                          onRegenerate,
                          onContinue,
                          onEdit,
                          onDelete,
                        }),
                  })}
            />
          </div>
        </>
      )}
    </div>
  );
}

// BUG-CHAT-FEED-018: before the first chunk lands, an assistant bubble had
// zero content and rendered as a blank box. Show an animated "Generating…"
// placeholder so the streaming state reads as deliberate.
function GeneratingSkeleton() {
  return (
    <div
      className="flex items-center gap-2 text-xs text-fg-subtle"
      aria-live="polite"
    >
      <span className="inline-flex gap-1" aria-hidden>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-subtle [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-subtle [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-subtle [animation-delay:300ms]" />
      </span>
      <span>Generating…</span>
    </div>
  );
}

function EditingFrame({
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  readonly draft: string;
  readonly onChange: (v: string) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}) {
  const textareaRef = useAutoFocus<HTMLTextAreaElement>('end');
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        ref={textareaRef}
        rows={6}
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Edit assistant message"
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={onSave} disabled={!draft.trim()}>
          Save
        </Button>
      </div>
    </div>
  );
}
