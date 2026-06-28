import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';

import { createContainer } from '@app/container/createContainer';

import { PERSIST_LIFECYCLE_ACTIONS, persistedRootReducer } from './persist';
import { registerStorageDispatcher } from './storageEvents';

import type { Container } from '@app/container/Container';


// Build the DI container once at boot. The same instance is:
//  1. Provided to React via <ContainerProvider>
//  2. Injected as `thunk.extraArgument` so feature thunks/use cases can access ports
//  3. Injected as RTK Query's `extra` so queryFn implementations can call ports
export const container: Container = createContainer();

export const store = configureStore({
  reducer: persistedRootReducer,
  middleware: (getDefault) =>
    getDefault({
      thunk: { extraArgument: container },
      serializableCheck: {
        ignoredActions: [...PERSIST_LIFECYCLE_ACTIONS],
      },
    }),
});

// Wire the storage-events indirection so the persist storage adapter can
// dispatch quota-exceeded actions without importing the store directly.
registerStorageDispatcher(store.dispatch);

export const persistor = persistStore(store);

export type AppStore = typeof store;
