import * as RadixScrollArea from '@radix-ui/react-scroll-area';
import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@shared/lib/cn';

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  readonly orientation?: 'vertical' | 'horizontal' | 'both';
  readonly viewportClassName?: string;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { orientation = 'vertical', viewportClassName, className, children, ...rest },
  ref,
) {
  return (
    <RadixScrollArea.Root
      type="hover"
      className={cn('relative overflow-hidden', className)}
    >
      <RadixScrollArea.Viewport
        ref={ref}
        className={cn('h-full w-full', viewportClassName)}
        {...rest}
      >
        {children}
      </RadixScrollArea.Viewport>
      {(orientation === 'vertical' || orientation === 'both') && (
        <Scrollbar orientation="vertical" />
      )}
      {(orientation === 'horizontal' || orientation === 'both') && (
        <Scrollbar orientation="horizontal" />
      )}
      <RadixScrollArea.Corner className="bg-transparent" />
    </RadixScrollArea.Root>
  );
});

function Scrollbar({ orientation }: { readonly orientation: 'vertical' | 'horizontal' }) {
  return (
    <RadixScrollArea.Scrollbar
      orientation={orientation}
      className={cn(
        'flex touch-none select-none p-0.5 transition-colors',
        orientation === 'vertical' ? 'h-full w-2' : 'h-2 w-full flex-col',
      )}
    >
      <RadixScrollArea.Thumb className="relative flex-1 rounded-full bg-border-strong/60 hover:bg-border-strong" />
    </RadixScrollArea.Scrollbar>
  );
}
