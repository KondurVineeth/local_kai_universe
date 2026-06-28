import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  selectAiGeneratedChatNames,
  selectCmdRToRegenerate,
} from '@features/settings';
import { selectLoadedModelId } from '@features/shell';
import { useContainer } from '@shared/container-context';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectAttachmentsForThread,
  selectIsStreamingForSelected,
  selectIsThinkingModel,
  selectMessagesForThread,
  selectReasoningEnabledForThread,
  selectSelectedThread,
  selectSelectedThreadId,
  selectSplitThreadId,
  selectThreads,
} from '../../store/selectors';
import {
  markAllStoppedOnHydrate,
  renameThread,
  selectThread,
  setThreadReasoningOverride,
} from '../../store/slice';
import {
  abortStream,
  hydrateThread,
  regenerateThunk,
  sendMessageThunk,
} from '../../store/thunks';

import { ChatInputDock } from './ChatInputDock';
import { deriveTitle } from './deriveTitle';
import { MessageFeed } from './MessageFeed';
import { PageHeader } from './PageHeader';
import { RenameDialog } from './RenameDialog';
import { SplitPane } from './SplitPane';

import type { Message } from '../../../domain/entities/Message';
import type { ThreadId } from '../../../domain/value-objects/ThreadId';

// Fallback context window when no model is loaded or the fixture lookup
// hasn't resolved yet. The real value is read from the loaded model fixture
// via useContextWindowTokens below.
const FALLBACK_CONTEXT_WINDOW_TOKENS = 32_768;

// Resolve the context-window size for the usage dial from the loaded model
// fixture. Falls back to a fixed 32k while no model is loaded / the async
// lookup is in flight.
function useContextWindowTokens(): number {
  const container = useContainer();
  const loadedId = useAppSelector(selectLoadedModelId);
  const [tokens, setTokens] = useState(FALLBACK_CONTEXT_WINDOW_TOKENS);
  useEffect(() => {
    let cancelled = false;
    if (!loadedId) {
      setTokens(FALLBACK_CONTEXT_WINDOW_TOKENS);
      return;
    }
    container.modelRepository
      .list()
      .then((models) => {
        if (cancelled) return;
        const model = models.find((m) => m.id === loadedId);
        setTokens(model?.contextLengthTokens ?? FALLBACK_CONTEXT_WINDOW_TOKENS);
      })
      .catch(() => {
        if (!cancelled) setTokens(FALLBACK_CONTEXT_WINDOW_TOKENS);
      });
    return () => {
      cancelled = true;
    };
  }, [container, loadedId]);
  return tokens;
}

// Route ↔ slice reconciliation hook. The router carries the canonical id
// (deep links / back-forward / hard reload all land on /chat/:threadId); the
// slice carries the same id but moves independently when the sidebar
// dispatches `selectThread`. Without this, a deep link to /chat/abc could
// render against a slice that still points at xyz, and a route id pointing
// at a deleted thread would render a blank pane forever.
//
// CORE-007: route id refers to a non-existent thread → redirect to /chat
// (replace so the bad URL is not a back-stack entry).
// CORE-008: slice's selectedThreadId lags the URL's id → dispatch
// `selectThread(routeId)` to align. We do not navigate from the slice; that
// direction is handled by callers that already navigate after dispatching.
function useRouteSliceReconciliation(): void {
  const { threadId: routeThreadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const threads = useAppSelector(selectThreads);
  const selectedThreadId = useAppSelector(selectSelectedThreadId);

  const routeRefersToExisting = useMemo(
    () => Boolean(routeThreadId && threads.some((t) => t.id === routeThreadId)),
    [routeThreadId, threads],
  );

  useEffect(() => {
    if (!routeThreadId) return;
    if (routeRefersToExisting) {
      if (selectedThreadId !== routeThreadId) {
        dispatch(selectThread(routeThreadId as ThreadId));
      }
    } else {
      navigate('/chat', { replace: true });
    }
  }, [dispatch, navigate, routeThreadId, routeRefersToExisting, selectedThreadId]);
}

// Token-usage estimate for the context-window dial. Memoized so the reducer
// pass only re-runs when `messages` actually changes; otherwise this fires
// on every parent render (every dispatch, every keystroke in the input
// dock, etc.).
//
// Heuristic: `(content + reasoning).length / 4`. The classic ChatGPT-era
// "1 token ≈ 4 chars" rule of thumb, which assumes Latin alphabets. CJK /
// emoji-heavy / RTL scripts under-count significantly (a Chinese char is
// often 1 token but 1 char; an emoji is 1 codepoint but multiple BPE
// tokens). Acceptable for the mock — real ZL Universe uses the loaded model's
// tokenizer here. When a real tokenizer ships, replace with
// `tokenizer.encode(...).length`.
// Esc closes the open chat. Routes to `/chat`, which auto-creates (or reuses
// an empty) thread — Esc out of a real conversation lands you in a fresh
// composer, never on a thread you didn't ask for. Skipped while a stream is
// in flight so Esc keeps its "stop generating" affordance, and no-ops when
// focus is inside a text field so editor Escape semantics still work.
function useEscClosesChat(isStreaming: boolean): void {
  const navigate = useNavigate();
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape' || isStreaming) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      navigate('/chat');
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isStreaming, navigate]);
}

