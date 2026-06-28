import { forwardRef } from 'react';

import { cn } from '@shared/lib/cn';

import type { PanelProps, PanelTone } from './Panel.types';

const TONE_CLASSES: Record<PanelTone, string> = {
  surface: 'bg-bg-surface',
  raised: 'bg-bg-raised',
  subtle: 'bg-bg-subtle',
  flush: 'bg-transparent',
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  {
    tone = 'surface',
    bordered = false,
    header,
    footer,
    padded = true,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col rounded-m',
        TONE_CLASSES[tone],
        bordered && 'border border-border-default',
        className,
      )}
      {...rest}
    >
      {header && (
        <div className="flex items-center justify-between border-b border-border-default px-4 py-2 text-xs font-medium text-fg-default">
          {header}
        </div>
      )}
      <div className={cn(padded ? 'p-4' : 'p-0', 'flex-1')}>{children}</div>
      {footer && (
        <div className="flex items-center justify-between border-t border-border-default px-4 py-2 text-caption text-fg-muted">
          {footer}
        </div>
      )}
    </div>
  );
});
