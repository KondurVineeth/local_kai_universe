import { Check, X } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';

// ---------------------------------------------------------------------------
// PanelLayout
// ---------------------------------------------------------------------------

interface PanelLayoutProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly headerExtra?: ReactNode;
}

export function PanelLayout({ title, children, headerExtra }: PanelLayoutProps) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-border-default px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-fg-default">{title}</h1>
          {headerExtra}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/chat')}
          aria-label="Close settings"
        >
          <Icon icon={X} size="sm" />
        </Button>
      </header>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-4">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SettingGroup
// ---------------------------------------------------------------------------

interface SettingGroupProps {
  readonly sectionTitle?: string;
  readonly children: ReactNode;
}

export function SettingGroup({ sectionTitle, children }: SettingGroupProps) {
  // Section title renders as a small uppercase eyebrow (10px, tracking-wide,
  // fg-subtle) so it visually subordinates to the panel title (16px) and
  // doesn't compete with row labels (14px). Matches the 3-size IA rule
  // and the pattern used elsewhere (chat row's "Move to folder" header).
  return (
    <div className="flex flex-col gap-2">
      {sectionTitle && (
        <p className="px-1 text-[10px] font-medium uppercase tracking-wider text-fg-subtle">
          {sectionTitle}
        </p>
      )}
      <div className="overflow-hidden rounded-lg border border-border-default bg-bg-surface">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SettingRow
// ---------------------------------------------------------------------------

interface SettingRowProps {
  readonly label: string;
  readonly sub?: string;
  readonly children?: ReactNode;
  readonly labelClass?: string;
  // Optional anchor id. When the URL fragment matches, the row scrolls into
  // view + flashes an accent ring so users can find a deep-linked setting
  // (e.g. /settings/lm-link#enable-remote) without hunting visually.
  readonly id?: string;
}

export function SettingRow({ label, sub, children, labelClass, id }: SettingRowProps) {
  const highlighted = useScrollIntoViewOnHash(id);
  return (
    <div
      id={id}
      className={cn(
        'flex items-center justify-between gap-4 border-t border-border-default px-4 py-3 transition-shadow first:border-t-0',
        highlighted && 'ring-2 ring-accent ring-offset-2 ring-offset-bg-surface',
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn('text-sm text-fg-default', labelClass)}>{label}</span>
        {sub && <span className="text-xs text-fg-subtle">{sub}</span>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function useScrollIntoViewOnHash(id: string | undefined): boolean {
  const { hash } = useLocation();
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!id) return;
    if (hash.replace(/^#/, '') !== id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setActive(true);
    const timer = setTimeout(() => setActive(false), 1600);
    return () => clearTimeout(timer);
  }, [id, hash]);
  return active;
}

// ---------------------------------------------------------------------------
// OffOnToggle
// ---------------------------------------------------------------------------

interface OffOnToggleProps {
  readonly checked: boolean;
  readonly onCheckedChange: (v: boolean) => void;
}

export function OffOnToggle({ checked, onCheckedChange }: OffOnToggleProps) {
  return (
    <div className="flex overflow-hidden rounded-md border border-border-default text-xs font-medium">
      <button
        type="button"
        onClick={() => onCheckedChange(false)}
        className={cn(
          'px-3 py-1 transition-colors',
          !checked
            ? 'bg-bg-raised text-fg-default'
            : 'bg-transparent text-fg-subtle hover:text-fg-default',
        )}
      >
        OFF
      </button>
      <button
        type="button"
        onClick={() => onCheckedChange(true)}
        className={cn(
          'px-3 py-1 transition-colors',
          checked
            ? 'bg-accent text-fg-default'
            : 'bg-transparent text-fg-subtle hover:text-fg-default',
        )}
      >
        ON
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RadioRow
// ---------------------------------------------------------------------------

interface RadioRowProps {
  readonly label: string;
  readonly sub?: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

export function RadioRow({ label, sub, selected, onSelect }: RadioRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-start gap-3 border-t border-border-default px-4 py-3 text-left transition-colors hover:bg-bg-raised first:border-t-0"
    >
      <div className="mt-0.5 shrink-0">
        {selected ? (
          <div className="h-4 w-4 rounded-full bg-accent" />
        ) : (
          <div className="h-4 w-4 rounded-full border-2 border-fg-subtle" />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-fg-default">{label}</span>
        {sub && <span className="text-xs text-fg-subtle">{sub}</span>}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// KeyBadge
// ---------------------------------------------------------------------------

export function KeyBadge({ children }: { readonly children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border-default bg-bg-raised px-1 text-[10px] font-medium text-fg-default">
      {children}
    </kbd>
  );
}

// ---------------------------------------------------------------------------
// useTransientFlag — drives "applied"/"saved" feedback for actions that, in
// the real app, imply async work. Returns a `flag` that pulses true for
// `durationMs` after `fire()` is called. Mock-appropriate: no real I/O.
// ---------------------------------------------------------------------------

export function useTransientFlag(durationMs = 1800): {
  readonly flag: boolean;
  readonly fire: () => void;
} {
  const [flag, setFlag] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const fire = useCallback(() => {
    clearTimeout(timer.current);
    setFlag(true);
    timer.current = setTimeout(() => setFlag(false), durationMs);
  }, [durationMs]);
  return { flag, fire };
}

// ---------------------------------------------------------------------------
// SavedHint — small inline "Saved" / "Applied" confirmation. Mounts only
// while visible so it reads as a momentary acknowledgement, not chrome.
// ---------------------------------------------------------------------------

export function SavedHint({
  show,
  label = 'Saved',
}: {
  readonly show: boolean;
  readonly label?: string;
}) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400">
      <Icon icon={Check} size="xs" weight="bold" />
      {label}
    </span>
  );
}
