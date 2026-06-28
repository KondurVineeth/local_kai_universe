import * as RadixPopover from '@radix-ui/react-popover';
import { forwardRef, type ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

export interface PopoverProps {
  readonly children: ReactNode;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly defaultOpen?: boolean;
  readonly modal?: boolean;
}

export interface PopoverTriggerProps {
  readonly children: ReactNode;
  readonly asChild?: boolean;
}

export interface PopoverContentProps {
  readonly children: ReactNode;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly align?: 'start' | 'center' | 'end';
  readonly sideOffset?: number;
  readonly className?: string;
}

export function Popover({ children, ...rest }: PopoverProps) {
  return <RadixPopover.Root {...rest}>{children}</RadixPopover.Root>;
}

// forwardRef so wrapping primitives (Tooltip → PopoverTrigger asChild → Button)
// can compose without React's "Function components cannot be given refs" error.
// Without this, every Tooltip-wrapped popover trigger logs an error per render.
export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  function PopoverTrigger({ children, asChild = true }, ref) {
    return (
      <RadixPopover.Trigger ref={ref} asChild={asChild}>
        {children}
      </RadixPopover.Trigger>
    );
  },
);

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent({ children, side = 'bottom', align = 'start', sideOffset = 6, className }, ref) {
    return (
      <RadixPopover.Portal>
        <RadixPopover.Content
          ref={ref}
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'z-40 min-w-[14rem] overflow-hidden rounded-m border border-border-default bg-bg-raised text-fg-default shadow-lg',
            'focus-visible:outline-none',
            className,
          )}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    );
  },
);
