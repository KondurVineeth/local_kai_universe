import { Navigate, useLocation } from 'react-router-dom';

import { selectOnboardingCompleted, selectOnboardingLastStep } from '@features/onboarding';
import { useAppSelector } from '@shared/store/hooks';

import type { ReactNode } from 'react';

// Boot guard for the main app shell. On first launch (or after a Settings
// "Replay onboarding") `selectOnboardingCompleted` is false, and the user
// is redirected to the wizard. After completion this becomes a transparent
// passthrough.
//
// We resume from the user's `lastStep` so a reload mid-onboarding lands
// them where they left off — Welcome is the safe default.
export function OnboardingBootGuard({ children }: { readonly children: ReactNode }) {
  const completed = useAppSelector(selectOnboardingCompleted);
  const lastStep = useAppSelector(selectOnboardingLastStep);
  const location = useLocation();
  if (!completed && !location.pathname.startsWith('/onboarding')) {
    const target = `/onboarding/${lastStep}`;
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
}
