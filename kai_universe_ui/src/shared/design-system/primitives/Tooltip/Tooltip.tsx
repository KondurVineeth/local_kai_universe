import * as RadixTooltip from '@radix-ui/react-tooltip';
import { type ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

export interface TooltipProps {
  readonly children: ReactNode;
  readonly content: ReactNode;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly align?: 'start' | 'center' | 'end';
  readonly delayMs?: number;
  readonly disabled?: boolean;
  readonly contentClassName?: string;
}

export function Tooltip({
  children,
  content,
  side = 'right',
  align = 'center',
  delayMs = 250,
  disabled = false,
  contentClassName,
}: TooltipProps) {
  if (disabled) return <>{children}</>;
  return (
    <RadixTooltip.Provider delayDuration={delayMs}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              // Body 05/Regular = 12px Urbanist 400 (text-xs). Tight leading
              // (1.1) keeps the chip compact — tooltips are quiet UI.
              'z-50 rounded-md border border-border-default bg-bg-raised px-2 py-0.5 text-xs leading-[1.1] text-fg-default shadow-md',
              'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
              contentClassName,
            )}
          >
            {content}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
