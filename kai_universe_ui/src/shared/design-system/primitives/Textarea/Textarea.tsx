import { forwardRef, type TextareaHTMLAttributes } from 'react';

import { cn } from '@shared/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly invalid?: boolean;
  readonly monospace?: boolean;
}

// Multiline text input. Used for system prompt, notes, structured-output
// schema, message editor. Padding-driven height (no fixed `h-*`) so the
// caller controls `rows`.
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, monospace, className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'block w-full rounded-md border bg-bg-base p-m text-xs text-fg-default',
        'placeholder:text-fg-subtle focus:outline-none transition-colors',
        invalid ? 'border-danger' : 'border-border-strong',
        monospace ? 'font-mono' : '',
        'disabled:cursor-not-allowed disabled:opacity-70 disabled:text-fg-muted',
        className,
      )}
      {...rest}
    />
  );
});
