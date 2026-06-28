import type { IconType } from '@shared/ds/primitives';

export interface PrimaryNavItem {
  readonly key: string;
  readonly label: string;
  readonly to: string;
  readonly icon: IconType;
}
