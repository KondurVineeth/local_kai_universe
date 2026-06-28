import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { listEndpoints } from '../../../application/use-cases/listEndpoints';
import {
  selectEndpointsTab,
  selectServerStatus,
  selectSyntheticTrafficEnabled,
} from '../../store/selectors';
import { simulateRequestThunk } from '../../store/thunks';

// Headless background runner: while the server is running AND the user has
// flipped "Simulate traffic" on, fire one random API request every 5-8s
// against the currently-active API tab. Gives the log panel something to
// chew on during demos when no one is actually exercising the chat. Stops
// the moment either flag flips off — interval is cleared on unmount and
// on dep change.
export function SyntheticTrafficRunner() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectServerStatus);
  const enabled = useAppSelector(selectSyntheticTrafficEnabled);
  const activeTab = useAppSelector(selectEndpointsTab);

  useEffect(() => {
    if (status !== 'running' || !enabled) return;
    const endpoints = listEndpoints(activeTab);
    if (endpoints.length === 0) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      if (cancelled) return;
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      if (endpoint) {
        const latencyMs = 10 + Math.floor(Math.random() * 350);
        dispatch(
          simulateRequestThunk({
            method: endpoint.method,
            path: endpoint.path,
            status: 200,
            latencyMs,
          }),
        );
      }
      timer = setTimeout(tick, 5000 + Math.random() * 3000);
    };
    timer = setTimeout(tick, 2000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [dispatch, status, enabled, activeTab]);

  return null;
}
