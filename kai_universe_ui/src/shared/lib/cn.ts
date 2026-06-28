import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind-aware className composer used by every component to merge variants
// without breaking the cascade.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
