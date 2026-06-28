// Cross-cutting Redux types and typed hooks. Lives in shared so feature
// presentation layers can `import type { RootState } from '@shared/store/hooks'`
// without violating layer rules (feature-ui cannot import from @app/*).
//
// Each feature extends the open `RootStateShape` interface via declaration
// merging from its barrel:
//
//   declare module '@shared/store/hooks' {
//     interface RootStateShape { chat: ChatState; }
//   }
//
// The concrete store is still configured in @app/store/index.ts. The
// TypeScript types here just describe its shape.
import { useDispatch, useSelector, useStore, type TypedUseSelectorHook } from 'react-redux';

import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { Container } from '@shared/container';
import type { Store } from 'redux';

// Open interface — features augment via declaration merging.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RootStateShape {}

export type RootState = RootStateShape;
export type AppDispatch = ThunkDispatch<RootState, Container, UnknownAction>;
export type AppStore = Store<RootState> & { dispatch: AppDispatch };

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
// Typed `useStore` for cases where a handler needs to read fresh state after
// dispatch without subscribing (e.g. SplitPane's swap-then-navigate flow).
export const useAppStore: () => AppStore = useStore as () => AppStore;
