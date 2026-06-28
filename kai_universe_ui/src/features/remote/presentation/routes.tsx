import { RemotePage } from './components/RemotePage';
import { RemoteLayout } from './layouts/RemoteLayout';

import type { RouteObject } from 'react-router-dom';

export const remoteRoutes: RouteObject[] = [
  {
    path: 'remote',
    element: <RemoteLayout />,
    children: [{ index: true, element: <RemotePage /> }],
  },
];
