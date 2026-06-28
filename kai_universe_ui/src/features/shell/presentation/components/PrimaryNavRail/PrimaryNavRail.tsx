import {
  BookOpen,
  ChatCircle,
  Code,
  Compass,
  Gear,
  HardDrives,
  LinkSimple,
} from '@phosphor-icons/react';
import { NavLink, useMatch } from 'react-router-dom';

import { Icon, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';

import type { PrimaryNavItem } from './PrimaryNavRail.types';

// LMS-SHELL-002 — Primary navigation rail.
//
// IA: chunked into PRIMARY work surfaces (top) and SECONDARY system surfaces
// (bottom) per Hick's Law and Gestalt proximity.
//
// Geometry (per user spec):
//   * rail padding: 8px (p-2) — between rail edges and the icon buttons
//   * icon button padding: 8px (p-2) — between button edges and the icon
//   * icon: 16×16 (size="md") — centered inside its 32×32 button
//   * gap between buttons: 8px (gap-2)
//   * rail width: 48px = 8 + 32 + 8
const PRIMARY_NAV: readonly PrimaryNavItem[] = [
  { key: 'chat', label: 'Chat', to: '/chat', icon: ChatCircle },
  { key: 'discover', label: 'Discover', to: '/discover', icon: Compass },
  { key: 'my-models', label: 'My Models', to: '/my-models', icon: HardDrives },
  { key: 'local-server', label: 'Local Server', to: '/local-server', icon: Code },
];

const SECONDARY_NAV: readonly PrimaryNavItem[] = [
  { key: 'developer-docs', label: 'Developer Docs', to: '/developer-docs', icon: BookOpen },
  { key: 'remote', label: 'Remote', to: '/remote', icon: LinkSimple },
  { key: 'settings', label: 'Settings', to: '/settings', icon: Gear },
];

export interface PrimaryNavRailProps {
  // Edge the rail sits on. Controls which side gets the divider border so
  // it always faces the main content. Defaults to 'left'.
  readonly position?: 'left' | 'right';
}

export function PrimaryNavRail({ position = 'left' }: PrimaryNavRailProps) {
  return (
    <aside
      className={cn(
        'flex h-full w-full flex-col items-center justify-between border-border-default bg-bg-surface p-2',
        position === 'right' ? 'border-l' : 'border-r',
      )}
    >
      <nav aria-label="Primary navigation" className="flex flex-col items-center gap-2">
        {PRIMARY_NAV.map((item) => (
          <NavRailItem key={item.key} item={item} />
        ))}
      </nav>
      <nav aria-label="Secondary navigation" className="flex flex-col items-center gap-2">
        {SECONDARY_NAV.map((item) => (
          <NavRailItem key={item.key} item={item} />
        ))}
      </nav>
    </aside>
  );
}

function NavRailItem({ item }: { readonly item: PrimaryNavItem }) {
  // isActive is computed externally via useMatch and passed as a STRING className.
  // NavLink's built-in `className={({isActive}) => ...}` function pattern is
  // incompatible with Radix Tooltip's `asChild` slot — Radix's prop merging
  // stringifies the function (`Function.prototype.toString()`) and writes the
  // source code into the class attribute, leaving every Tailwind class unparsed.
  // Icons rendered without color/sizing as a result. Verified 2026-05-06.
  const match = useMatch({ path: item.to, end: false });
  const isActive = match !== null;
  return (
    <Tooltip content={item.label} side="right">
      <NavLink
        to={item.to}
        className={cn(
          // 8px padding wraps a 16×16 icon → 32×32 hit target.
          'inline-flex items-center justify-center rounded-md p-2 leading-none transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          // 3-tier surface progression for the rail:
          //   page canvas        = #0D0D0D (Static Black)
          //   rail aside         = #171717 (Surface/Low)
          //   active/hover button = #262626 (Surface/Medium)
          isActive
            ? 'bg-bg-raised text-fg-default'
            : 'text-fg-subtle hover:bg-bg-raised hover:text-fg-default',
        )}
        aria-label={item.label}
      >
        <Icon icon={item.icon} size="md" weight="regular" />
      </NavLink>
    </Tooltip>
  );
}
