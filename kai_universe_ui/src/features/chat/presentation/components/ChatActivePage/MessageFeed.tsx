import { ArrowDown, Cpu, WarningCircle } from '@phosphor-icons/react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import {
  selectChatFontSize,
  selectChatMessagesStyle,
  selectChatViewMode,
} from '@features/settings';
import { Button, Icon, Spinner } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectModelGate } from '../../store/selectors';
import { openModelPickerThunk } from '../../store/thunks';

import { AssistantMessage } from './AssistantMessage';
import { ChatAppearanceProvider, fontSizeToTextClass } from './ChatAppearanceContext';
import { UserMessage } from './UserMessage';

import type { ChatAppearance } from './ChatAppearanceContext';
import type { Message } from '../../../domain/entities/Message';
import type { ThreadId } from '../../../domain/value-objects/ThreadId';

interface MessageFeedProps {
  readonly messages: readonly Message[];
  readonly isStreaming: boolean;
  readonly threadId?: ThreadId;
  readonly readonly?: boolean;
  // Repository hydration status. While 'loading' the feed shows a spinner
  // (avoids flashing the "no messages" empty state before the repo read
  // resolves); 'error' surfaces a read-failure branch. Omitted by the
  // split pane (its messages come straight from the slice).
  readonly hydration?: 'loading' | 'ready' | 'error';
}

// BUG-CHAT-FEED-014: sentinel distinct from any valid ThreadId so the first
// effect run is treated as a thread-change transition rather than missing
// the undefined→threadId step.
const NO_THREAD = Symbol('NO_THREAD');

export function MessageFeed({
  messages,
  isStreaming,
  threadId,
  readonly,
  hydration,
}: MessageFeedProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);
  isAtBottomRef.current = isAtBottom;
  useAutoscroll({ scrollRef, messages, isStreaming, threadId, isAtBottomRef });
  useScrollListener(scrollRef, setIsAtBottom);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const isEmpty = messages.length === 0;
  const appearance = useChatAppearanceSettings();

  return (
    <div className="absolute inset-0">
      {/* BUG-CHAT-FEED-013: single root with stable scrollRef. The empty
          state lives INSIDE the scrollable container so the listener keeps
          firing across the empty→populated transition. */}
      {/* Top breathing room lives on the inner content wrapper (pt-6), NOT
          as scroll-container padding. A code block's `sticky top-0` header
          pins to the scrollport's content edge — any top padding here would
          leave a gap above it where scrolled-past code shows through. */}
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto px-4 pb-6">
        {isEmpty && hydration === 'loading' ? (
          <HydratingFeed />
        ) : isEmpty && hydration === 'error' ? (
          <FeedError />
        ) : isEmpty ? (
          <EmptyFeed readonly={readonly ?? false} />
        ) : (
          <ChatAppearanceProvider value={appearance}>
            <div
              className={cn(
                'mx-auto flex max-w-[868px] flex-col pt-6',
                // Block style reads as a compact, divided transcript;
                // bubble keeps the airier conversational rhythm.
                appearance.messagesStyle === 'block'
                  ? 'gap-1 divide-y divide-border-default'
                  : 'gap-6',
              )}
            >
              {messages.map((m) =>
                m.role === 'user' ? (
                  <MemoUserMessage key={m.id} message={m} readonly={readonly ?? false} />
                ) : (
                  <MemoAssistantMessage key={m.id} message={m} readonly={readonly ?? false} />
                ),
              )}
            </div>
          </ChatAppearanceProvider>
        )}
      </div>

      {/* Gradient fade from content into input dock */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-28"
        // Token-keyed gradient — keeps the fade in sync with bg-base under
        // a Yellowchalk DS swap. UX2-CHAT-028.
        style={{
          background:
            'linear-gradient(to top, var(--color-base-colours-background) 0%, transparent 100%)',
        }}
      />

      {/* Go-to-bottom button — shown only when scrolled up (and there's
          something to scroll to). */}
      {!isAtBottom && !isEmpty && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-border-default bg-bg-raised text-fg-subtle transition-colors hover:bg-bg-active hover:text-fg-default"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}

// Resolves the appearance settings (@features/settings) the message feed
// consumes: font size → text-size class, markdown-vs-plain rendering, and
// bubble-vs-block density. Memoized so the provider value is referentially
// stable across feed re-renders.
function useChatAppearanceSettings(): ChatAppearance {
  const fontSize = useAppSelector(selectChatFontSize);
  const viewMode = useAppSelector(selectChatViewMode);
  const messagesStyle = useAppSelector(selectChatMessagesStyle);
  return useMemo<ChatAppearance>(
    () => ({ textClass: fontSizeToTextClass(fontSize), viewMode, messagesStyle }),
    [fontSize, viewMode, messagesStyle],
  );
}

// Shown while the repository read for this thread's messages is in flight —
// prevents the "no messages" empty state from flashing before hydration
// resolves on a thread that actually has history.
function HydratingFeed() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size="md" />
    </div>
  );
}

// Shown when the repository read failed. Defensive — the mock repo rarely
// fails, but a localStorage security/quota exception shouldn't leave the
// feed silently blank.
function FeedError() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3xl px-xl text-center">
      <Icon icon={WarningCircle} size="xl" className="text-danger" />
      <div className="flex max-w-md flex-col items-center gap-m">
        <h2 className="text-base font-semibold text-fg-default">
          Couldn&apos;t load this chat
        </h2>
        <p className="text-xs text-fg-muted">
          The stored messages for this chat couldn&apos;t be read. Try
          reopening the chat or restarting the app.
        </p>
      </div>
    </div>
  );
}

