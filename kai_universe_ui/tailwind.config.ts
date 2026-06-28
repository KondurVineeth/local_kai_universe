import { semantics, primitives, spacing, radius, iconSize } from './src/shared/design-system/tokens/generated';

import type { Config } from 'tailwindcss';

/*
 * Tailwind theme is derived from src/shared/design-system/tokens/generated.ts
 * (the bridge module produced by `npm run tokens:build` from the Infinity DTCG).
 *
 * `npm run tokens:verify` confirms generated.ts matches the DTCG source.
 *
 * TYPOGRAPHY: use Tailwind's BUILT-IN size utilities, not custom composite
 * plugin classes. Lesson learned 2026-05-06: a custom plugin using
 * `addUtilities()` to emit `text-body-XX-*` was unreliable — Tailwind v3 JIT
 * can silently drop plugin-emitted utilities even when class names are present
 * in source files (see tailwindlabs/tailwindcss discussion #4785). Plain
 * Tailwind utilities are JIT-safe.
 *
 * Mapping (Infinity → Tailwind built-in):
 *   Heading 06 / 20px      → `text-xl`        (+ font-bold/semibold/medium)
 *   Body 03   / 16px       → `text-base`      (+ weight modifier)
 *   Body 04   / 14px       → `text-sm`
 *   Body 05   / 12px       → `text-xs`
 *   Micro     / 11px       → `text-micro`     (dock summaries, panel labels)
 *   Caption   / 10px       → `text-caption`   (badges, timestamps, captions)
 *
 * Convention for which utility to use where (see docs/design-system/token-usage.md):
 *   - bg-{role}-surface-{variant}     → backgrounds, panels, cards, buttons
 *   - text-{role}-text-icon-{variant} → text and icons
 *   - border-{role}-outline-{variant} → borders, dividers
 *   - p/m/gap-{spaceKey}              → spacing (Infinity scale: xxs, xs, s, m, l, xl, 2xl…)
 *   - rounded-{radiusKey}             → corner radius (Infinity: xs, s, m, l, xl…)
 *   - size-icon-{iconKey}             → icon sizing (Infinity: xs=16, s=20, m=24, l=28)
 */

const NAMES = ['primary', 'secondary', 'accent', 'neutral', 'error', 'warning', 'success'] as const;

// Build flat Tailwind color tree from semantics — produces bg-primary-surface-high,
// text-primary-text-icon-heading, border-primary-outline-high, etc.
const semanticColors = NAMES.reduce<Record<string, Record<string, Record<string, string>>>>((acc, role) => {
  const r = semantics[role];
  if (!r) return acc;
  acc[role] = {
    surface: r.surface,
    'text-icon': r.textIcon,
    outline: r.outline,
  };
  return acc;
}, {});

// Page-level convenience aliases — used in <body> safety floor and global states.
const conveniences = {
  'bg-page': semantics.neutral.surface.staticBlack, // #0D0D0D
  'fg-page': semantics.neutral.textIcon.heading,    // #FFFFFF
};

// Pixel-keyed scales from Infinity DTCG.
const spacingScale = Object.fromEntries(Object.entries(spacing).map(([k, v]) => [k, `${v}px`]));
const radiusScale = Object.fromEntries(Object.entries(radius).map(([k, v]) => [k, `${v}px`]));
const iconScale = Object.fromEntries(Object.entries(iconSize).map(([k, v]) => [k, `${v}px`]));

