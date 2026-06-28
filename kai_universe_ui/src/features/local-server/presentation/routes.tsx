import { LocalServerPage } from './components/LocalServerPage';
import { LocalServerLayout } from './layouts/LocalServerLayout';

import type { RouteObject } from 'react-router-dom';

export const localServerRoutes: RouteObject[] = [
  {
    path: 'local-server',
    element: <LocalServerLayout />,
    children: [{ index: true, element: <LocalServerPage /> }],
  },
];