// UX-CHAT-001: empty-feed copy used to lie ("Start the conversation by sending
// a message below" while send is gated on a model loading). Branch on the
// chat-feature gate selector: when no model is ready, surface the prerequisite
// as a visible CTA in the primary content area (clarity rule #1) instead of
// hiding it in input placeholders / tooltips.
function EmptyFeed({ readonly }: { readonly readonly: boolean }) {
  const dispatch = useAppDispatch();
  const { ready, transient, status } = useAppSelector(selectModelGate);
  if (readonly) {
    return (
      <div className="flex h-full items-center justify-center text-fg-subtle">
        <p className="text-xs">No messages yet.</p>
      </div>
    );
  }
  // Mid-load / mid-eject: NEVER show a "Load a model" CTA — clicking it
  // would race the in-flight thunk and double-dispatch. Surface the
  // current operation so the user sees what the chrome is busy with.
  if (transient) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3xl px-xl text-center">
        <Spinner size="md" />
        <div className="flex max-w-md flex-col items-center gap-m">
          <h2 className="text-base font-semibold text-fg-default">
            {status === 'loading' ? 'Loading your model…' : 'Ejecting model…'}
          </h2>
          <p className="text-xs text-fg-muted">
            {status === 'loading'
              ? 'This usually takes a few seconds. The chat unlocks automatically when the model is ready.'
              : 'You can pick a different model in a moment.'}
          </p>
        </div>
      </div>
    );
  }
  if (!ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3xl px-xl text-center">
        <Icon icon={Cpu} size="xl" className="text-fg-subtle" />
        <div className="flex max-w-md flex-col items-center gap-m">
          <h2 className="text-base font-semibold text-fg-default">
            Load a model to start chatting
          </h2>
          <p className="text-xs text-fg-muted">
            Pick a model from the picker at the top of the window. Once it&apos;s
            loaded, send a message here to begin.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => dispatch(openModelPickerThunk())}
        >
          Load a model
        </Button>
      </div>
    );
  }
  // ready=true reaches here only when the model is loaded and the thread is
  // empty. The composer below is fully functional in this branch — copy is
  // safe to point at sending a message.
  return (
    <div className="flex h-full items-center justify-center text-fg-subtle">
      <p className="text-xs">Start the conversation by sending a message below.</p>
    </div>
  );
}

