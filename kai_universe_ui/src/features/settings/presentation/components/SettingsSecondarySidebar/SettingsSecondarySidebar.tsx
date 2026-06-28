import {
  ChatCircleText,
  Code,
  Desktop,
  GearSix,
  Gauge,
  LinkSimple,
  PaintBrush,
  PlugsConnected,
  Robot,
  SignOut,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Link, useMatch, useNavigate } from 'react-router-dom';

import { onboardingReset } from '@features/onboarding';
import { ejectModelThunk, selectLoadedModelId } from '@features/shell';
import { SecondarySidebar } from '@shared/ds/layouts';
import { Button, ConfirmDialog, Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import type { IconType } from '@shared/ds/primitives';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: IconType;
}

const NAV_ITEMS: readonly NavItem[] = [
  { path: '/settings/general', label: 'General', icon: GearSix },
  { path: '/settings/appearance', label: 'Appearance', icon: PaintBrush },
  { path: '/settings/developer', label: 'Developer', icon: Code },
  { path: '/settings/chat', label: 'Chat', icon: ChatCircleText },
  { path: '/settings/model-defaults', label: 'Model Defaults', icon: Robot },
  { path: '/settings/integrations', label: 'Integrations', icon: PlugsConnected },
  { path: '/settings/lm-link', label: 'Remote Link', icon: LinkSimple },
];

const SYSTEM_ITEMS: readonly NavItem[] = [
  { path: '/settings/runtime', label: 'Runtime', icon: Gauge },
  { path: '/settings/hardware', label: 'Hardware', icon: Desktop },
];

export function SettingsSecondarySidebar() {
  return (
    <SecondarySidebar
      title="Settings"
      footer={<AccountFooter />}
    >
      <nav className="flex flex-col gap-0.5 px-2 py-2" aria-label="Settings navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
        <div className="mt-2 px-2 pb-1 pt-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
            System
          </span>
        </div>
        {SYSTEM_ITEMS.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>
    </SecondarySidebar>
  );
}

function NavLink({ item }: { readonly item: NavItem }) {
  const match = useMatch(item.path);
  const active = match !== null;
  return (
    <Link
      to={item.path}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        active
          ? 'bg-accent text-fg-default'
          : 'text-fg-muted hover:bg-bg-raised hover:text-fg-default',
      )}
    >
      <Icon icon={item.icon} size="sm" />
      <span>{item.label}</span>
    </Link>
  );
}

// ZL Universe runs fully local — there is no account system. "Log out" here
// means "return to first-run state": eject the loaded model, reset the
// onboarding flow, and drop the user back at the welcome wizard (the same
// reset Settings → General exposes as "Replay onboarding"). The footer stays
// honest about being a local profile rather than implying a sign-in exists.
function AccountFooter() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loadedId = useAppSelector(selectLoadedModelId);
  const [confirming, setConfirming] = useState(false);

  const doLogout = () => {
    setConfirming(false);
    if (loadedId !== null) void dispatch(ejectModelThunk());
    dispatch(onboardingReset());
    navigate('/onboarding/welcome');
  };

  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-raised text-fg-subtle">
        <Icon icon={Desktop} size="sm" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-fg-default">Local profile</span>
        <span className="text-[10px] text-fg-subtle">Runs entirely on this device</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label="Log out"
        title="Log out"
        className="ml-auto"
        onClick={() => setConfirming(true)}
      >
        <Icon icon={SignOut} size="sm" />
      </Button>
      {confirming && (
        <ConfirmDialog
          title="Log out?"
          message="This ejects the loaded model and returns you to the first-run setup. Your installed models and chats stay on this device."
          confirmLabel="Log out"
          destructive
          onCancel={() => setConfirming(false)}
          onConfirm={doLogout}
        />
      )}
    </div>
  );
}