// Renames a freshly-created "New Chat" thread the moment a first user
// message exists. `deriveTitle` picks a 3-5 word snippet; if it produces
// nothing (whitespace-only prompt), the thread keeps its placeholder title.
// Gated on the `aiGeneratedChatNames` setting — 'never' disables auto-title
// entirely; 'auto'/'always' both auto-name (there's no model to "ask", so
// both map to the deriveTitle heuristic in this mock).
function useAutoTitleNewChat(
  thread: { readonly id: ThreadId; readonly title: string } | null,
  messages: readonly Message[],
  enabled: boolean,
): void {
  const dispatch = useAppDispatch();
  const firstUserMessage = useMemo(
    () => messages.find((m) => m.role === 'user'),
    [messages],
  );
  useEffect(() => {
    if (!enabled) return;
    if (!thread || thread.title !== 'New Chat' || !firstUserMessage) return;
    const title = deriveTitle(firstUserMessage.content);
    if (title && title !== thread.title) {
      dispatch(renameThread({ id: thread.id, title }));
    }
  }, [dispatch, thread, firstUserMessage, enabled]);
}

// Settings: ⌘R / Ctrl+R regenerates the last assistant reply. Skipped while
// streaming (the combo has no meaning mid-stream) and when focus is in a
// text field so the user's editing keystrokes aren't hijacked.
function useCmdRRegenerate(
  threadId: ThreadId | null,
  messages: readonly Message[],
  isStreaming: boolean,
  reasoningEnabled: boolean,
): void {
  const dispatch = useAppDispatch();
  const cmdREnabled = useAppSelector(selectCmdRToRegenerate);
  useEffect(() => {
    if (!cmdREnabled || !threadId) return;
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'r' || e.shiftKey) return;
      if (isStreaming) return;
      const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
      if (!lastAssistant) return;
      e.preventDefault();
      void dispatch(
        regenerateThunk(threadId as ThreadId, lastAssistant.id, { reasoningEnabled }),
      );
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cmdREnabled, dispatch, threadId, messages, isStreaming, reasoningEnabled]);
}

// Hydration-state machine for the feed. 'loading' on every thread change;
// the thunk resolves it to 'ready' or 'error'.
function useHydration(threadId: ThreadId | undefined): 'loading' | 'ready' | 'error' {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    if (!threadId) return;
    let cancelled = false;
    setState('loading');
    void dispatch(hydrateThread(threadId)).then((status) => {
      if (cancelled) return;
      setState(status === 'error' ? 'error' : 'ready');
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch, threadId]);
  return state;
}

// One-shot rehydrate sweep — flips any persisted streaming:true message to
// finalized so a crash-reload mid-stream doesn't leave a stuck cursor.
function useStuckStreamSweep(): void {
  const dispatch = useAppDispatch();
  const sweptRef = useRef(false);
  useEffect(() => {
    if (sweptRef.current) return;
    sweptRef.current = true;
    dispatch(markAllStoppedOnHydrate());
  }, [dispatch]);
}

function useUsedTokens(messages: readonly Message[]): number {
  return useMemo(
    () =>
      messages.reduce(
        (n, m) => n + Math.ceil((m.content.length + (m.reasoningTrace?.length ?? 0)) / 4),
        0,
      ),
    [messages],
  );
}

