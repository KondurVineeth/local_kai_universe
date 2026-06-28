import { Slot } from '@radix-ui/react-slot';
import { forwardRef } from 'react';

import { cn } from '@shared/lib/cn';

import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

// Variant text colors: white on every saturated bg (primary blue, danger red)
// — `text-fg-inverse` is the OPPOSITE of what's needed on a dark-blue/red bg
// (it resolves to #171717, dark-on-color, unreadable). `text-fg-default`
// (#FFFFFF) is the right choice for legibility over saturated brand colors.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-fg-default hover:bg-accent-hover disabled:bg-bg-subtle disabled:text-fg-subtle',
  secondary:
    'bg-bg-raised text-fg-default border border-border-default hover:bg-bg-surface disabled:opacity-70 disabled:text-fg-muted',
  ghost:
    'bg-transparent text-fg-default hover:bg-bg-raised disabled:opacity-70 disabled:text-fg-muted',
  danger:
    'bg-danger text-fg-default hover:opacity-90 disabled:opacity-70',
};

// Button labels at 12px (text-xs) — matches the chat-list thread-row text size
// so a "New Folder" button next to a "New Chat" item reads as the same tier.
// Sizes differ in height/padding only.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2 text-xs gap-1',
  md: 'h-8 px-3 text-xs gap-2',
  lg: 'h-10 px-4 text-xs gap-2',
};

const SIZE_ICON_ONLY: Record<ButtonSize, string> = {
  sm: 'h-7 w-7 p-0',
  md: 'h-8 w-8 p-0',
  lg: 'h-10 w-10 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    iconOnly = false,
    asChild = false,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium select-none',
        'transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base',
        'disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        iconOnly ? SIZE_ICON_ONLY[size] : SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </Comp>
  );
});
