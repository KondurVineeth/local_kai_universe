// Re-exports from shared so anything in @app can use the same typed hooks
// uniformly. Feature presentation layers MUST import from @shared/store/hooks
// (the boundary rules forbid feature-ui → app).
export {
  useAppDispatch,
  useAppSelector,
  type AppDispatch,
  type RootState,
  type RootStateShape,
} from '@shared/store/hooks';
