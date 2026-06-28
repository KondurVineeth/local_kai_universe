import { cn } from '@shared/lib/cn';

// Step indicator dots for the onboarding wizard. Active dot is filled with
// the accent token; visited dots are muted; future dots are subtle. Pure
// presentational — fed by the layout from the URL.
interface OnboardingProgressProps {
  readonly total: number;
  readonly currentIdx: number;
}

export function OnboardingProgress({ total, currentIdx }: OnboardingProgressProps) {
  return (
    <ol
      className="flex items-center gap-s"
      aria-label="Onboarding progress"
      aria-current="step"
    >
      {Array.from({ length: total }, (_, i) => {
        const visited = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li
            key={i}
            aria-current={active ? 'step' : undefined}
            aria-label={`Step ${i + 1} of ${total}${active ? ' (current)' : ''}`}
            className={cn(
              'h-1.5 rounded-full transition-all',
              active ? 'w-l bg-accent' : 'w-3 bg-bg-active',
              visited && 'bg-accent-hover',
            )}
          />
        );
      })}
    </ol>
  );
}
