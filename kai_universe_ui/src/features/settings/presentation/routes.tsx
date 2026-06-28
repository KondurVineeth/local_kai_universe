import { Navigate } from 'react-router-dom';


import { AppearancePanel } from './components/panels/AppearancePanel';
import { ChatPanel } from './components/panels/ChatPanel';
import { DeveloperPanel } from './components/panels/DeveloperPanel';
import { GeneralPanel } from './components/panels/GeneralPanel';
import { HardwarePanel } from './components/panels/HardwarePanel';
import { IntegrationsPanel } from './components/panels/IntegrationsPanel';
import { LmLinkPanel } from './components/panels/LmLinkPanel';
import { ModelDefaultsPanel } from './components/panels/ModelDefaultsPanel';
import { RuntimePanel } from './components/panels/RuntimePanel';
import { SettingsLayout } from './layouts/SettingsLayout';

import type { RouteObject } from 'react-router-dom';

export const settingsRoutes: RouteObject[] = [
  {
    path: 'settings',
    element: <SettingsLayout />,
    children: [
      { index: true, element: <Navigate to="general" replace /> },
      { path: 'general', element: <GeneralPanel /> },
      { path: 'appearance', element: <AppearancePanel /> },
      { path: 'developer', element: <DeveloperPanel /> },
      { path: 'chat', element: <ChatPanel /> },
      { path: 'model-defaults', element: <ModelDefaultsPanel /> },
      { path: 'integrations', element: <IntegrationsPanel /> },
      { path: 'lm-link', element: <LmLinkPanel /> },
      { path: 'runtime', element: <RuntimePanel /> },
      { path: 'hardware', element: <HardwarePanel /> },
    ],
  },
];
