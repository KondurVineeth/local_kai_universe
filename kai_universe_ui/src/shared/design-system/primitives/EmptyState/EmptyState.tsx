import { type ReactNode } from 'react';

import { Icon } from '../Icon';

import type { IconType } from '../Icon';

export interface EmptyStateProps {
  readonly icon?: IconType;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 px-6 py-8 text-center ${className ?? ''}`}
    >
      {icon && <Icon icon={icon} size="lg" className="text-fg-subtle" />}
      <p className="text-xs font-medium text-fg-default">{title}</p>
      {description && <p className="max-w-xs text-caption text-fg-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
