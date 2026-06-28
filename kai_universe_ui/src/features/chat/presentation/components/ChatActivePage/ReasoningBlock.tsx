import { CaretDown } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

import { selectExpandReasoningBlocksByDefault } from '@features/settings';
import { Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectReasoningOpenOverride, setReasoningOpen } from '../../store/slice';

import type { MessageId } from '../../../domain/value-objects/MessageId';

interface ReasoningBlockProps {
  readonly messageId: MessageId;
  readonly trace: string;
  readonly elapsedMs: number | undefined;
  readonly isStreaming: boolean;
  readonly hasBody: boolean;
}

// Open by default while streaming the reasoning trace; auto-closes once the
// body starts (Hick's Law: reduce visible content once primary answer lands).
// User can re-expand at any time.
//
// BUG-CHAT-RENDER-006: persistence. Once the user explicitly toggles, that
// choice is recorded in Redux (`reasoningOpenOverrides[messageId]`) and the
// auto-collapse rule is suppressed. The override survives remount + reload.
//
// BUG-CHAT-RENDER-007: gate the elapsed-time label on `elapsedMs != null`,
// not on truthiness — `0ms` is a valid measurement and should still print as
// "Thought for 0.00 seconds" rather than the bare "Thought" fallback.
//
// BUG-CHAT-RENDER-014: render the disclosure with a body that has an `id`
// and link the toggle button to it via `aria-controls`. (We keep the custom
// button rather than `<details>`/`<summary>` so the existing icon and Tailwind
// styling don't change.)
export function ReasoningBlock({
  messageId,
  trace,
  elapsedMs,
  isStreaming,
  hasBody,
}: ReasoningBlockProps) {
  const dispatch = useAppDispatch();
  const override = useAppSelector((s) => selectReasoningOpenOverride(s, messageId));
  // Settings: when the user opts to keep reasoning blocks expanded by
  // default, the auto-collapse-on-body-arrival rule is suppressed.
  const expandByDefault = useAppSelector(selectExpandReasoningBlocksByDefault);

  // Local mirror for SSR-safe initial render and to avoid a dispatch loop in
  // the auto-collapse effect; Redux is the source of truth after the first
  // user interaction.
  const [open, setOpen] = useState<boolean>(override ?? true);

  // Track whether the previous `hasBody` was false so we only auto-collapse
  // on the false→true transition (BUG-CHAT-RENDER-006). Re-renders with
  // hasBody already true don't trigger another collapse.
  const prevHasBodyRef = useRef(hasBody);
  useEffect(() => {
    const prev = prevHasBodyRef.current;
    prevHasBodyRef.current = hasBody;
    // Only auto-collapse on the stable transition false → true, AND only if
    // the user hasn't expressed a preference AND the "keep expanded by
    // default" setting is off.
    if (override === undefined && !expandByDefault && !prev && hasBody) {
      setOpen(false);
    }
  }, [hasBody, override, expandByDefault]);

  // Sync local state if a different override lands (e.g. across remounts).
  useEffect(() => {
    if (override !== undefined) setOpen(override);
  }, [override]);

  const seconds = elapsedMs != null ? (elapsedMs / 1000).toFixed(2) : null;
  const labelText =
    isStreaming && !hasBody
      ? 'Thinking…'
      : seconds != null
        ? `Thought for ${seconds} seconds`
        : 'Thought';

  const regionId = `reasoning-region-${messageId}`;
  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    dispatch(setReasoningOpen({ messageId, open: next }));
  };

  return (
    <div className="text-xs text-fg-subtle">
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:text-fg-default"
        aria-expanded={open}
        aria-controls={regionId}
      >
        <Icon
          icon={CaretDown}
          size="xs"
          className={cn('transition-transform', open ? 'rotate-0' : '-rotate-90')}
        />
        <span>{labelText}</span>
      </button>
      <div
        id={regionId}
        hidden={!open}
        className={open ? 'mt-1 ml-3 border-l border-border-default pl-3 text-xs text-fg-muted' : undefined}
      >
        <div className="whitespace-pre-wrap break-words">{trace}</div>
      </div>
    </div>
  );
}
