import { Navigate } from 'react-router-dom';

import { HardwareScreen } from './components/HardwareScreen/HardwareScreen';
import { ModeScreen } from './components/ModeScreen/ModeScreen';
import { SetupScreen } from './components/SetupScreen/SetupScreen';
import { StarterModelScreen } from './components/StarterModelScreen/StarterModelScreen';
import { WelcomeScreen } from './components/WelcomeScreen/WelcomeScreen';
import { OnboardingLayout } from './layouts/OnboardingLayout/OnboardingLayout';

import type { RouteObject } from 'react-router-dom';

// Onboarding mounts at the root path (sibling of AppShellLayout) — not
// inside the shell — so the user has no shell chrome to escape into
// mid-flow. The boot guard in src/app/router/routes.tsx redirects to
// /onboarding/welcome on first launch (when `selectOnboardingCompleted`
// is false) and routes around it on subsequent launches.
export const onboardingRoutes: RouteObject[] = [
  {
    path: '/onboarding',
    element: <OnboardingLayout />,
    children: [
      { index: true, element: <Navigate to="/onboarding/welcome" replace /> },
      { path: 'welcome', element: <WelcomeScreen /> },
      { path: 'mode', element: <ModeScreen /> },
      { path: 'hardware', element: <HardwareScreen /> },
      { path: 'model', element: <StarterModelScreen /> },
      { path: 'setup', element: <SetupScreen /> },
    ],
  },
];
