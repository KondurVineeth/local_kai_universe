import { DocPagePage } from './components/DocPagePage';
import { DocsIndexRedirect } from './components/DocsIndexRedirect';
import { DeveloperDocsLayout } from './layouts/DeveloperDocsLayout';

import type { RouteObject } from 'react-router-dom';

export const developerDocsRoutes: RouteObject[] = [
  {
    path: 'developer-docs',
    element: <DeveloperDocsLayout />,
    children: [
      // Resumes the last-visited page instead of always redirecting to
      // the introduction — see DocsIndexRedirect.
      { index: true, element: <DocsIndexRedirect /> },
      { path: ':slug', element: <DocPagePage /> },
    ],
  },
];
