import { SlideLeft } from './SlideShared';

export function Slide3() {
  return (
    <div className="flex h-full">
      <SlideLeft>
        <div className="flex flex-col gap-m">
          <p className="text-[10px] font-medium uppercase tracking-widest text-fg-subtle">
            Your devices, linked together
          </p>
          <h2 className="text-xl font-bold text-fg-default">
            With end-to-end encrypted networking.
          </h2>
          <p className="text-sm text-fg-subtle leading-relaxed">
            All data and communication between Remote Link devices is private and secure.
          </p>
          <p className="text-sm text-fg-subtle leading-relaxed">
            Remote Link is built on top of custom Tailscale mesh VPN, so your devices are
            never exposed to the public Internet.
          </p>
        </div>
      </SlideLeft>
      <div className="flex flex-1 items-center justify-center"
        style={{ backgroundColor: 'var(--color-base-colours-background)' }}>
        <EncryptedMeshIllustration />
      </div>
    </div>
  );
}

// Three devices in a triangle formation connected by dashed encrypted tunnels,
// with a lock badge in the centre. Mirrors Slide 1's black-panel aesthetic.
function EncryptedMeshIllustration() {
  const PURPLE = 'var(--color-accent-surface-medium)';

  // Triangle vertices
  const top   = { x: 200, y:  60 };
  const left  = { x:  70, y: 240 };
  const right = { x: 330, y: 240 };

  return (
    <svg
      viewBox="0 0 400 310"
      width="340"
      height="264"
      aria-hidden
      role="presentation"
    >
      {/* Encrypted mesh lines — dashed purple tunnels */}
      {([
        [top,   left],
        [top,   right],
        [left,  right],
      ] as const).map(([a, b], i) => (
        <line
          key={i}
          x1={a.x} y1={a.y}
          x2={b.x} y2={b.y}
          stroke={PURPLE}
          strokeWidth="1.5"
          strokeDasharray="6 5"
          opacity="0.55"
        />
      ))}

      {/* Lock badge in centre */}
      <LockBadge cx={200} cy={155} purple={PURPLE} />

      {/* Device nodes */}
      <ServerNode cx={top.x}   cy={top.y} />
      <LaptopNode cx={left.x}  cy={left.y} />
      <DeviceNode cx={right.x} cy={right.y} />
    </svg>
  );
}

function LockBadge({ cx, cy, purple }: { cx: number; cy: number; purple: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="22" style={{ fill: 'var(--color-neutral-surface-lowest)' }} stroke={purple} strokeWidth="1.5" />
      {/* lock body */}
      <rect x={cx - 8} y={cy - 2} width="16" height="12" rx="2"
        fill="none" stroke="var(--color-neutral-surface-contrast)" strokeWidth="1.5" />
      {/* shackle */}
      <path d={`M${cx - 5} ${cy - 2} v-5 a5 5 0 0 1 10 0 v5`}
        fill="none" stroke="var(--color-neutral-surface-contrast)" strokeWidth="1.5" strokeLinecap="round" />
      {/* keyhole */}
      <circle cx={cx} cy={cy + 4} r="2" fill="var(--color-neutral-surface-contrast)" />
    </g>
  );
}

function ServerNode({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="28" style={{ fill: 'var(--color-neutral-surface-low)', stroke: 'var(--color-neutral-surface-medium2)' }} strokeWidth="1" />
      <rect x={cx - 14} y={cy - 14} width="28" height="28" rx="4"
        fill="none" stroke="var(--color-neutral-surface-contrast)" strokeWidth="1.8" />
      <rect x={cx - 9} y={cy - 7} width="18" height="4" rx="1"
        fill="none" stroke="var(--color-neutral-surface-contrast)" strokeWidth="1.2" />
      <rect x={cx - 9} y={cy + 1} width="18" height="4" rx="1"
        fill="none" stroke="var(--color-neutral-surface-contrast)" strokeWidth="1.2" />
      <circle cx={cx + 8} cy={cy + 10} r="2" fill="var(--color-neutral-surface-contrast)" />
    </g>
  );
}

function LaptopNode({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="28" style={{ fill: 'var(--color-neutral-surface-low)', stroke: 'var(--color-neutral-surface-medium2)' }} strokeWidth="1" />
      <rect x={cx - 14} y={cy - 12} width="28" height="20" rx="2"
        fill="none" stroke="var(--color-neutral-surface-contrast)" strokeWidth="1.8" />
      <line x1={cx - 18} y1={cy + 8} x2={cx + 18} y2={cy + 8}
        stroke="var(--color-neutral-surface-contrast)" strokeWidth="1.8" strokeLinecap="round" />
      <path d={`M${cx - 18} ${cy + 8} Q${cx} ${cy + 14} ${cx + 18} ${cy + 8}`}
        fill="none" stroke="var(--color-neutral-surface-contrast)" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

function DeviceNode({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="28" style={{ fill: 'var(--color-neutral-surface-low)', stroke: 'var(--color-neutral-surface-medium2)' }} strokeWidth="1" />
      <rect x={cx - 10} y={cy - 16} width="20" height="32" rx="4"
        fill="none" stroke="var(--color-neutral-surface-contrast)" strokeWidth="1.8" />
      <line x1={cx - 4} y1={cy + 10} x2={cx + 4} y2={cy + 10}
        stroke="var(--color-neutral-surface-contrast)" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}
