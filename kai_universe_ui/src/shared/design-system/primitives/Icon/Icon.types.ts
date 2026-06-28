import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

export interface IconProps {
  readonly icon: PhosphorIcon;
  readonly size?: IconSize;
  readonly weight?: IconWeight;
  readonly className?: string;
  readonly color?: string;
  readonly mirrored?: boolean;
  readonly alt?: string;
}

// Re-export the Phosphor icon component type so feature code can type a
// `LucideIcon`-style prop using `IconType` instead of importing from
// `@phosphor-icons/react` directly.
export type IconType = PhosphorIcon;
