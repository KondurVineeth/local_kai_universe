import { SlideLeft } from './SlideShared';

export function Slide1() {
  return (
    <div className="flex h-full">
      <SlideLeft>
        <div className="flex flex-col gap-m">
          <p className="text-[10px] font-medium uppercase tracking-widest text-fg-subtle">
            Introducing: Remote Link
          </p>
          <h2 className="text-xl font-bold text-fg-default">Your own private AI network.</h2>
          <p className="text-sm text-fg-subtle leading-relaxed">
            Use Remote Link to access your local models wherever you are, over a secure and
            end-to-end encrypted connection.
          </p>
          <p className="text-sm text-fg-subtle leading-relaxed">
            Seamlessly integrated into the Universe experience. Launching in partnership
            with Tailscale.
          </p>
        </div>
      </SlideLeft>
      <div className="flex flex-1 items-center justify-center"
        style={{ backgroundColor: 'var(--color-base-colours-background)' }}>
        <ServerLaptopHero />
      </div>
    </div>
  );
}

function ServerLaptopHero() {
  return (
    <svg viewBox="0 0 340 180" width="340" height="180" aria-hidden role="presentation">
      <rect x="20" y="60" width="80" height="60" rx="8" fill="none" stroke="var(--color-neutral-surface-contrast)" strokeWidth="3" />
      <rect x="32" y="76" width="56" height="8" rx="2" fill="none" stroke="var(--color-neutral-surface-contrast)" strokeWidth="2" />
      <rect x="32" y="92" width="56" height="8" rx="2" fill="none" stroke="var(--color-neutral-surface-contrast)" strokeWidth="2" />
      <circle cx="86" cy="108" r="3" fill="var(--color-neutral-surface-contrast)" />
      <path
        d="M105 90 C130 70 155 110 180 90 C205 70 230 110 240 90"
        fill="none"
        stroke="var(--color-neutral-surface-contrast)"
        strokeWidth="2"
        strokeDasharray="6 4"
        opacity="0.7"
      />
      <rect x="248" y="55" width="72" height="52" rx="4" fill="none" stroke="var(--color-neutral-surface-contrast)" strokeWidth="3" />
      <line x1="232" y1="107" x2="336" y2="107" stroke="var(--color-neutral-surface-contrast)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M228 112 H340" stroke="var(--color-neutral-surface-contrast)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
