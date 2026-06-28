import { Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';

// Tiny ring chart showing the fraction of the context window used. Tone
// shifts subtle → warning → danger as the window fills (≥60% / ≥85%).
//
// Stroke-dasharray trick: circumference = 2πr; the visible arc length =
// pct * circumference. Stroke-dashoffset is negative-rotated 90° via the
// SVG transform so the fill starts at 12 o'clock (UX intuition: clock-face
// progress).
export function ContextUsageDial({ pct }: { readonly pct: number }) {
  // Coerce non-finite input (NaN from `usedTokens / 0`, Infinity, undefined
  // upstream) to 0 BEFORE clamping. NaN compared to numbers is always false,
  // which made `tone` fall through to `text-danger` and rendered an empty
  // thread red with "NaN%". (BUG-CHAT-COMPOSE-011)
  const safe = Number.isFinite(pct) ? pct : 0;
  const clamped = Math.max(0, Math.min(100, safe));
  // Tone classification uses `clamped` so out-of-range inputs (e.g. >100)
  // can't bypass the danger threshold by reading raw. (BUG-CHAT-COMPOSE-012)
  const tone = clamped < 60 ? 'text-fg-subtle' : clamped < 85 ? 'text-warning' : 'text-danger';
  const radius = 5;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  return (
    <Tooltip content={`Context window ${clamped}% used`} side="top">
      <span className={cn('inline-flex items-center gap-1', tone)}>
        <svg
          width={12}
          height={12}
          viewBox="0 0 12 12"
          aria-hidden
          className="shrink-0"
        >
          {/* Track */}
          <circle
            cx={6}
            cy={6}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeWidth={1.5}
          />
          {/* Filled arc — rotated -90° so 0% sits at 12 o'clock */}
          <circle
            cx={6}
            cy={6}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform="rotate(-90 6 6)"
          />
        </svg>
        <span>{clamped}%</span>
      </span>
    </Tooltip>
  );
}
