import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@shared/lib/cn';

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  readonly value: number;
  readonly onValueChange: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}

// Slim numeric range input. Native <input type="range"> styled to match the
// dark surface — keeping it native means free keyboard support, accessibility,
// and zero radix dependency. The track is a thin pill with an accent thumb.
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { value, onValueChange, min = 0, max = 100, step = 1, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onValueChange(Number(e.target.value))}
      className={cn(
        // Track uses Surface/Medium-2 (bg-bg-active = #404040) so it stays
        // visible against bg-bg-raised (#262626) panel containers; the
        // previous bg-bg-raised track rendered invisible inside the right
        // rail's accordion cards.
        'h-1 w-full cursor-pointer appearance-none rounded-full bg-bg-active',
        'accent-accent',
        '[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3',
        '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
        '[&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer',
        '[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full',
        '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
        className,
      )}
      {...rest}
    />
  );
});
