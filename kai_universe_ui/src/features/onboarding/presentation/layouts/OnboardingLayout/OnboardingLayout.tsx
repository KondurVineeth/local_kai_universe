import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@shared/ds/primitives';
import { useAppDispatch } from '@shared/store/hooks';

import { onboardingCompleted } from '../../store/slice';

import { OnboardingMark } from './OnboardingMark';
import { OnboardingProgress } from './OnboardingProgress';

import type { OnboardingStep } from '../../store/slice';

// Maps each step path to its index (0..4) in the visible progress bar.
const STEP_PATHS: readonly { readonly step: OnboardingStep; readonly path: string }[] = [
  { step: 'welcome', path: '/onboarding/welcome' },
  { step: 'mode', path: '/onboarding/mode' },
  { step: 'hardware', path: '/onboarding/hardware' },
  { step: 'model', path: '/onboarding/model' },
  { step: 'setup', path: '/onboarding/setup' },
];

// Full-bleed layout for the first-run wizard. Hides every shell chrome
// (primary nav, sidebars, top bar, model picker) so the user has exactly
// one path forward at any moment — per CLAUDE.md UX rule 1.
export function OnboardingLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentIdx = Math.max(
    0,
    STEP_PATHS.findIndex((s) => location.pathname.startsWith(s.path)),
  );
  const onSetup = currentIdx === STEP_PATHS.length - 1;

  // Skip routes to /discover, not /chat. Rationale: a skipped onboarding
  // means the user has zero installed models, so /chat would just show the
  // welcome placeholder with no way to start chatting. /discover is the
  // entry point for downloading a first model — putting the user in front
  // of that catalogue is the actionable next step.
  const onSkip = () => {
    dispatch(onboardingCompleted());
    navigate('/discover', { replace: true });
  };

  return (
    <div className="grid h-screen min-h-0 grid-rows-[auto_1fr_auto] bg-bg-base text-fg-default">
      <header className="flex items-center justify-between px-l py-m">
        {/* Step navigation (Back) lives in each screen's action row next to
            Continue — not here. This header keeps a left-side spacer so the
            brand mark stays optically centred against the right-side Skip. */}
        <span aria-hidden className="block w-[64px]" />
        <div className="flex items-center gap-m">
          <OnboardingMark size={24} />
          <span className="text-sm font-medium tracking-wide text-fg-default">Universe</span>
        </div>
        <div className="w-[64px] text-right">
          {!onSetup && (
            <Button variant="ghost" size="sm" onClick={onSkip} aria-label="Skip onboarding">
              Skip
            </Button>
          )}
        </div>
      </header>
      <main className="flex min-h-0 items-center justify-center overflow-y-auto px-l py-3xl">
        <div className="flex w-full max-w-2xl flex-col">
          <Outlet />
        </div>
      </main>
      <footer className="flex justify-center pb-l pt-m">
        <OnboardingProgress total={STEP_PATHS.length} currentIdx={currentIdx} />
      </footer>
    </div>
  );
}
