import { ArrowUp, Stop } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { selectShiftEnterToSend } from '@features/settings';
import { selectModelLoadStatus, setRightPanelOpenForRoute } from '@features/shell';
import { Button, Icon, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  requestPanelScroll,
  setInferenceTab,
  setPanelExpanded,
} from '../../store/configSlice';
import {
  selectAttachmentsForThread,
  selectDraftForThread,
  selectIsThinkingModel,
  selectMessagesForThread,
} from '../../store/selectors';
import { addAttachment, clearAttachments, clearDraft, setDraft } from '../../store/slice';
import { clearThreadThunk, regenerateThunk } from '../../store/thunks';

import { AttachFilePopover } from './AttachFilePopover';
import { AttachmentChipStrip } from './AttachmentChipStrip';
import { ContextUsageDial } from './ContextUsageDial';
import { IntegrationsPopover } from './IntegrationsPopover';
import { MentionPopover } from './MentionPopover';
import { ReasoningTogglePill } from './ReasoningTogglePill';
import { SlashCommandPopover, type SlashCommand } from './SlashCommandPopover';

import type { Attachment, AttachmentKind } from '../../../domain/entities/Attachment';
import type { Message } from '../../../domain/entities/Message';
import type { ThreadId } from '../../../domain/value-objects/ThreadId';

interface ChatInputDockProps {
  readonly threadId: ThreadId;
  // Receives the trimmed draft text (may be empty when only attachments are
  // queued — the parent decides whether/how to send).
  readonly onSend: (text: string) => void;
  readonly onStop: () => void;
  // True while a stream is in flight on this thread. The Send button morphs
  // into Stop in this state. Renamed from `disabled` (BUG-CHAT-COMPOSE-001) so
  // a future caller passing `disabled=true` for "no model loaded" doesn't
  // silently turn Send into Stop and call onStop on click.
  readonly streaming: boolean;
  readonly reasoningEnabled: boolean;
  readonly onReasoningToggle: () => void;
  readonly contextUsagePct: number;
}

// Map a File's MIME type to our domain AttachmentKind. Unknown MIMEs fall back
// to `file` so paste/drop never silently drops content.
function kindFromMime(mime: string): AttachmentKind {
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'doc';
  if (mime.startsWith('text/') || mime === 'application/json') return 'doc';
  return 'file';
}

function newAttachmentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `att_${crypto.randomUUID()}`;
  }
  return `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

function attachmentFromFile(file: File): Attachment {
  return {
    id: newAttachmentId(),
    name: file.name,
    kind: kindFromMime(file.type),
    sizeBytes: file.size,
  };
}

// Auto-resize the textarea on draft change up to a 200px cap. Inner scroll
// (overflow-y-auto on the element) keeps the caret in view past the cap.
function useAutoResize(
  taRef: React.MutableRefObject<HTMLTextAreaElement | null>,
  draft: string,
) {
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [taRef, draft]);
}

// Restore focus to the textarea when the active thread changes
// (BUG-CHAT-COMPOSE-013).
function useFocusOnThreadChange(
  taRef: React.MutableRefObject<HTMLTextAreaElement | null>,
  threadId: ThreadId,
) {
  useEffect(() => {
    taRef.current?.focus();
  }, [taRef, threadId]);
}

// Coalesces the send-gate + send-action + Enter handler. Returning a ref and
// the callbacks lets the component stay short while the rules around IME and
// whitespace-Enter live in one place.
function useComposer(
  threadId: ThreadId,
  draft: string,
  attachments: readonly Attachment[],
  streaming: boolean,
  onSend: (text: string) => void,
  taRef: React.MutableRefObject<HTMLTextAreaElement | null>,
) {
  const dispatch = useAppDispatch();
  const composingRef = useRef(false);
  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 || attachments.length > 0;
  // Settings: when "Shift+Enter to send" is on, the send/newline keys swap —
  // Shift+Enter sends, plain Enter inserts a newline.
  const shiftEnterToSend = useAppSelector(selectShiftEnterToSend);

  const send = useCallback(() => {
    if (!canSend || streaming) return;
    onSend(trimmed);
    // Clear draft + attachments AFTER parent has the text — attachments must
    // not leak across messages (BUG-CHAT-COMPOSE-004).
    dispatch(clearDraft(threadId));
    dispatch(clearAttachments(threadId));
    taRef.current?.focus();
  }, [canSend, streaming, onSend, trimmed, dispatch, threadId, taRef]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME guard — CJK candidate-commit Enter must NOT send
    // (BUG-CHAT-COMPOSE-005). 229 is the legacy "compose-in-progress" keyCode.
    if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }
    if (e.key !== 'Enter') return;
    // `sendCombo` is true when the pressed Enter (with/without Shift) is the
    // configured send gesture.
    const sendCombo = shiftEnterToSend ? e.shiftKey : !e.shiftKey;
    if (sendCombo) {
      // Whitespace-only Enter falls through harmlessly (BUG-CHAT-COMPOSE-018).
      if (!canSend) return;
      e.preventDefault();
      send();
    }
  };

  const onCompositionStart = () => {
    composingRef.current = true;
  };
  const onCompositionEnd = () => {
    composingRef.current = false;
  };

  return { canSend, send, onKeyDown, onCompositionStart, onCompositionEnd };
}

// Extracted file-paste + drag-drop ingestion (BUG-CHAT-COMPOSE-007/008). The
// hook keeps the dock body under the 80-line cap; both handlers preventDefault
// only when files were actually consumed so plain-text paste / external drag
// targets keep working.
//
// `dragActive` flips while a file is hovering over the drop zone. Counter-
// based (enter++/leave--) so the boolean doesn't flicker as the cursor
// crosses into child elements (bubbles fire dragLeave for the parent on
// every child enter).
function useFileIngestion(threadId: ThreadId) {
  const dispatch = useAppDispatch();
  const enterCountRef = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const ingest = (files: FileList | null | undefined) => {
    if (!files || files.length === 0) return false;
    for (const file of Array.from(files)) {
      dispatch(addAttachment({ threadId, attachment: attachmentFromFile(file) }));
    }
    return true;
  };
  const isFileDrag = (e: React.DragEvent<HTMLDivElement>) =>
    !!e.dataTransfer?.types?.includes('Files');
  return {
    dragActive,
    onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (ingest(e.clipboardData?.files)) e.preventDefault();
    },
    onDragEnter: (e: React.DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(e)) return;
      enterCountRef.current += 1;
      setDragActive(true);
    },
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
      if (isFileDrag(e)) e.preventDefault();
    },
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(e)) return;
      enterCountRef.current = Math.max(0, enterCountRef.current - 1);
      if (enterCountRef.current === 0) setDragActive(false);
    },
    onDrop: (e: React.DragEvent<HTMLDivElement>) => {
      enterCountRef.current = 0;
      setDragActive(false);
      if (ingest(e.dataTransfer?.files)) e.preventDefault();
    },
  };
}

export function ChatInputDock({
  threadId,
  onSend,
  onStop,
  streaming,
  reasoningEnabled,
  onReasoningToggle,
  contextUsagePct,
}: ChatInputDockProps) {
  const dispatch = useAppDispatch();
  const draft = useAppSelector(selectDraftForThread(threadId));
  const attachments = useAppSelector(selectAttachmentsForThread(threadId));
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  // Gate send on the model lifecycle: only `loaded` unlocks the dock.
  // Status (not just `loadedModelId`) avoids the bug where the slice
  // sets the id at `modelLoadStarted` time and the dock unlocks during
  // the load delay.
  const modelStatus = useAppSelector(selectModelLoadStatus);
  const noModel = modelStatus !== 'loaded';

  useAutoResize(taRef, draft);
  useFocusOnThreadChange(taRef, threadId);

  const { canSend, send, onKeyDown, onCompositionStart, onCompositionEnd } =
    useComposer(threadId, draft, attachments, streaming || noModel, onSend, taRef);

  const { onPaste, onDragEnter, onDragOver, onDragLeave, onDrop, dragActive } =
    useFileIngestion(threadId);

  const messages = useAppSelector(selectMessagesForThread(threadId));
  const { mentionOpen, openMention, closeMention, insertMention } = useMention(
    threadId,
    draft,
    taRef,
    dispatch,
  );
  const { slashOpen, slashQuery, runSlash, dismissSlash, slashDisabledReasons } =
    useSlashCommands(threadId, draft, messages, dispatch);

  // Send is disabled when not streaming AND (nothing to send OR no model
  // loaded). While streaming the primary button morphs to Stop and stays
  // clickable so the user can cancel mid-load.
  const sendDisabled = !streaming && (!canSend || noModel);
  const onPrimaryClick = streaming ? onStop : send;
  const placeholder = noModel ? 'Select a model to start chatting' : 'Send a message to the model...';
  return (
    <div
      className="bg-bg-base p-3"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Width-locked to match the message feed (868px = max-w-3xl + 50px each side). */}
      <div className="relative mx-auto max-w-[868px]">
        <div className={dropSurfaceClass(dragActive)}>
          <AttachmentChipStrip
            threadId={threadId}
            attachments={attachments}
            streaming={streaming}
          />
          <ComposerTextarea
            taRef={taRef}
            draft={draft}
            placeholder={placeholder}
            disabled={streaming || noModel}
            noModel={noModel}
            mentionOpen={mentionOpen}
            onChangeDraft={(v) => dispatch(setDraft({ threadId, draft: v }))}
            onMentionTrigger={openMention}
            onMentionDismissOnEdit={closeMention}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
          />
          {mentionOpen && <MentionPopover messages={messages} onPick={insertMention} onClose={closeMention} />}
          {slashOpen && (
            <SlashCommandPopover
              query={slashQuery}
              onPick={runSlash}
              onClose={dismissSlash}
              disabledReasons={slashDisabledReasons}
            />
          )}
          <InputDockToolbar threadId={threadId} reasoningEnabled={reasoningEnabled} onReasoningToggle={onReasoningToggle} contextUsagePct={contextUsagePct} onPrimaryClick={onPrimaryClick} sendDisabled={sendDisabled} streaming={streaming} noModel={noModel} />
        </div>
        {dragActive && <DropOverlay />}
      </div>
    </div>
  );
}

// `@` opens an inline picker of recent thread messages. Selecting one
// inserts a quoted snippet at the cursor (replaces the trigger `@` so the
// trigger character itself doesn't leak into the prompt). Esc / outside
// click closes the popover via MentionPopover's own listeners.
function useMention(
  threadId: ThreadId,
  draft: string,
  taRef: React.MutableRefObject<HTMLTextAreaElement | null>,
  dispatch: ReturnType<typeof useAppDispatch>,
) {
  const [mentionOpen, setMentionOpen] = useState(false);
  const openMention = useCallback(() => setMentionOpen(true), []);
  const closeMention = useCallback(() => setMentionOpen(false), []);
  const insertMention = useCallback(
    (message: Message) => {
      const ta = taRef.current;
      const cursor = ta?.selectionStart ?? draft.length;
      // The trigger `@` is the char immediately before the cursor in the
      // common case; replace it. If the user moved the cursor away before
      // selecting, no `@` is at that position — just splice in the quote.
      const before = draft.slice(0, Math.max(0, cursor - 1));
      const after = draft.slice(cursor);
      const charBefore = draft.charAt(cursor - 1);
      const head = charBefore === '@' ? before : draft.slice(0, cursor);
      const tail = charBefore === '@' ? after : draft.slice(cursor);
      const flat = message.content.replace(/\s+/g, ' ').trim();
      const snippet = flat.length > 70 ? `${flat.slice(0, 70)}…` : flat;
      const role = message.role === 'user' ? 'You' : 'Assistant';
      const inserted = `> ${role}: "${snippet}"\n\n`;
      const next = `${head}${inserted}${tail}`;
      dispatch(setDraft({ threadId, draft: next }));
      setMentionOpen(false);
      // Restore focus + place cursor after the inserted block on next tick
      // (after React re-renders with the new value).
      requestAnimationFrame(() => {
        if (!taRef.current) return;
        const cursorAfter = head.length + inserted.length;
        taRef.current.focus();
        taRef.current.setSelectionRange(cursorAfter, cursorAfter);
      });
    },
    [draft, threadId, dispatch, taRef],
  );
  return { mentionOpen, openMention, closeMention, insertMention };
}

interface ComposerTextareaProps {
  // Mutable ref so React 18's strict refs accept it; useRef<X | null>()
  // returns RefObject<X | null> which mismatches HTMLTextAreaElement's
  // expected legacy ref shape. MutableRefObject sidesteps that.
  readonly taRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  readonly draft: string;
  readonly placeholder: string;
  readonly disabled: boolean;
  readonly noModel: boolean;
  readonly mentionOpen: boolean;
  readonly onChangeDraft: (v: string) => void;
  readonly onMentionTrigger: () => void;
  readonly onMentionDismissOnEdit: () => void;
  readonly onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  readonly onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  readonly onCompositionStart: () => void;
  readonly onCompositionEnd: () => void;
}

// Just the textarea — extracted so the dock body stays under the line cap.
// `readOnly` (not `disabled`) so the user can still select + copy their
// just-sent prompt while the assistant streams (BUG-CHAT-COMPOSE-014).
function ComposerTextarea({
  taRef,
  draft,
  placeholder,
  disabled,
  noModel,
  mentionOpen,
  onChangeDraft,
  onMentionTrigger,
  onMentionDismissOnEdit,
  onKeyDown,
  onPaste,
  onCompositionStart,
  onCompositionEnd,
}: ComposerTextareaProps) {
  return (
    <textarea
      ref={taRef}
      rows={1}
      value={draft}
      onChange={(e) => {
        onChangeDraft(e.target.value);
        if (mentionOpen && !e.target.value.includes('@')) onMentionDismissOnEdit();
      }}
      onKeyDown={(e) => {
        if (e.key === '@' && !mentionOpen) onMentionTrigger();
        onKeyDown(e);
      }}
      onPaste={onPaste}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      placeholder={placeholder}
      className={cn(
        'mt-2 min-h-[24px] w-full resize-none overflow-y-auto bg-transparent text-sm text-fg-default',
        'placeholder:text-fg-subtle focus:outline-none',
      )}
      readOnly={disabled}
      aria-label={noModel ? 'Message input (disabled — load a model first)' : 'Message input'}
    />
  );
}

// Slash commands. Open while the trimmed draft is exactly `/<word>` (no
// spaces inside — once the user types past the command name we assume
// they're writing a normal message that happens to start with `/`). A
// transient `dismissed` flag handles the user pressing Esc and continuing
// to type — we don't reopen on every keystroke.
function useSlashCommands(
  threadId: ThreadId,
  draft: string,
  messages: readonly Message[],
  dispatch: ReturnType<typeof useAppDispatch>,
) {
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const trimmed = draft.trimStart();
  const slashShape =
    trimmed.startsWith('/') && !/\s/.test(trimmed) ? trimmed : null;
  const slashQuery = slashShape ? slashShape.slice(1) : '';
  const slashOpen = slashShape !== null && dismissedFor !== slashShape;
  const dismissSlash = useCallback(() => {
    setDismissedFor(slashShape);
  }, [slashShape]);
  // BUG-CHAT-COMPOSE-021: `/regen` silently no-op'd on a thread with no
  // assistant reply. Now the command row is disabled with a reason instead.
  const lastAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'assistant'),
    [messages],
  );
  const slashDisabledReasons = useMemo<Record<string, string>>(
    () =>
      lastAssistant
        ? {}
        : ({ regen: 'No assistant reply to regenerate yet' } as Record<string, string>),
    [lastAssistant],
  );
  const runSlash = useCallback(
    (cmd: SlashCommand) => {
      switch (cmd.id) {
        case 'clear':
          void dispatch(clearThreadThunk(threadId));
          break;
        case 'system':
          // Open the right rail, switch to Settings tab, expand the panel,
          // then ask the panel to scroll itself into view so `/system`
          // actually surfaces the editor instead of leaving it off-screen.
          dispatch(setRightPanelOpenForRoute({ route: 'chat', open: true }));
          dispatch(setInferenceTab('settings'));
          dispatch(setPanelExpanded({ panel: 'systemPrompt', expanded: true }));
          dispatch(requestPanelScroll('systemPrompt'));
          break;
        case 'regen': {
          // Guarded again here as defense-in-depth — the popover already
          // disables the row when there's no assistant message.
          if (lastAssistant) void dispatch(regenerateThunk(threadId, lastAssistant.id));
          break;
        }
        default:
          break;
      }
      dispatch(setDraft({ threadId, draft: '' }));
      setDismissedFor(null);
    },
    [dispatch, threadId, lastAssistant],
  );
  return { slashOpen, slashQuery, runSlash, dismissSlash, slashDisabledReasons };
}

function dropSurfaceClass(dragActive: boolean): string {
  return cn(
    'rounded-md border bg-bg-surface px-3 py-2 transition-colors',
    dragActive ? 'border-accent ring-2 ring-accent/30' : 'border-border-default',
  );
}

function DropOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-bg-base/85 text-sm font-medium text-fg-accent"
    >
      Drop to attach
    </div>
  );
}

interface ToolbarProps {
  readonly threadId: ThreadId;
  readonly reasoningEnabled: boolean;
  readonly onReasoningToggle: () => void;
  readonly contextUsagePct: number;
  readonly onPrimaryClick: () => void;
  readonly sendDisabled: boolean;
  readonly streaming: boolean;
  readonly noModel: boolean;
}

function InputDockToolbar({
  threadId,
  reasoningEnabled,
  onReasoningToggle,
  contextUsagePct,
  onPrimaryClick,
  sendDisabled,
  streaming,
  noModel,
}: ToolbarProps) {
  // Tooltip copy explains why send is disabled when a model isn't loaded.
  const sendTooltip = streaming
    ? 'Stop generating'
    : noModel
      ? 'Load a model to send a message'
      : 'Send message';
  // Reasoning pill is only available when a "thinking" model is loaded.
  const isThinkingModel = useAppSelector(selectIsThinkingModel);
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <AttachFilePopover threadId={threadId} disabled={streaming || noModel} />
      <IntegrationsPopover />
      <ReasoningTogglePill
        enabled={reasoningEnabled}
        onToggle={onReasoningToggle}
        available={isThinkingModel}
      />
      <span className="ml-auto flex items-center gap-2 text-caption text-fg-subtle">
        <ContextUsageDial pct={contextUsagePct} />
        <Tooltip content={sendTooltip} side="top">
          <Button
            variant={streaming ? 'danger' : 'primary'}
            size="sm"
            iconOnly
            aria-label={streaming ? 'Stop streaming' : 'Send message'}
            onClick={onPrimaryClick}
            disabled={sendDisabled}
          >
            <Icon icon={streaming ? Stop : ArrowUp} size="sm" weight="bold" />
          </Button>
        </Tooltip>
      </span>
    </div>
  );
}
