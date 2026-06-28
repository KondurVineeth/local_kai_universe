import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

export type InputSize = 'sm' | 'md';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  readonly inputSize?: InputSize;
  readonly leadingIcon?: ReactNode;
  readonly trailingIcon?: ReactNode;
  readonly invalid?: boolean;
}

// Per design spec: input uses Body 04 typography (14px / Font Size/3),
// 8px padding all sides (Infinity space `m`), and `rounded-s` (8px / Corner Radius/s).
// `auto` height = padding-driven, no fixed h-7/h-8.
const SIZE_CLASSES: Record<InputSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
};

const PADDING: Record<InputSize, string> = {
  sm: 'p-m', // 8px all sides — Infinity space/m
  md: 'p-m', // 8px all sides — Infinity space/m
};

// Single-line input. Used by search bars, filter inputs, settings fields. The
// component handles its own focus/error styling so individual call sites stay
// declarative.
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = 'md', leadingIcon, trailingIcon, invalid, className, ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        // 8px radius (arbitrary, guaranteed to compile), 8px padding all sides
        // (`p-m` = Spacing/m), 12px text (text-xs).
        // Border = 1px Neutral/Outline/Medium (#404040) at rest AND on focus —
        // no extra ring/glow, no color change on focus.
        'group inline-flex items-center gap-2 rounded-md border bg-bg-base text-fg-default',
        'transition-colors',
        invalid ? 'border-danger' : 'border-border-strong',
        'focus-within:border-border-strong focus-within:outline-none',
        SIZE_CLASSES[inputSize],
        PADDING[inputSize],
        className,
      )}
    >
      {leadingIcon && <span className="shrink-0 text-fg-subtle">{leadingIcon}</span>}
      <input
        ref={ref}
        className={cn(
          'min-w-0 flex-1 bg-transparent placeholder:text-fg-subtle focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-70 disabled:text-fg-muted',
        )}
        {...rest}
      />
      {trailingIcon && <span className="shrink-0 text-fg-subtle">{trailingIcon}</span>}
    </div>
  );
});