const config: Config = {
  content: ['./src/index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Universal border-color override — see src/app/index.css @layer base.
      borderColor: {
        DEFAULT: semantics.neutral.outline.low, // Neutral/Outline/Low = #262626
      },
      colors: {
        ...semanticColors,
        // Convenience flat keys for body-level styling.
        'bg-page': conveniences['bg-page'],
        'fg-page': conveniences['fg-page'],

        // ──────────────────────────────────────────────────────────────────
        // Surface layering — maps the legacy `bg-bg-*` / `text-fg-*` / etc.
        // class names to the appropriate Infinity semantic tokens. Verified
        // 2026-05-06 against image #64 reference (ZL Universe actual UI):
        //   bg-base = page canvas (#0D0D0D, Static Black)
        //   bg-surface = sidebars + panels (#171717, Surface/Low) — distinct
        //                 from canvas to give depth, NOT same as bg-base
        //   bg-raised = hovers + cards (#262626, Surface/Medium)
        //   bg-active = selected list rows (#404040, Surface/Medium-2)
        // ──────────────────────────────────────────────────────────────────
        bg: {
          base: semantics.neutral.surface.staticBlack,    // #0D0D0D
          surface: semantics.neutral.surface.low,         // #171717
          raised: semantics.neutral.surface.medium,       // #262626
          active: semantics.neutral.surface.medium2,      // #404040
          subtle: semantics.neutral.surface.low,          // #171717
          inverse: semantics.neutral.surface.contrast,    // #FFFFFF
        },
        fg: {
          default: semantics.neutral.textIcon.heading,    // #FFFFFF
          muted: semantics.neutral.textIcon.body,         // #E5E5E5
          subtle: semantics.neutral.textIcon.caption2,    // #A3A3A3
          inverse: semantics.neutral.textIcon.contrast,   // #171717
          accent: semantics.primary.textIcon.caption,     // #4F8DE0
        },
        border: {
          DEFAULT: semantics.neutral.outline.low,         // #262626
          default: semantics.neutral.outline.low,         // #262626
          subtle: semantics.neutral.outline.lowest,       // #171717
          strong: semantics.neutral.outline.medium,       // #404040
        },
        accent: {
          DEFAULT: semantics.primary.surface.high,        // #1D6CD7
          hover: semantics.primary.surface.highest,       // #4F8DE0
          subtle: 'rgba(29, 108, 215, 0.14)',
        },
        danger: {
          DEFAULT: semantics.error.surface.high,
          subtle: 'rgba(239, 68, 68, 0.16)',
        },
        warning: {
          DEFAULT: semantics.warning.surface.high,
          subtle: 'rgba(249, 162, 22, 0.16)',
        },
        success: {
          DEFAULT: semantics.success.surface.high,
          subtle: 'rgba(16, 185, 129, 0.16)',
        },

        // Primitive ramps available for one-off use (prefer semantics where possible).
        blue: primitives.Blue,
        neutralRamp: primitives.Neutral,
        errorRamp: primitives.Error,
        warningRamp: primitives.Warning,
        successRamp: primitives.Success,
      },
      spacing: spacingScale,
      borderRadius: radiusScale,
      width: iconScale,
      height: iconScale,
      fontFamily: {
        title: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Urbanist', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Urbanist', 'Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      // Sub-`text-xs` aliases for the metadata tier. Per CLAUDE.md UX rule 3
      // ("only design tokens"), `text-[10px]` and `text-[11px]` are forbidden
      // post-sweep — use these named keys so a single token swap (e.g. the
      // Yellowchalk DS handoff on 2026-05-13) updates every call site.
      fontSize: {
        caption: ['10px', { lineHeight: '14px' }],
        micro: ['11px', { lineHeight: '15px' }],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
        md: '0 4px 12px rgba(0, 0, 0, 0.35)',
        lg: '0 12px 32px rgba(0, 0, 0, 0.45)',
      },
      // Micro-animation primitives. Use sparingly — every interaction deserves
      // feedback, but motion that loops or repeats becomes noise. Durations are
      // <300ms (Doherty Threshold) so the UI feels instant.
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 250ms ease-out',
        'fade-in': 'fade-in 200ms ease-out',
        'slide-in-right': 'slide-in-right 200ms ease-out',
        'slide-in-left': 'slide-in-left 200ms ease-out',
        'scale-in': 'scale-in 150ms ease-out',
      },
      transitionDuration: {
        instant: '100ms',
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [],
};

export default config;
