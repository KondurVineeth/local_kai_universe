import { Navigate, type RouteObject } from 'react-router-dom';

import { chatRoutes } from '@features/chat';
import { developerDocsRoutes } from '@features/developer-docs';
import { discoverRoutes } from '@features/discover';
import { localServerRoutes } from '@features/local-server';
import { myModelsRoutes } from '@features/my-models';
import { onboardingRoutes } from '@features/onboarding';
import { remoteRoutes } from '@features/remote';
import { settingsRoutes } from '@features/settings';
import { AppShellLayout } from '@features/shell';

import { OnboardingBootGuard } from './OnboardingBootGuard';

// Two top-level branches:
//   /onboarding/*  — full-bleed wizard, no shell chrome. Mounted outside
//                    AppShellLayout so the user can't escape mid-flow.
//   /*             — main app, gated by `OnboardingBootGuard`. On first
//                    launch the guard redirects to /onboarding/welcome
//                    before rendering the shell.
export const routes: RouteObject[] = [
  ...onboardingRoutes,
  {
    path: '/',
    element: (
      <OnboardingBootGuard>
        <AppShellLayout />
      </OnboardingBootGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/chat" replace /> },
      ...chatRoutes,
      ...discoverRoutes,
      ...myModelsRoutes,
      ...localServerRoutes,
      ...developerDocsRoutes,
      ...remoteRoutes,
      ...settingsRoutes,
    ],
  },
];
