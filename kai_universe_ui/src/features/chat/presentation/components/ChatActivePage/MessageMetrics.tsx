import { Lightning, Square, TextAa, Warning } from '@phosphor-icons/react';

import { Icon } from '@shared/ds/primitives';

import type { Message } from '../../../domain/entities/Message';

interface MessageMetricsProps {
  readonly message: Message;
  // Defense-in-depth: AssistantMessage already gates rendering of this
  // component on `!streaming`, but accepting the flag here lets every other
  // caller stay correct without re-implementing the guard. Streaming metrics
  // are unreliable mid-stream — t/s denominator is partial, elapsed hasn't
  // ticked over yet — so we render nothing while streaming===true.
  readonly streaming?: boolean;
}

export function MessageMetrics({ message, streaming }: MessageMetricsProps) {
  // BUG-CHAT-RENDER-008 / 009: hide both metrics while streaming.
  if (streaming || message.streaming) return null;

  const chips: Array<{ icon: typeof Lightning; label: string }> = [];

  // BUG-CHAT-RENDER-008: round t/s to one decimal and reject NaN/Infinity.
  // Raw values from finalize used to leak through unguarded.
  if (message.tokensPerSecond != null && Number.isFinite(message.tokensPerSecond)) {
    chips.push({ icon: Lightning, label: `${message.tokensPerSecond.toFixed(1)} tok/sec` });
  }
  if (message.tokenCount != null) {
    chips.push({ icon: TextAa, label: `${message.tokenCount} tokens` });
  }
  // BUG-CHAT-RENDER-009: clamp negative elapsedMs to 0 so a clock skew or a
  // sub-millisecond stream can't render "-0.00s".
  if (message.elapsedMs != null) {
    const clamped = Math.max(0, message.elapsedMs);
    chips.push({ icon: Square, label: `${(clamped / 1000).toFixed(2)}s` });
  }
  if (chips.length === 0 && !message.stopReason) return null;
  // Error / interrupted reasons read as a problem, not a neutral metric —
  // give them a danger-tinted chip so they don't blend into the t/s row.
  const abnormal =
    message.stopReason === 'Error' ||
    message.stopReason === 'Interrupted by reload' ||
    message.stopReason === 'Context overflow error';
  return (
    <div className="flex flex-wrap items-center gap-2 text-caption text-fg-subtle">
      {chips.map((c) => (
        <span
          key={c.label}
          className="inline-flex items-center gap-1 rounded-md bg-bg-raised px-1.5 py-0.5"
        >
          <Icon icon={c.icon} size="xs" />
          <span>{c.label}</span>
        </span>
      ))}
      {message.stopReason && (
        <span
          className={
            abnormal
              ? 'inline-flex items-center gap-1 rounded-md border border-danger/40 bg-danger/15 px-1.5 py-0.5 text-danger'
              : 'rounded-md bg-bg-raised px-1.5 py-0.5'
          }
        >
          {abnormal && <Icon icon={Warning} size="xs" />}
          <span>Stop reason: {message.stopReason}</span>
        </span>
      )}
    </div>
  );
}
