import universeMark from '@shared/assets/brand/universe.png';

// Universe brand mark — galaxy spiral. Sized via prop so the same asset
// renders at the small header size (24px) and the welcome-screen hero
// size (96px). Vite inlines/optimises the PNG at build time.
//
// `loading="eager"` because the mark is above the fold on every screen
// it appears on; we want it painted on first frame, not lazy-loaded.
export function OnboardingMark({ size = 24 }: { readonly size?: number }) {
  return (
    <img
      src={universeMark}
      width={size}
      height={size}
      alt="Universe"
      loading="eager"
      decoding="sync"
      className="select-none"
      draggable={false}
    />
  );
}
