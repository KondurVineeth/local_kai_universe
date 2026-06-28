import * as RadixSwitch from '@radix-ui/react-switch';
import { forwardRef } from 'react';

import { cn } from '@shared/lib/cn';

export interface SwitchProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadixSwitch.Root>, 'asChild'> {
  readonly className?: string;
}

// Toggle for binary on/off settings (integrations, feature flags, theme).
// Accent-colored when on. 28×16 track / 12×12 thumb — sized to read in dense
// rows like the integrations panel.
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { className, ...rest },
  ref,
) {
  return (
    <RadixSwitch.Root
      ref={ref}
      className={cn(
        'relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full',
        // Off-state uses Surface/Medium-2 (#404040 = bg-bg-active) so the
        // pill stays visible against bg-bg-raised (#262626) panel surfaces;
        // bg-bg-raised would render the off-state invisible inside the
        // right-rail accordion cards.
        'bg-bg-active transition-colors',
        'data-[state=checked]:bg-accent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      <RadixSwitch.Thumb
        className={cn(
          'pointer-events-none block h-3 w-3 translate-x-0.5 rounded-full bg-fg-default shadow-sm',
          'transition-transform duration-150 ease-out',
          // Knob stays bg-fg-default (white) in BOTH states. The earlier
          // checked-state flip to bg-fg-inverse rendered the knob dark on
          // the accent track — read as "missing" against the blue.
          'data-[state=checked]:translate-x-3.5',
        )}
      />
    </RadixSwitch.Root>
  );
});
