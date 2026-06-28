import { MyModelsPage } from './components/MyModelsPage';
import { MyModelsLayout } from './layouts/MyModelsLayout';

import type { RouteObject } from 'react-router-dom';

export const myModelsRoutes: RouteObject[] = [
  {
    path: 'my-models',
    element: <MyModelsLayout />,
    children: [{ index: true, element: <MyModelsPage /> }],
  },
];
