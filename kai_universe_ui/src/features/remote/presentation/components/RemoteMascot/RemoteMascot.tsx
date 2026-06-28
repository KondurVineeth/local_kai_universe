// Shared inline-SVG mascot — two rounded bots joined by a curved cord.
// Previously duplicated verbatim in RemotePage and LandingScreen; folded
// into one component so a colour/shape tweak is a single edit. No asset
// pipeline dependency, scales cleanly, and uses the accent token so the
// swap to Yellowchalk colours is one CSS-variable change.
export function RemoteMascot() {
  return (
    <svg
      viewBox="0 0 200 88"
      width="200"
      height="88"
      role="presentation"
      aria-hidden
      style={{ color: 'var(--color-accent-surface-medium)' }}
    >
      <path
        d="M62 56 Q100 92 138 56"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />
      <Bot cx={50} eyeOffset={-1} />
      <Bot cx={150} eyeOffset={1} />
    </svg>
  );
}

function Bot({ cx, eyeOffset }: { readonly cx: number; readonly eyeOffset: number }) {
  return (
    <g>
      <line x1={cx} y1={4} x2={cx} y2={14} stroke="currentColor" strokeWidth="2" />
      <circle cx={cx} cy={4} r="2" fill="currentColor" />
      <rect x={cx - 18} y={14} width={36} height={42} rx={8} fill="currentColor" />
      <circle cx={cx - 6 + eyeOffset} cy={32} r="3" style={{ fill: 'var(--color-base-colours-background)' }} />
      <circle cx={cx + 6 + eyeOffset} cy={32} r="3" style={{ fill: 'var(--color-base-colours-background)' }} />
      <rect x={cx - 22} y={26} width={4} height={14} rx={2} fill="currentColor" />
      <rect x={cx + 18} y={26} width={4} height={14} rx={2} fill="currentColor" />
    </g>
  );
}
