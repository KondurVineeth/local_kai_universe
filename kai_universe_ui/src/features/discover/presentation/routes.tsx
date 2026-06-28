import { DiscoverPage } from './components/DiscoverPage';
import { DiscoverLayout } from './layouts/DiscoverLayout';

import type { RouteObject } from 'react-router-dom';

export const discoverRoutes: RouteObject[] = [
  {
    path: 'discover',
    element: <DiscoverLayout />,
    children: [
      { index: true, element: <DiscoverPage /> },
      // Selecting a row sets the URL — same component, slice picks up
      // params.modelId via useParams.
      { path: ':modelId', element: <DiscoverPage /> },
    ],
  },
];
