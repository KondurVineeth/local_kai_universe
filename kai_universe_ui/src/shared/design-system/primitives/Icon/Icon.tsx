import { cn } from '@shared/lib/cn';

import type { IconProps, IconSize } from './Icon.types';

const SIZE_PIXELS: Record<IconSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

export function Icon({
  icon: IconComponent,
  size = 'md',
  weight = 'regular',
  className,
  color,
  mirrored,
  alt,
}: IconProps) {
  return (
    <IconComponent
      size={SIZE_PIXELS[size]}
      weight={weight}
      color={color}
      mirrored={mirrored}
      alt={alt}
      className={cn('flex-shrink-0', className)}
      aria-hidden={alt ? undefined : true}
    />
  );
}