// BUG-CHAT-FEED-009 + FEED-010 + FEED-014: smarter autoscroll, factored out
// to keep the component body under the lint budget.
//   1. Initial mount or thread switch  → snap to bottom
//   2. New USER message appended       → snap (the user's send is always-snap)
//   3. New ASSISTANT message appended  → only snap if user was at bottom
//   4. Streaming chunk to existing msg → only scroll if near bottom
// rAF-batch the write so a chunk burst collapses to one reflow per frame.
function useAutoscroll(args: {
  readonly scrollRef: React.RefObject<HTMLDivElement | null>;
  readonly messages: readonly Message[];
  readonly isStreaming: boolean;
  readonly threadId: ThreadId | undefined;
  readonly isAtBottomRef: React.RefObject<boolean>;
}): void {
  const { scrollRef, messages, isStreaming, threadId, isAtBottomRef } = args;
  const prevLengthRef = useRef(0);
  const prevThreadRef = useRef<ThreadId | symbol | undefined>(NO_THREAD);
  const prevLastIdRef = useRef<string | undefined>(undefined);
  const isInitialMountRef = useRef(true);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threadChanged = prevThreadRef.current !== threadId;
    const lengthGrew = messages.length > prevLengthRef.current;
    const lastMessage = messages[messages.length - 1];
    const lastId = lastMessage?.id;
    const newMessageAppended = lengthGrew && lastId !== prevLastIdRef.current;
    const lastRole = lastMessage?.role;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 80;

    const shouldSnap = isInitialMountRef.current || threadChanged
      ? true
      : newMessageAppended
        ? lastRole === 'user' || (isAtBottomRef.current ?? true)
        : nearBottom;
    if (isInitialMountRef.current || threadChanged) isInitialMountRef.current = false;

    if (shouldSnap) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const cur = scrollRef.current;
        if (cur) cur.scrollTop = cur.scrollHeight;
      });
    }
    prevLengthRef.current = messages.length;
    prevThreadRef.current = threadId;
    prevLastIdRef.current = lastId;
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [messages, isStreaming, threadId, scrollRef, isAtBottomRef]);
}

// BUG-CHAT-FEED-013: bind the scroll listener to the SAME stable scroll
// container that the populated branch renders. The listener mounts once and
// sticks for the component's lifetime — no rebind across empty→populated.
function useScrollListener(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  setIsAtBottom: (v: boolean) => void,
): void {
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setIsAtBottom(distanceFromBottom < 80);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef, setIsAtBottom]);
}

// BUG-CHAT-FEED-010: memoize message rows by stable identity so a chunk
// landing on the streaming row doesn't re-render every other row in a long
// thread. Equality is keyed on id + content + streaming + reasoningTrace
// (only fields that affect the rendered output for either UserMessage or
// AssistantMessage). Other Message fields are immutable post-finalize.
const messageEqual = (
  a: { message: Message; readonly?: boolean },
  b: { message: Message; readonly?: boolean },
): boolean =>
  a.readonly === b.readonly &&
  a.message.id === b.message.id &&
  a.message.content === b.message.content &&
  a.message.streaming === b.message.streaming &&
  a.message.reasoningTrace === b.message.reasoningTrace &&
  a.message.tokenCount === b.message.tokenCount &&
  a.message.tokensPerSecond === b.message.tokensPerSecond &&
  a.message.elapsedMs === b.message.elapsedMs &&
  a.message.stopReason === b.message.stopReason &&
  a.message.edited === b.message.edited &&
  a.message.attachments === b.message.attachments;

const MemoUserMessage = memo(UserMessage, messageEqual);
const MemoAssistantMessage = memo(AssistantMessage, messageEqual);
