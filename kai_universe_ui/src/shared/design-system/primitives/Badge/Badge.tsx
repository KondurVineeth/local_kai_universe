import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@shared/lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone;
  readonly size?: BadgeSize;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-bg-raised text-fg-muted border-border-default',
  accent: 'bg-accent-subtle text-fg-accent border-transparent',
  success: 'bg-success-subtle text-success border-transparent',
  warning: 'bg-warning-subtle text-warning border-transparent',
  danger: 'bg-danger-subtle text-danger border-transparent',
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'h-4 px-1 text-caption',
  md: 'h-5 px-1.5 text-caption',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', size = 'md', className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-full border font-medium',
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
});
