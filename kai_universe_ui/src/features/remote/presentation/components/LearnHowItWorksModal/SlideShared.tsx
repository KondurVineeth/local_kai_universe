import { cn } from '@shared/lib/cn';

export function NewFeatureBadge() {
  return (
    <span
      className="self-start rounded px-2 py-0.5 text-caption font-bold uppercase tracking-wider text-fg-default"
      style={{ backgroundColor: 'var(--color-accent-surface-low)' }}
    >
      New Feature
    </span>
  );
}

export function SlideLeft({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col gap-xl p-10">
      <NewFeatureBadge />
      {children}
    </div>
  );
}

export function DotIndicator({
  total,
  active,
  onSelect,
}: {
  readonly total: number;
  readonly active: number;
  readonly onSelect?: (i: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect?.(i)}
          aria-label={`Go to slide ${i + 1}`}
          aria-current={i === active ? 'true' : undefined}
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            i === active ? 'bg-fg-default' : 'bg-fg-subtle opacity-40 hover:opacity-70',
          )}
        />
      ))}
    </div>
  );
}