export function ChatActivePage() {
  useRouteSliceReconciliation();

  const dispatch = useAppDispatch();
  const thread = useAppSelector(selectSelectedThread);
  const messages = useAppSelector(selectMessagesForThread(thread?.id ?? null));
  // Per-selected-thread streaming flag. If/when callers need split-pane's
  // streaming indicator scoped to the split id, swap to
  // `selectIsStreamingForThread(splitId)` at that callsite.
  const isStreaming = useAppSelector(selectIsStreamingForSelected);
  const splitId = useAppSelector(selectSplitThreadId);
  // Per-thread override; falls back to the global default when no override
  // exists for this thread. The dispatch on toggle writes the override (not
  // the global), so toggling on Thread A doesn't change Thread B.
  const reasoningEnabled = useAppSelector(
    selectReasoningEnabledForThread(thread?.id ?? null),
  );
  // Reasoning only applies when a thinking model is loaded — gate the value
  // we pass to the simulator so code and the pill's intent agree.
  const isThinkingModel = useAppSelector(selectIsThinkingModel);
  const effectiveReasoning = reasoningEnabled && isThinkingModel;
  const attachments = useAppSelector(selectAttachmentsForThread(thread?.id ?? null));
  const [renaming, setRenaming] = useState(false);

  useStuckStreamSweep();
  const hydrationState = useHydration(thread?.id);
  useEscClosesChat(isStreaming);
  const aiNames = useAppSelector(selectAiGeneratedChatNames);
  useAutoTitleNewChat(thread, messages, aiNames !== 'never');
  useCmdRRegenerate(thread?.id ?? null, messages, isStreaming, effectiveReasoning);

  const usedTokens = useUsedTokens(messages);
  const contextWindowTokens = useContextWindowTokens();

  // Render-guard. After the route-validation effect bounces us to /chat,
  // this component will unmount; in the same tick, `thread` may still be
  // null (selectedThreadId not yet aligned). Returning null here keeps that
  // frame empty rather than crashing a downstream selector.
  if (!thread) return null;

  // BUG-CHAT-COMPOSE-003: when the user hits Send with only attachments
  // queued, derive a short text label from the attachment names so the
  // message has visible content (the thunk drops empty trims).
  const onSend = (text: string) => {
    const trimmed = text.trim();
    const fb = !trimmed && attachments.length > 0
      ? `[attached: ${attachments.map((a) => a.name).join(', ')}]`
      : trimmed;
    if (!fb) return;
    void dispatch(
      sendMessageThunk(thread.id, fb, { reasoningEnabled: effectiveReasoning }),
    );
  };
  const usagePct = Math.min(
    100,
    Math.round((usedTokens / contextWindowTokens) * 100),
  );
  const splitActive = splitId !== null && splitId !== thread.id;

  return (
    <div
      className="grid h-full bg-bg-base"
      style={{ gridTemplateColumns: splitActive ? '1fr 1fr' : '1fr' }}
    >
      <div className="grid h-full min-h-0 grid-rows-[40px_1fr_auto]">
        <PageHeader thread={thread} onRename={() => setRenaming(true)} />
        <div className="relative min-h-0 h-full overflow-hidden">
          <MessageFeed
            messages={messages}
            isStreaming={isStreaming}
            threadId={thread.id}
            hydration={hydrationState}
          />
        </div>
        <ChatInputDock
          threadId={thread.id}
          onSend={onSend}
          onStop={() => abortStream(thread.id)}
          streaming={isStreaming}
          reasoningEnabled={reasoningEnabled}
          onReasoningToggle={() =>
            dispatch(setThreadReasoningOverride({ threadId: thread.id, enabled: !reasoningEnabled }))
          }
          contextUsagePct={usagePct}
        />
      </div>
      {splitActive && splitId && <SplitPane threadId={splitId} />}
      {renaming && (
        <RenameDialog
          initialTitle={thread.title}
          onCancel={() => setRenaming(false)}
          onSubmit={(title) => {
            if (title.trim()) dispatch(renameThread({ id: thread.id, title: title.trim() }));
            setRenaming(false);
          }}
        />
      )}
    </div>
  );
}
