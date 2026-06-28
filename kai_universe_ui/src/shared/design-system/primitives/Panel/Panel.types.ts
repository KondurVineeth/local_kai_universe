import type { HTMLAttributes, ReactNode } from 'react';

export type PanelTone = 'surface' | 'raised' | 'subtle' | 'flush';

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly tone?: PanelTone;
  readonly bordered?: boolean;
  readonly header?: ReactNode;
  readonly footer?: ReactNode;
  readonly padded?: boolean;
}
