import { CaretDown } from '@phosphor-icons/react';
import { forwardRef, type SelectHTMLAttributes } from 'react';

import { cn } from '@shared/lib/cn';

import { Icon } from '../Icon';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  readonly options: readonly SelectOption[];
  readonly placeholder?: string;
}

// Native <select> dressed for the dark surface. Native is deliberate — it
// inherits keyboard a11y, screen-reader behaviour, and platform-correct menu
// rendering for free. The custom caret on the right is just decorative; the
// real chevron the OS draws is hidden via `appearance-none`.
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, className, ...rest },
  ref,
) {
  return (
    <span className="relative inline-flex w-full">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-md border border-border-strong bg-bg-base',
          'px-2 py-1.5 pr-7 text-xs text-fg-default',
          'focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 disabled:text-fg-muted',
          className,
        )}
        {...rest}
      >
        {placeholder !== undefined && (
          <option value="" disabled hidden={!!rest.value}>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-fg-subtle">
        <Icon icon={CaretDown} size="xs" />
      </span>
    </span>
  );
});
