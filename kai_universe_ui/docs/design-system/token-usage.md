# Token Usage Guide — Infinity DS on Desktop

> Which Infinity token to use where in the ZL Universe FE codebase.
> Source of truth: `src/shared/design-system/tokens/source/` (DTCG export from Figma).
> Verified by `npm run tokens:verify` — 260/260 token values match source.

## What transfers from Infinity (mobile) → desktop

Infinity Design System is mobile-first, but **token values transfer cleanly across platforms** for these categories:
- ✅ **Color primitives** (Blue, Neutral, Error, Warning, Success ramps) — colors are colors
- ✅ **Color semantics** (Primary/Surface/High, Neutral/Text·Icon/Heading, etc.) — semantic roles are platform-agnostic
- ✅ **Corner radius** — works at any size
- ✅ **Box shadow** — works at any size
- ⚠️ **Spacing scale** — values are usable but desktop tends toward denser layouts (use the smaller t-shirt sizes more aggressively than mobile would)
- ⚠️ **Font sizes** — Infinity scale is mobile-tuned. Body 03 (16px) maps to desktop card titles, Body 05 (12px) to captions. Avoid Body 01 (20px) for body text — too large on desktop.
- ⚠️ **Icon sizes** — Infinity has xs(16) / s(20) / m(24) / l(28). Desktop sidebar rails use xs (16). Modal/page icons use s or m.
- ❌ **Component heights** (button, input, etc.) — mobile sizes are too tall for desktop. We define our own.

## Tailwind utility class conventions

Every Tailwind color class follows: `<utility>-<role>-<layer>-<variant>`

| Utility | Layer | Examples |
|---|---|---|
| `bg-…` | `surface` | `bg-primary-surface-high`, `bg-neutral-surface-low` |
| `text-…` | `text-icon` | `text-neutral-text-icon-heading`, `text-primary-text-icon-caption` |
| `border-…` | `outline` | `border-neutral-outline-low`, `border-primary-outline-high` |

**Roles:** `primary` (blue brand), `secondary` (peach), `accent` (pink), `neutral` (greys), `error`, `warning`, `success`.

**Surface variants:** `lowest`, `low`, `medium`, `high`, `highest`, `disabled`, `contrast`, `staticBlack`. (Neutral has additionally `medium2`, `medium3`.)

**Text·Icon variants:** `heading`, `body`, `caption`, `disabled`, `contrast`, `staticBlack`. (Neutral has additionally `caption2`.)

**Outline variants:** `lowest`, `low`, `medium`, `high`, `highest`.

## Element → Token mapping (App Shell + common patterns)

### Page / canvas

| Element | Class | Resolves to | Source token |
|---|---|---|---|
| `<body>` background | inline `style="background-color: #0D0D0D"` | `#0D0D0D` | Base Colours/Background |
| Default page text color | inline `style="color: #FFFFFF"` | `#FFFFFF` | Neutral/Text·Icon/Heading |
| Default border color | `@layer base { *, ::before, ::after { border-color: #262626 } }` | `#262626` | Neutral/Outline/Low |

### Surfaces (panels, cards)

| Element | Class | Resolves to | Source token |
|---|---|---|---|
| Sidebar bg | `bg-neutral-surface-low` | `#171717` | Neutral/Surface/Low |
| Card / raised panel | `bg-neutral-surface-medium` | `#262626` | Neutral/Surface/Medium |
| Hover bg on lists | `hover:bg-neutral-surface-medium` | `#262626` | Neutral/Surface/Medium |
| Selected/active list item | `bg-neutral-surface-medium2` | `#404040` | Neutral/Surface/Medium 2 |
| Modal/dialog bg | `bg-neutral-surface-medium` | `#262626` | Neutral/Surface/Medium |
| Tooltip bg | `bg-neutral-surface-medium2` | `#404040` | Neutral/Surface/Medium 2 |

### Text

| Element | Class | Resolves to | Source token |
|---|---|---|---|
| Primary heading | `text-neutral-text-icon-heading` | `#FFFFFF` | Neutral/Text·Icon/Heading |
| Body / paragraph | `text-neutral-text-icon-body` | `#E5E5E5` | Neutral/Text·Icon/Body |
| Caption / metadata | `text-neutral-text-icon-caption` | `#D4D4D4` | Neutral/Text·Icon/Caption |
| Tertiary / placeholder | `text-neutral-text-icon-caption2` | `#A3A3A3` | Neutral/Text·Icon/Caption 2 |
| Disabled | `text-neutral-text-icon-disabled` | `#737373` | Neutral/Text·Icon/Disabled |

### Borders / outlines

| Element | Class | Resolves to | Source token |
|---|---|---|---|
| Subtle divider (between list items) | `border-neutral-outline-lowest` | `#171717` | Neutral/Outline/Lowest |
| Default border (panels, inputs) | `border-neutral-outline-low` | `#262626` | Neutral/Outline/Low |
| Strong border / focus ring | `border-neutral-outline-medium` | `#404040` | Neutral/Outline/Medium |

### Brand actions (primary CTAs)

| Element | Class | Resolves to | Source token |
|---|---|---|---|
| Primary button bg | `bg-primary-surface-high` | `#1D6CD7` | Primary/Surface/High |
| Primary button hover | `bg-primary-surface-highest` | `#4F8DE0` | Primary/Surface/Highest |
| Primary button disabled | `bg-primary-surface-disabled` | `#022554` | Primary/Surface/Disabled |
| Primary button text | `text-neutral-text-icon-heading` | `#FFFFFF` | (white text on blue) |
| Inline link | `text-primary-text-icon-caption` | `#4F8DE0` | Primary/Text·Icon/Caption |
| Selected tab pill | `bg-primary-surface-high` | `#1D6CD7` | Primary/Surface/High |

