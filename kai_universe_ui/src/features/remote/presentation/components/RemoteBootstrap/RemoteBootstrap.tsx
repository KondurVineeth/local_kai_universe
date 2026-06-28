import { useEffect } from 'react';

import { useAppDispatch } from '@shared/store/hooks';

import { resumePendingPeerThunk } from '../../store/thunks';

// One-shot effect that runs on first mount of the Remote feature layout.
// If a peer-spawn was scheduled in a previous session and didn't resolve
// before the user closed the app, the slice still has `pendingPeerSpawnAt`
// set — resume the timer so the device the user was "promised" actually
// shows up. Idempotent: no-ops when nothing's pending.
export function RemoteBootstrap() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(resumePendingPeerThunk());
  }, [dispatch]);
  return null;
}
