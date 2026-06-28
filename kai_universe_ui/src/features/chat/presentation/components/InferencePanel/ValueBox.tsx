import { useEffect, useState, type KeyboardEvent } from 'react';

import { cn } from '@shared/lib/cn';

interface ValueBoxProps {
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly onChange: (n: number) => void;
  readonly disabled?: boolean;
  readonly format?: (n: number) => string;
  readonly width?: string;
  readonly ariaLabel: string;
}

// CONFIG-001: clamp typed values to [min, max] before dispatch.
// CONFIG-002: keep a local string draft so partial decimal entry like "0." or
//   "0.6" doesn't get coerced to a number / formatted on every keystroke.
//   We only commit (clamped) on blur or Enter — matches how the ZL Universe
//   reference behaves, and lets the user type "0.65" without snap-back.
// CONFIG-003: clamping also fixes slider/typed desync (typed 0.61 with step
//   0.05 used to round-trip through the slider and snap back to 0.60). The
//   slider's discrete step is independent; the value box now passes through
//   whatever the user actually typed (clamped) without re-quantising.

function clamp(n: number, min: number | undefined, max: number | undefined): number {
  let v = n;
  if (typeof min === 'number' && v < min) v = min;
  if (typeof max === 'number' && v > max) v = max;
  return v;
}

// Compact numeric input shown to the right of a slider label, matching the
// ZL Universe reference where slider value lives in a small bordered box.
export function ValueBox({
  value,
  min,
  max,
  step,
  onChange,
  disabled,
  format,
  width = 'w-16',
  ariaLabel,
}: ValueBoxProps) {
  const formatted = format ? format(value) : String(value);
  // Local string buffer — what the user is actively typing. Re-syncs from
  // props whenever the upstream value changes (e.g. slider drag, preset
  // apply) and we're not actively editing.
  const [draft, setDraft] = useState<string>(formatted);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(formatted);
  }, [formatted, editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed === '') {
      // Empty buffer reverts to the upstream value rather than dispatching NaN.
      setDraft(formatted);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setDraft(formatted);
      return;
    }
    const clamped = clamp(parsed, min, max);
    if (clamped !== value) onChange(clamped);
    // Resync the buffer to the formatted form of whatever ended up applied.
    const next = format ? format(clamped) : String(clamped);
    setDraft(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      // `min`/`max`/`step` retained for assistive-tech / spec semantics even
      // though we now run clamp manually.
      // eslint-disable-next-line react/no-unknown-property
      data-min={min}
      data-max={max}
      data-step={step}
      onFocus={() => setEditing(true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'rounded-md border border-border-strong bg-bg-base px-2 py-1 text-right',
        'font-mono text-xs text-fg-default focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-70 disabled:text-fg-muted',
        width,
      )}
    />
  );
}