### Status (destructive / warning / success)

| Element | Class | Resolves to | Source token |
|---|---|---|---|
| Destructive button (e.g., Cancel Job) | `bg-error-surface-high` | `#EF4444` | Error/Surface/High |
| Destructive border / icon | `text-error-text-icon-caption` | `#F87171` | Error/Text·Icon/Caption |
| Warning indicator | `bg-warning-surface-high` | `#F9A216` | Warning/Surface/High |
| Success badge / Ongoing chip | `bg-success-surface-high` | `#10B981` | Success/Surface/High |

### Typography composites (text utilities)

These map Infinity's named text styles to single Tailwind classes via the `typographyPlugin` in `tailwind.config.ts`. Each composite is `<family> <font-size> <weight> <line-height-1.4>`.

| Class | Size / Weight / Family | Use |
|---|---|---|
| `text-title-01-bold` | 42 / 700 / Geist | Hero / page title (rare on desktop) |
| `text-title-02-bold` | 38 / 700 / Geist | Large screen heading |
| `text-title-03-bold` | 32 / 700 / Geist | Section hero |
| `text-title-04-bold` | 28 / 700 / Geist | Major heading |
| `text-title-05-bold` | 24 / 700 / Geist | Page heading |
| `text-body-01-regular` | 20 / 400 / Urbanist | Lead paragraph |
| `text-body-02-semi-bold` | 18 / 600 / Urbanist | Subheading |
| `text-body-03-bold` | 16 / 700 / Urbanist | Section heading (e.g., "AI Models") |
| `text-body-03-semi-bold` | 16 / 600 / Urbanist | Card title (large) |
| `text-body-03-regular` | 16 / 400 / Urbanist | Body copy |
| `text-body-04-semi-bold` | 14 / 600 / Urbanist | Card title / list item title |
| `text-body-04-bold` | 14 / 700 / Urbanist | Bold inline emphasis |
| `text-body-04-regular` | 14 / 400 / Urbanist | Default body, list item descriptions |
| `text-body-05-semi-bold` | 12 / 600 / Urbanist | Button label, link, tag |
| `text-body-05-regular` | 12 / 400 / Urbanist | Caption, metadata, helper text |
| `text-body-06-regular` | 10 / 400 / Urbanist | Tiny label (use sparingly) |

Each composite also has Medium weight variants (`-medium`); use Regular by default, SemiBold/Bold for emphasis.

### Spacing

| Token (Tailwind) | px | Use |
|---|---|---|
| `gap-xxs` / `p-xxs` | 0 | Touching elements |
| `gap-xs` / `p-xs` | 2 | Tight gaps (icon-text in chips) |
| `gap-s` / `p-s` | 4 | Compact list spacing |
| `gap-m` / `p-m` | 8 | Default vertical spacing in dense layouts |
| `gap-l` / `p-l` | 12 | Default horizontal padding (button) |
| `gap-xl` / `p-xl` | 16 | Section internal padding |
| `gap-2xl` / `p-2xl` | 20 | Card padding |
| `gap-3xl` / `p-3xl` | 24 | Section vertical rhythm |
| `gap-4xl` / `p-4xl` | 28 | Modal/dialog internal padding |
| `gap-5xl` / `p-5xl` | 32 | Major section gaps |

Desktop tip: prefer `m` (8px) and `l` (12px) for most internal spacing. Use `xl`+ only at section boundaries.

### Corner radius

| Token (Tailwind) | px | Use |
|---|---|---|
| `rounded-3xs` | 0 | Square (no radius) |
| `rounded-2xs` | 2 | Subtle (very small chips) |
| `rounded-xs` | 4 | Default for inputs, small buttons |
| `rounded-s` | 8 | Cards, panels |
| `rounded-m` | 12 | Modal corners, larger cards |
| `rounded-l` | 16 | Large container corners |
| `rounded-rounded` | 1000 | Pills, fully rounded buttons |

Desktop tip: most components want `rounded-xs` (4px) or `rounded-s` (8px). `rounded-rounded` for pill tabs/segmented controls.

### Icon sizing

| Token (Tailwind) | px | Use |
|---|---|---|
| `w-xs` / `h-xs` | 16 | Sidebar rail icons, inline action icons |
| `w-s` / `h-s` | 20 | Button leading/trailing icons |
| `w-m` / `h-m` | 24 | Modal/page-level icons |
| `w-l` / `h-l` | 28 | Header icons, large CTAs |

## Decision flow when picking a token

1. **What role?** Brand action → `primary`. Destructive → `error`. Status → `success`/`warning`. Neutral UI → `neutral`. Special accents → `secondary` or `accent`.
2. **What layer?** Background → `surface`. Text/icon → `text-icon`. Border → `outline`.
3. **What variant?** Default surface = `medium`. Hover = `medium-2` or `high`. Active = highest. Subtle borders = `low`. Strong = `high`.

## When the token doesn't fit

If you find yourself wanting a value that isn't in the Infinity ramp, **first check the screenshots/Figma reference** — chances are Infinity already has a fit you missed. If it genuinely doesn't (e.g., you need `bg-neutral-surface-medium-1.5` between `medium` and `medium2`), flag it as a design question before hardcoding a one-off color. The whole point of the token system is to constrain choices.

## Verification

`npm run tokens:verify` reads `src/shared/design-system/tokens/generated.json` and compares every value against the DTCG source under `tokens/source/`. Fails the build on any mismatch. Coverage:
- 94 color primitives
- 136 color semantics
- 13 spacing values
- 13 radius values
- 4 icon size values

Total: 260 token values verified.
