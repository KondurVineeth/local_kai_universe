// Token name registry. Use these constants instead of inline strings when
// referencing CSS variables in TS — protects against typos at compile time.

export const colorTokens = {
  bg: {
    base: 'var(--color-bg-base)',
    surface: 'var(--color-bg-surface)',
    raised: 'var(--color-bg-raised)',
    subtle: 'var(--color-bg-subtle)',
    inverse: 'var(--color-bg-inverse)',
  },
  fg: {
    default: 'var(--color-fg-default)',
    muted: 'var(--color-fg-muted)',
    subtle: 'var(--color-fg-subtle)',
    inverse: 'var(--color-fg-inverse)',
    accent: 'var(--color-fg-accent)',
  },
  border: {
    default: 'var(--color-border-default)',
    subtle: 'var(--color-border-subtle)',
    strong: 'var(--color-border-strong)',
  },
  accent: {
    DEFAULT: 'var(--color-accent)',
    hover: 'var(--color-accent-hover)',
    subtle: 'var(--color-accent-subtle)',
  },
  danger: {
    DEFAULT: 'var(--color-danger)',
    subtle: 'var(--color-danger-subtle)',
  },
} as const;

export const radiusTokens = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: 'var(--radius-full)',
} as const;

export const fontSizeTokens = {
  xs: 'var(--font-size-xs)',
  sm: 'var(--font-size-sm)',
  base: 'var(--font-size-base)',
  lg: 'var(--font-size-lg)',
  xl: 'var(--font-size-xl)',
  '2xl': 'var(--font-size-2xl)',
} as const;
