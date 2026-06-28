import { CircleNotch } from '@phosphor-icons/react';

import { cn } from '@shared/lib/cn';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  readonly size?: SpinnerSize;
  readonly className?: string;
  readonly label?: string;
}

const SIZE_PIXELS: Record<SpinnerSize, number> = { xs: 12, sm: 14, md: 16, lg: 24 };

export function Spinner({ size = 'sm', className, label }: SpinnerProps) {
  return (
    <CircleNotch
      size={SIZE_PIXELS[size]}
      weight="bold"
      className={cn('animate-spin text-fg-muted', className)}
      aria-label={label ?? 'Loading'}
      role="status"
    />
  );
}
