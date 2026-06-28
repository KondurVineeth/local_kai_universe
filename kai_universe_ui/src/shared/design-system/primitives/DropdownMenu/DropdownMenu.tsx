import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

export interface DropdownMenuProps {
  readonly children: ReactNode;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly defaultOpen?: boolean;
  readonly modal?: boolean;
}

export function DropdownMenu({ children, ...rest }: DropdownMenuProps) {
  return <RadixMenu.Root {...rest}>{children}</RadixMenu.Root>;
}

export function DropdownMenuTrigger({
  children,
  asChild = true,
}: {
  readonly children: ReactNode;
  readonly asChild?: boolean;
}) {
  return <RadixMenu.Trigger asChild={asChild}>{children}</RadixMenu.Trigger>;
}

export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RadixMenu.Content>
>(function DropdownMenuContent({ children, className, side = 'bottom', align = 'start', sideOffset = 6, ...rest }, ref) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        ref={ref}
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[12rem] overflow-hidden rounded-m border border-border-default bg-bg-raised p-1 text-fg-default shadow-lg',
          'focus-visible:outline-none',
          className,
        )}
        {...rest}
      >
        {children}
      </RadixMenu.Content>
    </RadixMenu.Portal>
  );
});

export const DropdownMenuItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RadixMenu.Item>
>(function DropdownMenuItem({ children, className, ...rest }, ref) {
  return (
    <RadixMenu.Item
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-xs',
        'data-[highlighted]:bg-accent-subtle data-[highlighted]:text-fg-default',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        'focus-visible:outline-none',
        className,
      )}
      {...rest}
    >
      {children}
    </RadixMenu.Item>
  );
});

export function DropdownMenuLabel({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <RadixMenu.Label className={cn('px-2 py-1.5 text-caption font-medium text-fg-subtle', className)}>
      {children}
    </RadixMenu.Label>
  );
}

export function DropdownMenuSeparator({ className }: { readonly className?: string }) {
  return <RadixMenu.Separator className={cn('my-1 h-px bg-border-subtle', className)} />;
}
