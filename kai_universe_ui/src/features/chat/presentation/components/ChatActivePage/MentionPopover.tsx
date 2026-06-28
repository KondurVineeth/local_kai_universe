import { ChatCircleText, Robot } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';

import { usePopoverKeyboard } from './usePopoverKeyboard';

import type { Message } from '../../../domain/entities/Message';

const MAX_RESULTS = 10;
const SNIPPET_LEN = 70;

// Inline message picker. Triggered by the user typing `@` in the composer.
// Shows the most recent messages in the current thread (newest first) with
// role tag + snippet. Selecting one inserts a quoted excerpt at the cursor
// position via the parent's `onPick` handler.
//
// Keyboard: ↑/↓ to cycle; Enter picks; Esc closes. The handler runs on
// `window` (capture phase) so the textarea below stays focused — the user
// keeps typing into it while the popover is open, and arrow keys are
// "stolen" only when the popover is mounted.
export function MentionPopover({
  messages,
  onPick,
  onClose,
}: {
  readonly messages: readonly Message[];
  readonly onPick: (message: Message) => void;
  readonly onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // Recent first; cap at MAX_RESULTS so the panel doesn't push the dock
  // off-screen on long threads. Empty messages (a placeholder assistant
  // bubble before its first chunk) are filtered out — they have nothing
  // to quote yet.
  const visible = useMemo(
    () =>
      [...messages]
        .filter((m) => m.content.trim().length > 0)
        .reverse()
        .slice(0, MAX_RESULTS),
    [messages],
  );
  const [focusedIdx, setFocusedIdx] = useState(0);
  // Reset focus to the top whenever the visible-list shape changes (a new
  // message arrived, or the popover re-mounted on a different thread).
  useEffect(() => {
    setFocusedIdx(0);
  }, [visible.length]);

  usePopoverKeyboard({
    containerRef,
    items: visible,
    focusedIdx,
    setFocusedIdx,
    onPick,
    onClose,
  });

  // Keep the focused row in view as the user arrows past the visible
  // window in long lists.
  useEffect(() => {
    itemRefs.current[focusedIdx]?.scrollIntoView({ block: 'nearest' });
  }, [focusedIdx]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 right-0 mb-2 max-h-[280px] overflow-y-auto rounded-md border border-border-default bg-bg-raised shadow-lg"
      role="listbox"
      aria-label="Insert message reference"
    >
      <div className="border-b border-border-default px-2 py-1.5 text-caption font-semibold uppercase tracking-wide text-fg-subtle">
        Reference a message
      </div>
      {visible.length === 0 && (
        // BUG-CHAT-COMPOSE-019: an empty popover used to render nothing,
        // making `@` look broken on a fresh thread. Show why instead.
        <p className="px-2 py-2 text-caption text-fg-subtle">
          No messages to reference yet.
        </p>
      )}
      <ul className="flex flex-col gap-0.5 p-1">
        {visible.map((m, idx) => (
          <MentionRow
            key={m.id}
            message={m}
            focused={idx === focusedIdx}
            buttonRef={(el) => {
              itemRefs.current[idx] = el;
            }}
            onClick={() => onPick(m)}
            onHover={() => setFocusedIdx(idx)}
          />
        ))}
      </ul>
    </div>
  );
}

function MentionRow({
  message,
  focused,
  buttonRef,
  onClick,
  onHover,
}: {
  readonly message: Message;
  readonly focused: boolean;
  readonly buttonRef: (el: HTMLButtonElement | null) => void;
  readonly onClick: () => void;
  readonly onHover: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        ref={buttonRef}
        onClick={onClick}
        onMouseEnter={onHover}
        className={cn(
          'flex w-full items-start gap-m rounded-md px-2 py-1.5 text-left text-xs',
          'text-fg-default hover:bg-bg-surface focus-visible:bg-bg-surface',
          'focus-visible:outline-none',
          focused && 'bg-bg-surface',
        )}
      >
        <Icon
          icon={message.role === 'user' ? ChatCircleText : Robot}
          size="xs"
          className={message.role === 'user' ? 'text-fg-muted' : 'text-fg-accent'}
        />
        <div className="flex min-w-0 flex-col">
          <span className="text-caption uppercase tracking-wide text-fg-subtle">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </span>
          <span className="line-clamp-2 text-xs text-fg-default">{snippet(message.content)}</span>
        </div>
      </button>
    </li>
  );
}

function snippet(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= SNIPPET_LEN) return flat;
  return `${flat.slice(0, SNIPPET_LEN)}…`;
}
