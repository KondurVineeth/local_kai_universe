import { cn } from '@shared/lib/cn';

export type ProgressBarTone = 'accent' | 'success' | 'warning' | 'danger';

export interface ProgressBarProps {
  readonly value: number;
  readonly max?: number;
  readonly tone?: ProgressBarTone;
  readonly indeterminate?: boolean;
  readonly className?: string;
  readonly trackClassName?: string;
  readonly label?: string;
}

const TONE_CLASSES: Record<ProgressBarTone, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function ProgressBar({
  value,
  max = 100,
  tone = 'accent',
  indeterminate = false,
  className,
  trackClassName,
  label,
}: ProgressBarProps) {
  const safeMax = max <= 0 ? 100 : max;
  const ratio = Math.max(0, Math.min(1, value / safeMax));
  const percent = Math.round(ratio * 100);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={indeterminate ? undefined : value}
      aria-label={label}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-bg-subtle', trackClassName, className)}
    >
      <div
        className={cn(
          'h-full transition-[width] duration-150 ease-out',
          TONE_CLASSES[tone],
          indeterminate && 'animate-pulse',
        )}
        style={{ width: indeterminate ? '40%' : `${percent}%` }}
      />
    </div>
  );
}
