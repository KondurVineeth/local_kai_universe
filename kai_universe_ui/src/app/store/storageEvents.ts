// Cross-cutting storage events. Lives at the app/store layer because both the
// redux-persist storage adapter (persist.ts) and feature repositories may need
// to surface low-level write failures (e.g. localStorage QuotaExceededError)
// to the rest of the app — typically so a shell-level toast can react.
//
// The action is a no-op as far as state goes; downstream features attach their
// own listeners (e.g. notifications middleware) when they want to surface it.
// We deliberately keep the payload narrow — `key` for diagnostic context plus
// the original error message — so future consumers don't need to refactor.
import { createAction } from '@reduxjs/toolkit';

export interface StorageQuotaExceededPayload {
  readonly key: string;
  readonly message: string;
}

export const storageQuotaExceeded = createAction<StorageQuotaExceededPayload>(
  'storage/quotaExceeded',
);

// Indirection registry — the store wires its dispatch in here at boot, and
// pre-store callers (the persist storage adapter) read from it lazily. Avoids
// a circular import between persist.ts and store/index.ts.
type Dispatcher = (action: unknown) => unknown;
let registeredDispatch: Dispatcher | null = null;

export function registerStorageDispatcher(dispatch: Dispatcher): void {
  registeredDispatch = dispatch;
}

export function reportStorageQuotaExceeded(payload: StorageQuotaExceededPayload): void {
  if (registeredDispatch) {
    registeredDispatch(storageQuotaExceeded(payload));
    return;
  }
  // No store yet (very early boot or test harness without a store). Log so the
  // failure isn't silently lost — but don't throw, the persist adapter must
  // resolve its promise.
  // eslint-disable-next-line no-console
  console.warn('[storage] quota exceeded before store ready', payload);
}
