import { Provider as ReduxProvider } from 'react-redux';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import { ContainerProvider } from '@shared/container-context';

import { routes } from './router/routes';
import { container, persistor, store } from './store';

// Hash router — Electron loads via file:// in production, where BrowserRouter
// would break on path-based reloads. Hash routing is invariant under file
// loading and works in both dev (devServer) and packaged builds.
const router = createHashRouter(routes);

export function App() {
  return (
    <ContainerProvider value={container}>
      <ReduxProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <RouterProvider router={router} />
        </PersistGate>
      </ReduxProvider>
    </ContainerProvider>
  );
}
