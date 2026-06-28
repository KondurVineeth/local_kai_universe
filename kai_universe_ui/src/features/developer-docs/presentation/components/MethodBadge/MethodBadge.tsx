import { cn } from '@shared/lib/cn';

import type { HttpMethod } from '../../../domain/entities/DocPage';

const CLASSES: Readonly<Record<HttpMethod, string>> = {
  GET: 'bg-accent-subtle text-fg-accent',
  POST: 'bg-success-subtle text-success',
};

export function MethodBadge({ method }: { readonly method: HttpMethod }) {
  return (
    <span
      className={cn(
        'inline-flex h-4 shrink-0 items-center rounded-xs px-1 font-mono text-caption font-bold uppercase tracking-wide',
        CLASSES[method],
      )}
    >
      {method}
    </span>
  );
}
